import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freshBooking,
  addDays,
  today,
  trains,
  recommend,
  type Booking,
  pricing,
} from "../src/lib/booking";
import { ticketDocument } from "../src/lib/ticket-document";

function fixture(count = 1, round = false): Booking {
  let b = freshBooking();
  b.search = {
    from: "LHE",
    to: "RWP",
    date: addDays(today(), 1),
    returnDate: round ? addDays(today(), 2) : "",
    trip: round ? "return" : "oneway",
    adults: count,
    children: 0,
  };
  b.passengers = Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Test Traveller ${i + 1}`,
    type: "adult",
    gender: "prefer_not_to_say",
  }));
  b.contact = { name: "Private Contact", email: "private@example.com" };
  b.legs = [{ id: "outbound", train: trains(b.search)[0], classId: "economy" }];
  if (round)
    b.legs.push({
      id: "return",
      train: trains(b.search, "return")[1],
      classId: "standard",
    });
  b = recommend(b);
  return { ...b, status: "paid", reference: "DFY-1234ABCD" };
}

test("ticket documents reject pending, malformed and incomplete snapshots", () => {
  const b = fixture();
  assert.equal(ticketDocument({ ...b, status: "draft" }), null);
  assert.equal(ticketDocument({ ...b, reference: "guessed-id" }), null);
  assert.equal(ticketDocument({ ...b, assignments: {} }), null);
  assert.equal(
    ticketDocument({ ...b, status: "cancelled" } as unknown as Booking),
    null,
  );
});
test("test ticket exposes only ticket data and never contact or payment secrets", () => {
  const b = fixture();
  const ticket = ticketDocument(b)!;
  assert.equal(ticket.status, "Test payment completed");
  assert.equal(ticket.reference, b.reference);
  assert.equal(ticket.legs[0].passengers.length, 1);
  assert.ok(!JSON.stringify(ticket).includes("private@example.com"));
  assert.ok(!JSON.stringify(ticket).includes("Private Contact"));
});
test("return group tickets retain leg-specific places, dates and discounted totals without mutation", () => {
  const b = fixture(3, true);
  b.voucher = "DEMO10";
  const before = JSON.stringify(b),
    ticket = ticketDocument(b)!;
  assert.equal(ticket.legs.length, 2);
  assert.equal(ticket.legs[0].from, ticket.legs[1].to);
  assert.equal(ticket.legs[1].date, b.search.returnDate);
  assert.equal(ticket.legs[1].passengers.length, 3);
  assert.equal(
    ticket.legs[0].passengers[0].coach,
    b.assignments["outbound:p0"].coach,
  );
  assert.deepEqual(ticket.totals, pricing(b));
  assert.equal(JSON.stringify(b), before);
});
test("historical completed tickets retain the old fare and dates", () => {
  const b = fixture();
  b.search.date = "2025-01-01";
  b.legs[0].train.date = b.search.date;
  const ticket = ticketDocument(b)!;
  assert.ok(ticket);
  assert.equal(ticket.legs[0].date, "2025-01-01");
});
