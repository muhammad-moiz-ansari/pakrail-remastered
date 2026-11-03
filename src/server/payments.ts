import { createHash } from "node:crypto";
import { database } from "./db/mongodb";
import { draftStore } from "./booking-drafts";
import { pricing } from "../lib/booking";
import {
  sandboxConfig,
  minorAmount,
  createTracker,
  checkoutUrl,
  eventSchema,
  verifyWebhook,
  paymentMatches,
} from "./safepay";
import { authOrigin } from "./auth";
export type Attempt = {
  _id: string;
  draftId: string;
  ownerId: string;
  amount: number;
  currency: "PKR";
  environment: "sandbox";
  merchant: string;
  state: "creating" | "pending" | "failed" | "succeeded" | "review_required";
  tracker?: string;
  createdAt: Date;
  expiresAt: Date;
  reason?: string;
};
export async function initiate(token: string | undefined, userId: string) {
  const draft = await (await draftStore()).checkout(token, userId),
    config = sandboxConfig(),
    db = await database();
  const amount = minorAmount(pricing(draft.snapshot).total);
  const id = createHash("sha256")
    .update(
      JSON.stringify([draft._id, draft.holdExpiresAt, amount, draft.snapshot]),
    )
    .digest("hex");
  const attempts = db.collection<Attempt>("sandbox_payment_attempts_v1");
  const record: Attempt = {
    _id: id,
    draftId: draft._id,
    ownerId: userId,
    amount,
    currency: "PKR",
    environment: "sandbox",
    merchant: config.key,
    state: "creating",
    createdAt: new Date(),
    expiresAt: draft.holdExpiresAt!,
  };
  try {
    await attempts.insertOne(record);
  } catch {
    const existing = await attempts.findOne({ _id: id, ownerId: userId });
    if (existing?.tracker && existing.state === "pending")
      return { id, url: checkoutUrl(existing.tracker, id, authOrigin()) };
    throw Error(
      "This payment attempt needs confirmation or review. Do not submit another payment.",
    );
  }
  try {
    const tracker = await createTracker(amount, id);
    await attempts.updateOne(
      { _id: id },
      { $set: { tracker, state: "pending" } },
    );
    return { id, url: checkoutUrl(tracker, id, authOrigin()) };
  } catch {
    await attempts.updateOne(
      { _id: id },
      {
        $set: { state: "review_required", reason: "provider_session_unknown" },
      },
    );
    throw Error(
      "The gateway could not confirm checkout. No local success was recorded; review this attempt before retrying.",
    );
  }
}
export async function receiveWebhook(raw: string, signature: string) {
  const c = sandboxConfig(true);
  if (!verifyWebhook(raw, signature, c.webhook))
    throw Error("INVALID_SIGNATURE");
  const payload: unknown = JSON.parse(raw);
  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) {
    const hash = createHash("sha256").update(raw).digest("hex");
    await (
      await database()
    )
      .collection<{ _id: string; receivedAt: Date; issues: string[] }>(
        "sandbox_webhook_rejections_v1",
      )
      .updateOne(
        { _id: hash },
        {
          $setOnInsert: {
            receivedAt: new Date(),
            issues: parsed.error.issues.map((issue) => issue.path.join(".")),
          },
        },
        { upsert: true },
      );
    throw Error("INVALID_EVENT");
  }
  const event = parsed.data;
  const receiptDb = await database();
  await receiptDb
    .collection<{
      _id: string;
      type: string;
      receivedAt: Date;
      merchantMatched: boolean;
    }>("sandbox_webhook_receipts_v1")
    .updateOne(
      { _id: event.token },
      {
        $setOnInsert: {
          type: event.type,
          receivedAt: new Date(),
          merchantMatched: event.merchant_api_key === c.key,
        },
      },
      { upsert: true },
    );
  if (event.merchant_api_key !== c.key) throw Error("WRONG_MERCHANT");
  const db = receiptDb,
    attempts = db.collection<Attempt>("sandbox_payment_attempts_v1");
  const attempt = await attempts.findOne({
    tracker: event.data.tracker,
    merchant: c.key,
    environment: "sandbox",
  });
  if (!attempt) return; // Valid dashboard/test or unrelated tracker: acknowledge, never issue a ticket.
  if (event.type === "payment.succeeded" && !paymentMatches(event, attempt))
    throw Error("PAYMENT_MISMATCH");
  // Store only minimal validated payment facts; never raw identity/card payloads.
  await db.collection("sandbox_payment_events_v1").updateOne(
    { _id: event.token as never },
    {
      $setOnInsert: {
        attemptId: attempt._id,
        type: event.type,
        receivedAt: new Date(),
      },
    },
    { upsert: true },
  );
  if (attempt.state === "succeeded") return;
  if (event.type === "payment.failed") {
    await attempts.updateOne(
      { _id: attempt._id, state: { $nin: ["succeeded", "review_required"] } },
      { $set: { state: "failed" } },
    );
    return;
  }
  if (event.type !== "payment.succeeded") return;
  if (attempt.expiresAt.getTime() <= Date.now()) {
    await attempts.updateOne(
      { _id: attempt._id, state: { $ne: "succeeded" } },
      {
        $set: {
          state: "review_required",
          reason: "payment_after_hold_expired",
        },
      },
    );
    return;
  }
  try {
    await (
      await draftStore()
    ).completePayment(attempt.draftId, attempt.ownerId);
    await attempts.updateOne(
      { _id: attempt._id },
      { $set: { state: "succeeded" } },
    );
  } catch {
    await attempts.updateOne(
      { _id: attempt._id, state: { $ne: "succeeded" } },
      {
        $set: {
          state: "review_required",
          reason: "inventory_or_booking_requires_review",
        },
      },
    );
  }
}
