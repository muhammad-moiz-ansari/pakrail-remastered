import {
  restore,
  earliestStep,
  trains,
  type Booking,
  seatKey,
} from "./booking";
import { currentSampleServiceId } from "./coach-layouts";
export class CheckoutError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}
export function checkoutSnapshot(value: unknown): Booking {
  let b: Booking;
  try {
    b = restore(JSON.stringify(value));
  } catch {
    throw new CheckoutError(
      "INVALID_DRAFT",
      "Your draft could not be validated. Review your journey.",
      400,
    );
  }
  if (b.status !== "draft")
    throw new CheckoutError(
      "INVALID_DRAFT",
      "Completed bookings cannot be submitted as new drafts.",
      400,
    );
  // Only extract the known model, never store extra client fields or identity claims.
  return {
    version: 1,
    search: b.search,
    legs: b.legs,
    passengers: b.passengers.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      gender: p.gender,
    })),
    assignments: b.assignments,
    contact: { name: b.contact.name, email: b.contact.email },
    voucher: b.voucher,
    status: "draft",
    reference: "",
    scenario: "normal",
    conflictHandled: true,
    suggested: {},
  };
}
export function validateCheckout(b: Booking) {
  if (earliestStep(b) < 6)
    throw new CheckoutError(
      "INCOMPLETE",
      "Review your train, class, traveller details and places before continuing.",
    );
  for (const leg of b.legs) {
    const expected = trains(b.search, leg.id).find(
      (t) => t.id === leg.train.id,
    );
    if (!expected || JSON.stringify(expected) !== JSON.stringify(leg.train))
      throw new CheckoutError(
        "PRICE_CHANGED",
        "The train or fare has changed. Review your train selection.",
      );
    if (
      !leg.offer ||
      leg.offer.serviceId !== currentSampleServiceId(leg.train.id)
    )
      throw new CheckoutError(
        "PRICE_CHANGED",
        "Choose a current class and coach layout before payment.",
      );
  }
}
export function inventoryKeys(b: Booking) {
  return b.legs
    .flatMap((l) =>
      b.passengers.map((p) => {
        const s = b.assignments[seatKey(l.id, p.id)];
        if (!s?.place)
          throw new CheckoutError(
            "INCOMPLETE",
            "Choose a numbered place for every traveller.",
          );
        // This prototype supports the exact itinerary segment, not a real track inventory.
        return JSON.stringify([
          l.train.id.split("-").at(-1),
          l.train.from,
          l.train.to,
          l.train.date,
          s.coach,
          s.place.layoutId,
          s.place.layoutVersion,
          s.place.physicalId,
        ]);
      }),
    )
    .sort();
}
export function assertDraftAccess(ownerId: string | null, userId?: string) {
  if (ownerId && ownerId !== userId)
    throw new CheckoutError(
      "FORBIDDEN",
      "This draft belongs to a different signed-in account.",
      403,
    );
}
export function assertHold(expiresAt: Date | null, now = new Date()) {
  if (!expiresAt || expiresAt.getTime() <= now.getTime())
    throw new CheckoutError(
      "HOLD_EXPIRED",
      "Your ten-minute place hold has expired. Your details are saved; check the same places again before payment.",
    );
}
