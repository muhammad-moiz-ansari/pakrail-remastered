import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import { database } from "./db/mongodb";
import {
  checkoutSnapshot,
  validateCheckout,
  inventoryKeys,
  assertDraftAccess,
  assertHold,
  CheckoutError,
} from "../lib/checkout-policy";
import { type Booking, pricing } from "../lib/booking";
export const draftCookie = "pakrail_draft";
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export type Draft = {
  _id: string;
  version: 1;
  tokenHash: string;
  ownerId: string | null;
  snapshot: Booking;
  state: "draft" | "completed";
  holdExpiresAt: Date | null;
  inventory: string[];
  createdAt: Date;
  updatedAt: Date;
  lockUntil: Date;
  completedAt?: Date;
};
type Hold = {
  _id: string;
  draftId: string;
  lease: string;
  expiresAt: Date;
  state: "held" | "booked";
};
export class DraftStore {
  constructor(private db: Db) {}
  private drafts() {
    return this.db.collection<Draft>("booking_drafts_v1");
  }
  private holds() {
    return this.db.collection<Hold>("demo_seat_holds_v1");
  }
  async indexes() {
    await Promise.all([
      this.drafts().createIndex({ tokenHash: 1 }, { unique: true }),
      this.drafts().createIndex({ ownerId: 1, completedAt: -1 }),
      this.holds().createIndex({ draftId: 1 }),
    ]);
  }
  async current(token?: string, userId?: string) {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const row = await this.drafts().findOne({ tokenHash: digest(token) });
    if (row) assertDraftAccess(row.ownerId, userId);
    return row;
  }
  async save(value: unknown, token?: string, userId?: string) {
    const snapshot = checkoutSnapshot(value);
    let row = await this.current(token, userId);
    if (!row || row.state === "completed") {
      token = randomBytes(32).toString("hex");
      row = {
        _id: randomUUID(),
        version: 1,
        tokenHash: digest(token),
        ownerId: userId ?? null,
        snapshot,
        state: "draft",
        holdExpiresAt: null,
        inventory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lockUntil: new Date(0),
      };
      await this.drafts().insertOne(row);
    } else {
      const id = row._id;
      row = await this.locked(id, async (current) => {
        assertDraftAccess(current.ownerId, userId);
        if (current.state !== "draft")
          throw new CheckoutError("COMPLETED", "Start a new booking.");
        const pending = await this.db
          .collection("sandbox_payment_attempts_v1")
          .findOne({
            draftId: id,
            state: { $in: ["creating", "pending"] },
            expiresAt: { $gt: new Date() },
          });
        if (
          pending &&
          JSON.stringify(snapshot) !== JSON.stringify(current.snapshot)
        )
          throw new CheckoutError(
            "PAYMENT_PENDING",
            "Checkout is pending. Wait for its status or hold expiry before changing this draft.",
          );
        let changed = false;
        if (current.inventory.length) {
          try {
            changed =
              JSON.stringify(inventoryKeys(snapshot)) !==
              JSON.stringify(current.inventory);
          } catch {
            changed = true;
          }
        }
        if (changed)
          await this.holds().deleteMany({ draftId: id, state: "held" });
        const next = {
          ...current,
          snapshot,
          updatedAt: new Date(),
          ...(changed ? { inventory: [], holdExpiresAt: null } : {}),
        };
        await this.drafts().updateOne(
          { _id: id },
          {
            $set: {
              snapshot: next.snapshot,
              updatedAt: next.updatedAt,
              inventory: next.inventory,
              holdExpiresAt: next.holdExpiresAt,
            },
          },
        );
        return next;
      });
    }
    return { row, token: token! };
  }
  private async locked<T>(
    id: string,
    operation: (row: Draft) => Promise<T>,
  ): Promise<T> {
    const now = new Date();
    const lockUntil = new Date(now.getTime() + 30000);
    const row = await this.drafts().findOneAndUpdate(
      { _id: id, lockUntil: { $lte: now } },
      { $set: { lockUntil } },
      { returnDocument: "after" },
    );
    if (!row)
      throw new CheckoutError(
        "BUSY",
        "Your booking is being updated. Please try again.",
      );
    try {
      return await operation(row);
    } finally {
      await this.drafts().updateOne(
        { _id: id, lockUntil },
        { $set: { lockUntil: new Date(0) } },
      );
    }
  }
  async claim(token: string | undefined, userId: string) {
    const row = await this.current(token, userId);
    if (!row) return null;
    // Atomic and idempotent: only a capability-authorized guest or this owner.
    const claimed = await this.drafts().findOneAndUpdate(
      { _id: row._id, ownerId: { $in: [null, userId] } },
      { $set: { ownerId: userId } },
      { returnDocument: "after" },
    );
    if (!claimed)
      throw new CheckoutError(
        "FORBIDDEN",
        "This draft cannot be claimed.",
        403,
      );
    return claimed;
  }
  async prepare(token: string | undefined, userId?: string, renew = false) {
    const row = await this.current(token, userId);
    if (!row)
      throw new CheckoutError(
        "NO_DRAFT",
        "Review your saved booking before continuing.",
      );
    return this.locked(row._id, async (current) => {
      assertDraftAccess(current.ownerId, userId);
      if (current.state !== "draft")
        throw new CheckoutError(
          "COMPLETED",
          "This booking is already completed.",
        );
      validateCheckout(current.snapshot);
      if (
        current.holdExpiresAt &&
        current.holdExpiresAt.getTime() <= Date.now() &&
        !renew
      )
        assertHold(current.holdExpiresAt);
      const expiresAt =
        current.holdExpiresAt && current.holdExpiresAt.getTime() > Date.now()
          ? current.holdExpiresAt
          : new Date(Date.now() + 10 * 60 * 1000);
      const keys = inventoryKeys(current.snapshot),
        lease = randomUUID();
      try {
        for (const key of keys) {
          await this.holds().updateOne(
            {
              _id: key,
              $or: [
                { draftId: current._id, state: "held" },
                { state: "held", expiresAt: { $lte: new Date() } },
              ],
            },
            { $set: { draftId: current._id, lease, expiresAt, state: "held" } },
            { upsert: true },
          );
        }
      } catch {
        await this.holds().deleteMany({
          draftId: current._id,
          state: "held",
          lease,
        });
        throw new CheckoutError(
          "PLACE_UNAVAILABLE",
          "One or more selected places are held by another booking. Your traveller details are saved; return to seats to choose again.",
        );
      }
      await this.drafts().updateOne(
        { _id: current._id },
        { $set: { inventory: keys, holdExpiresAt: expiresAt } },
      );
      return { ...current, inventory: keys, holdExpiresAt: expiresAt };
    });
  }
  async checkout(token: string | undefined, userId: string) {
    const row = await this.current(token, userId);
    if (!row || row.ownerId !== userId || row.state !== "draft")
      throw new CheckoutError(
        "FORBIDDEN",
        "No authorized draft is available for payment.",
        403,
      );
    validateCheckout(row.snapshot);
    assertHold(row.holdExpiresAt);
    const held = await this.holds().countDocuments({
      _id: { $in: row.inventory },
      draftId: row._id,
      state: "held",
      expiresAt: { $gt: new Date() },
    });
    if (!row.inventory.length || held !== row.inventory.length)
      throw new CheckoutError(
        "PLACE_UNAVAILABLE",
        "Your selected places need checking again. Return to review.",
      );
    return row;
  }
  async completePayment(id: string, userId: string) {
    const existing = await this.drafts().findOne({ _id: id, ownerId: userId });
    if (!existing || existing.ownerId !== userId)
      throw new CheckoutError(
        "FORBIDDEN",
        "This booking is not available.",
        403,
      );
    if (existing.state === "completed") return existing;
    return this.locked(existing._id, async (row) => {
      assertDraftAccess(row.ownerId, userId);
      if (row.state === "completed") return row;
      validateCheckout(row.snapshot);
      assertHold(row.holdExpiresAt);
      // Recover safely after an interrupted simulation: already booked places of
      // this same draft can be reused, never another draft's inventory.
      const valid = await this.holds().countDocuments({
        _id: { $in: row.inventory },
        draftId: row._id,
        $or: [
          { state: "held", expiresAt: { $gt: new Date() } },
          { state: "booked" },
        ],
      });
      if (!row.inventory.length || valid !== row.inventory.length)
        throw new CheckoutError(
          "PLACE_UNAVAILABLE",
          "A selected place is no longer held. Review your seats.",
        );
      await this.holds().updateMany(
        {
          _id: { $in: row.inventory },
          draftId: row._id,
          state: "held",
          expiresAt: { $gt: new Date() },
        },
        { $set: { state: "booked" } },
      );
      const booked = await this.holds().countDocuments({
        _id: { $in: row.inventory },
        draftId: row._id,
        state: "booked",
      });
      if (booked !== row.inventory.length)
        throw new CheckoutError(
          "HOLD_EXPIRED",
          "Your hold expired before completion. Return to review.",
        );
      const snapshot = {
        ...row.snapshot,
        status: "paid" as const,
        reference: `DFY-${randomBytes(4).toString("hex").toUpperCase()}`,
        accountBookingId: row._id,
      };
      const completedAt = new Date();
      await this.drafts().updateOne(
        { _id: row._id, ownerId: userId, state: "draft" },
        { $set: { snapshot, state: "completed", completedAt } },
      );
      return { ...row, snapshot, state: "completed" as const, completedAt };
    });
  }
  async list(userId: string) {
    return this.drafts()
      .find(
        { ownerId: userId, state: "completed" },
        { projection: { _id: 1, snapshot: 1, completedAt: 1 } },
      )
      .sort({ completedAt: -1 })
      .limit(100)
      .toArray();
  }
  async owned(id: string, userId: string) {
    return this.drafts().findOne({
      _id: id,
      ownerId: userId,
      state: "completed",
    });
  }
}
export async function draftStore() {
  const store = new DraftStore(await database());
  await store.indexes();
  return store;
}
export function draftView(row: Draft) {
  return {
    id: row._id,
    snapshot: row.snapshot,
    holdExpiresAt: row.holdExpiresAt,
    totals: pricing(row.snapshot),
  };
}
