import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freshBooking,
  addDays,
  today,
  recommend,
  restore,
  trains,
} from "../src/lib/booking";
import {
  customerDraft,
  destinationDraft,
  editedSearchDraft,
} from "../src/lib/home-selection";
test("destination cards change only the destination, preserving group and dates", () => {
  const b = freshBooking();
  b.search = {
    ...b.search,
    from: "LHE",
    date: addDays(today(), 2),
    returnDate: addDays(today(), 4),
    trip: "return",
    adults: 3,
    children: 1,
  };
  b.contact = { name: "Contact Sample", email: "contact@example.com" };
  const next = destinationDraft(b, "ISB");
  assert.equal(next.search.to, "ISB");
  assert.equal(next.search.from, "LHE");
  assert.equal(next.search.date, b.search.date);
  assert.equal(next.search.returnDate, b.search.returnDate);
  assert.equal(next.search.adults, 3);
  assert.equal(next.search.children, 1);
  assert.strictEqual(next.passengers, b.passengers);
  assert.strictEqual(next.contact, b.contact);
});
test("same-origin destination remains visible for validation rather than silently changing the origin", () => {
  const b = freshBooking();
  b.search.from = "LHE";
  const next = destinationDraft(b, "LHE");
  assert.equal(next.search.from, "LHE");
  assert.equal(next.search.to, "LHE");
});
test("unsupported editorial destinations cannot invent station IDs", () => {
  const b = freshBooking();
  assert.strictEqual(destinationDraft(b, "UNKNOWN"), b);
});
test("retired tester scenarios cannot reopen while traveller state and reference are retained", () => {
  const b = freshBooking();
  b.scenario = "payment-failure";
  b.passengers[0].name = "Sample Traveller";
  b.contact.email = "sample@example.com";
  b.reference = "DFY-1234ABCD";
  b.conflict = { legId: "outbound", seat: { coach: "A", number: 1 } };
  b.conflictHandled = true;
  const next = customerDraft(b);
  assert.equal(next.scenario, "normal");
  assert.equal(next.conflict, undefined);
  assert.equal(next.conflictHandled, false);
  assert.strictEqual(next.passengers, b.passengers);
  assert.strictEqual(next.assignments, b.assignments);
  assert.strictEqual(next.search, b.search);
  assert.equal(next.reference, b.reference);
  assert.equal(next.contact.email, b.contact.email);
});
test("editing a confirmed journey remains restorable without losing travellers, seats or reference", () => {
  let b = freshBooking();
  b.search = {
    ...b.search,
    from: "LHE",
    to: "RWP",
    date: addDays(today(), 2),
    trip: "oneway",
  };
  b.passengers[0].name = "Sample Traveller";
  b.contact = { name: "Sample Traveller", email: "sample@example.com" };
  b.legs = [{ id: "outbound", train: trains(b.search)[0], classId: "economy" }];
  b = recommend(b);
  b.status = "paid";
  b.reference = "DFY-1234ABCD";
  assert.equal(restore(JSON.stringify(b)).status, "paid");
  assert.strictEqual(editedSearchDraft(b, { ...b.search }), b);
  const next = destinationDraft(b, "ISB");
  assert.equal(next.status, "draft");
  assert.strictEqual(next.passengers, b.passengers);
  assert.strictEqual(next.assignments, b.assignments);
  assert.strictEqual(next.legs, b.legs);
  const restored = restore(JSON.stringify(next));
  assert.equal(restored.reference, b.reference);
  assert.equal(restored.search.to, "ISB");
  assert.equal(restored.contact.email, b.contact.email);
});
