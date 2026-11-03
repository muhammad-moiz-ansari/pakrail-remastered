import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID, createHmac, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../src/server/db/mongodb";
import { draftStore } from "../src/server/booking-drafts";
import { initiate, receiveWebhook, type Attempt } from "../src/server/payments";
import { checkoutFixture } from "../tests/fixtures/checkout";
import { today, addDays, trains, recommend, pricing } from "../src/lib/booking";
import { sampleCoachServices, serviceOffers } from "../src/lib/coach-layouts";
import { minorAmount } from "../src/server/safepay";
import { ticketDocument } from "../src/lib/ticket-document";
loadEnvConfig(process.cwd());
async function main() {
  if (
    process.env.NODE_ENV === "production" ||
    !process.argv.includes("--run") ||
    /prod|live/i.test(process.env.MONGODB_DB ?? "")
  )
    throw Error(
      "Run only against configured development infrastructure with --run.",
    );
  const originalDb = process.env.MONGODB_DB!;
  process.env.MONGODB_DB =
    originalDb.slice(0, 30) + "_qa6_" + Date.now().toString(36);
  assert.notEqual(process.env.MONGODB_DB, originalDb);
  const provider = process.argv.includes("--provider");
  if (!provider) {
    process.env.SAFEPAY_SANDBOX_PUBLIC_KEY = "phase6-fixture-merchant";
    process.env.SAFEPAY_SANDBOX_SECRET = "phase6-fixture-server";
    process.env.SAFEPAY_SANDBOX_WEBHOOK_SECRET = "phase6-fixture-signature";
  }
  process.env.PAYMENT_MODE = "sandbox";
  process.env.SAFEPAY_SANDBOX_ENABLED = "true";
  const db = await database(),
    store = await draftStore();
  let ordinal = 0;
  const checks: string[] = [];
  const ok = (s: string) => {
    checks.push(s);
    console.log("PASS " + s);
  };
  async function draft() {
    const snapshot = checkoutFixture();
    const day = addDays(today(), 30 + ordinal++ * 3);
    snapshot.search.date = day;
    snapshot.search.returnDate = addDays(day, 1);
    snapshot.legs = snapshot.legs.map((leg, i) => {
      const train = trains(snapshot.search, leg.id)[0];
      const offer = serviceOffers(
        sampleCoachServices[0],
        train.from,
        train.to,
        train.date,
      ).find((o) => o.classId === (i ? "standard" : "economy"))!;
      return { ...leg, train, offer };
    });
    const saved = await store.save(
      recommend({ ...snapshot, assignments: {}, suggested: {} }),
    );
    await store.prepare(saved.token);
    const deadline = (await store.current(
      saved.token,
    ))!.holdExpiresAt!.getTime();
    await store.claim(saved.token, "phase6-qa-owner");
    assert.equal(
      (
        await store.checkout(saved.token, "phase6-qa-owner")
      ).holdExpiresAt!.getTime(),
      deadline,
    );
    return saved;
  }
  if (provider) {
    const saved = await draft();
    let status = 0;
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (...args) => {
      const response = await realFetch(...args);
      if (String(args[0]).startsWith("https://sandbox.api.getsafepay.com/"))
        status = response.status;
      return response;
    };
    try {
      const result = await initiate(saved.token, "phase6-qa-owner");
      console.log(
        JSON.stringify({
          mode: "actual sandbox session creation only; no card or payment",
          providerHttpStatus: status,
          trackerCreated: true,
          checkoutHost: new URL(result.url).host,
          qaDatabase: process.env.MONGODB_DB,
        }),
      );
    } catch {
      console.log(
        JSON.stringify({
          mode: "actual sandbox session creation only",
          providerHttpStatus: status,
          trackerCreated: false,
          qaDatabase: process.env.MONGODB_DB,
          blocker:
            "Provider session creation failed or response did not match the expected tracker contract; no checkout or paid booking claimed.",
        }),
      );
      process.exitCode = 2;
    }
    return;
  }
  const realFetch = globalThis.fetch;
  let unexpectedProviderRequests = 0;
  globalThis.fetch = async (...args) => {
    if (String(args[0]).includes("getsafepay.com")) {
      unexpectedProviderRequests++;
      throw Error("Provider requests are disabled in the synthetic audit.");
    }
    return realFetch(...args);
  };

  async function attempt() {
    const saved = await draft();
    const row = (await store.current(saved.token, "phase6-qa-owner"))!;
    const record: Attempt = {
      _id: createHash("sha256")
        .update(
          JSON.stringify([
            row._id,
            row.holdExpiresAt,
            minorAmount(pricing(row.snapshot).total),
            row.snapshot,
          ]),
        )
        .digest("hex"),
      draftId: row._id,
      ownerId: "phase6-qa-owner",
      amount: minorAmount(pricing(row.snapshot).total),
      currency: "PKR",
      environment: "sandbox",
      merchant: process.env.SAFEPAY_SANDBOX_PUBLIC_KEY!,
      state: "pending",
      tracker: "track_phase6_fixture_" + randomUUID(),
      createdAt: new Date(),
      expiresAt: row.holdExpiresAt!,
    };
    await db
      .collection<Attempt>("sandbox_payment_attempts_v1")
      .insertOne(record);
    return { saved, row, record };
  }
  function event(
    record: Attempt,
    type = "payment.succeeded",
    amount = record.amount,
  ) {
    const raw = JSON.stringify({
      token: "evt_phase6_fixture_" + randomUUID(),
      version: "2.0.0",
      merchant_api_key: record.merchant,
      type,
      data: {
        tracker: record.tracker,
        amount,
        currency: "PKR",
        metadata: { order_id: record._id },
      },
    });
    return {
      raw,
      signature: createHmac(
        "sha512",
        process.env.SAFEPAY_SANDBOX_WEBHOOK_SECRET!,
      )
        .update(raw)
        .digest("hex"),
    };
  }
  const success = await attempt();
  const e = event(success.record);
  await assert.rejects(receiveWebhook(e.raw, "0".repeat(128)));
  const mismatch = event(success.record, "payment.succeeded", 1);
  await assert.rejects(receiveWebhook(mismatch.raw, mismatch.signature));
  ok(
    "locally signed fixture: invalid signature and mismatched amount cannot complete booking",
  );
  await receiveWebhook(e.raw, e.signature);
  const first = (await store.owned(success.row._id, "phase6-qa-owner"))!;
  assert.ok(first);
  await receiveWebhook(e.raw, e.signature);
  const duplicate = (await store.owned(first._id, "phase6-qa-owner"))!;
  assert.equal(duplicate.snapshot.reference, first.snapshot.reference);
  assert.equal(
    await db
      .collection("booking_drafts_v1")
      .countDocuments({ state: "completed" }),
    1,
  );
  assert.equal(await store.owned(first._id, "different-owner"), null);
  assert.equal((await store.list("different-owner")).length, 0);
  ok(
    "locally signed fixture: duplicate success is idempotent and completed ticket is owner-scoped",
  );
  const parallel = await attempt();
  const parallelEvent = event(parallel.record);
  await Promise.all([
    receiveWebhook(parallelEvent.raw, parallelEvent.signature),
    receiveWebhook(parallelEvent.raw, parallelEvent.signature),
  ]);
  assert.ok(await store.owned(parallel.row._id, "phase6-qa-owner"));
  assert.equal(
    (await db
      .collection<Attempt>("sandbox_payment_attempts_v1")
      .findOne({ _id: parallel.record._id }))!.state,
    "succeeded",
  );
  ok(
    "concurrent duplicate fixture delivery creates one completed booking and converges to succeeded",
  );
  const document = ticketDocument(first.snapshot);
  assert.ok(document);
  assert.equal(document.legs.length, 2);
  assert.equal(document.legs[0].passengers.length, 2);
  assert.equal(
    JSON.stringify(document).includes(first.snapshot.contact.email),
    false,
  );
  await mkdir(".local/phase6", { recursive: true });
  await writeFile(
    ".local/phase6/ticket-fixture.json",
    JSON.stringify(first.snapshot),
  );
  ok(
    "isolated synthetic completion produces a two-leg group ticket without contact data",
  );
  const failed = await attempt();
  const failure = event(failed.record, "payment.failed");
  await receiveWebhook(failure.raw, failure.signature);
  await receiveWebhook(failure.raw, failure.signature);
  assert.equal(await store.owned(failed.row._id, "phase6-qa-owner"), null);
  await assert.rejects(initiate(failed.saved.token, "phase6-qa-owner"));
  assert.equal(
    await db
      .collection("sandbox_payment_attempts_v1")
      .countDocuments({ draftId: failed.row._id }),
    1,
  );
  ok(
    "failure fixture creates no ticket; retry fails closed without a duplicate provider attempt",
  );
  const expired = await attempt();
  await db
    .collection<Attempt>("sandbox_payment_attempts_v1")
    .updateOne(
      { _id: expired.record._id },
      { $set: { expiresAt: new Date(0) } },
    );
  const late = event(expired.record);
  await receiveWebhook(late.raw, late.signature);
  assert.equal(
    (await db
      .collection<Attempt>("sandbox_payment_attempts_v1")
      .findOne({ _id: expired.record._id }))!.state,
    "review_required",
  );
  assert.equal(await store.owned(expired.row._id, "phase6-qa-owner"), null);
  ok(
    "late success fixture after hold expiry is review-required and issues no ticket",
  );
  const lost = await attempt();
  await db
    .collection("demo_seat_holds_v1")
    .updateOne({ draftId: lost.row._id }, { $set: { expiresAt: new Date(0) } });
  const lostEvent = event(lost.record);
  await receiveWebhook(lostEvent.raw, lostEvent.signature);
  assert.equal(
    (await db
      .collection<Attempt>("sandbox_payment_attempts_v1")
      .findOne({ _id: lost.record._id }))!.state,
    "review_required",
  );
  assert.equal(await store.owned(lost.row._id, "phase6-qa-owner"), null);
  ok("lost inventory fixture cannot become a completed booking");
  assert.equal(unexpectedProviderRequests, 0);
  console.log(
    JSON.stringify({
      checks: checks.length,
      mode: "synthetic events only, not authentic provider payments",
      qaDatabase: process.env.MONGODB_DB,
      mainDatabaseUntouched: true,
    }),
  );
}
main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Phase 6 check failed");
    process.exitCode = 1;
  })
  .finally(closeDatabase);
