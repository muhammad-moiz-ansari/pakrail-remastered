import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allocationIsTogether,
  addDays,
  availableSeats,
  Booking,
  changeLeg,
  chooseSeat,
  earliestStep,
  fare,
  freshBooking,
  passengerErrors,
  pricing,
  recommend,
  restore,
  returnValid,
  searchErrors,
  seatKey,
  seatsComplete,
  sold,
  today,
  trains,
  unavailable,
  updatePassengers,
  validDate,
} from "../src/lib/booking";

test("allocation exposes when a group spans coaches instead of one row", () => {
  const b = group();
  assert.equal(allocationIsTogether(recommend(b), "outbound"), true);
  b.legs[0].classId = "business";
  const split = recommend(b);
  assert.equal(seatsComplete(split), true);
  assert.equal(allocationIsTogether(split, "outbound"), false);
});

function group(round = false): Booking {
  const b = freshBooking();
  b.search = {
    from: "LHE",
    to: "RWP",
    date: addDays(today(), 1),
    returnDate: round ? addDays(today(), 2) : "",
    trip: round ? "return" : "oneway",
    adults: 3,
    children: 0,
  };
  b.passengers = Array.from({ length: 3 }, (_, i) => ({
    id: `p${i}`,
    name: `Demo Traveller ${i + 1}`,
    gender: "prefer_not_to_say" as const,
    type: "adult" as const,
  }));
  b.contact = { name: "Demo Contact", email: "demo@example.com" };
  b.legs = [{ id: "outbound", train: trains(b.search)[0], classId: "economy" }];
  if (round)
    b.legs.push({
      id: "return",
      train: trains(b.search, "return")[1],
      classId: "standard",
    });
  return b;
}
test("Karachi date-only arithmetic handles month/year boundaries", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.match(today(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(validDate("2026-02-31"), false);
});
test("invalid search cannot pass the first guard", () => {
  const b = freshBooking();
  assert.ok(searchErrors(b.search).from);
  assert.equal(earliestStep(b), 0);
  b.search = { ...group().search, to: "LHE" };
  assert.match(searchErrors(b.search).to, /different/);
});
test("requires explicit one-way or return choice", () => {
  const b = group();
  b.search.trip = "undecided";
  assert.ok(searchErrors(b.search).date);
  b.search.trip = "return";
  b.search.returnDate = addDays(b.search.date, -1);
  assert.ok(searchErrors(b.search).date);
});
test("demo traveller limits and invalid date values are checked", () => {
  const b = group();
  b.search.adults = 7;
  assert.ok(searchErrors(b.search).passengers);
  b.search.adults = 0;
  assert.ok(searchErrors(b.search).passengers);
  b.search.adults = 1;
  b.search.date = "2026-02-31";
  assert.ok(searchErrors(b.search).date);
});
test("three adults receive unique free seats in the same row", () => {
  const b = recommend(group());
  assert.equal(seatsComplete(b), true);
  const seats = Object.values(b.assignments);
  assert.equal(new Set(seats.map((s) => `${s.coach}:${s.number}`)).size, 3);
  assert.ok(seats.every((s) => !sold(s.coach, s.number, "economy")));
  assert.equal(seats[0].coach, seats[2].coach);
  assert.equal(
    Math.floor((seats[0].number - 1) / 4),
    Math.floor((seats[2].number - 1) / 4),
  );
  assert.equal(earliestStep(b), 6);
});
test("manual changes survive recommendation reruns and remove recommendation badge", () => {
  let b = recommend(group());
  b = chooseSeat(b, "outbound", "p0", { coach: "B", number: 10 });
  assert.deepEqual(recommend(b).assignments, b.assignments);
  assert.equal(b.suggested["outbound:p0"], undefined);
});
test("atomic seat change rejects sold or duplicate assignments", () => {
  const b = recommend(group());
  assert.strictEqual(
    chooseSeat(b, "outbound", "p0", { coach: "A", number: 5 }),
    b,
  );
  assert.strictEqual(
    chooseSeat(b, "outbound", "p0", b.assignments["outbound:p1"]),
    b,
  );
  const n = chooseSeat(b, "outbound", "p0", { coach: "B", number: 10 });
  assert.notDeepEqual(
    n.assignments["outbound:p0"],
    b.assignments["outbound:p0"],
  );
  assert.deepEqual(n.assignments["outbound:p1"], b.assignments["outbound:p1"]);
});
test("round trip assigns six tickets and sums class fares per leg", () => {
  const b = recommend(group(true));
  assert.equal(Object.keys(b.assignments).length, 6);
  assert.equal(seatsComplete(b), true);
  assert.equal(pricing(b).base, (2400 + 4480) * 3);
  assert.equal(fare(b.legs[1]), 4480);
});
test("DEMO10 rounds once and removal restores full fare", () => {
  const b = group(true);
  b.legs[0].train.price = 2405;
  const base = pricing(b).base;
  b.voucher = "DEMO10";
  assert.equal(pricing(b).discount, Math.round(base * 0.1));
  assert.equal(pricing(b).total, base - Math.round(base * 0.1));
  b.voucher = "INVALID";
  assert.equal(pricing(b).total, base);
  b.voucher = "";
  assert.equal(pricing(b).total, base);
});
test("child pays same fixture fare and removal releases seats on both legs", () => {
  let b = recommend(group(true));
  const original = pricing(b).base;
  b = updatePassengers(
    b,
    b.passengers.map((p, i) => (i === 2 ? { ...p, type: "child" } : p)),
  );
  assert.equal(pricing(b).base, original);
  assert.equal(b.search.children, 1);
  b = updatePassengers(b, b.passengers.slice(0, 2));
  assert.equal(Object.keys(b.assignments).length, 4);
  assert.equal(b.search.adults, 2);
  assert.equal(b.assignments["return:p2"], undefined);
});
test("class edits invalidate only the affected leg and preserve names", () => {
  const b = recommend(group(true));
  const next = changeLeg(b, { ...b.legs[0], classId: "standard" });
  assert.equal(next.assignments["outbound:p0"], undefined);
  assert.deepEqual(next.assignments["return:p0"], b.assignments["return:p0"]);
  assert.deepEqual(next.passengers, b.passengers);
  assert.deepEqual(next.contact, b.contact);
  assert.equal(earliestStep(next), 4);
});
test("insufficient class capacity directs the traveller back to class selection", () => {
  let b = group();
  b = updatePassengers(b, [
    ...b.passengers,
    { id: "p3", name: "Demo Four", type: "adult" },
    { id: "p4", name: "Demo Five", type: "adult" },
  ]);
  b.legs[0].classId = "business";
  assert.equal(earliestStep(b), 2);
});
test("changing route/date prevents stale train review", () => {
  const b = recommend(group());
  b.search.to = "MUX";
  assert.equal(earliestStep(b), 1);
  b.search.to = "RWP";
  b.search.date = addDays(b.search.date, 1);
  assert.equal(earliestStep(b), 1);
});
test("overnight return must depart after the outbound arrival", () => {
  const b = group(true);
  b.search.to = "KHI";
  b.search.returnDate = addDays(b.search.date, 1);
  const out = trains(b.search).find((t) => t.departure === "22:00")!;
  const early = trains(b.search, "return")[0];
  const late = trains(b.search, "return")[2];
  assert.equal(out.arrivalDay, 1);
  assert.equal(returnValid(out, early), false);
  assert.equal(returnValid(out, late), true);
});
test("seat conflict retains unaffected assignments and rejects unavailable replacement", () => {
  const b = recommend(group(true));
  const lost = b.assignments["outbound:p0"];
  delete b.assignments["outbound:p0"];
  b.conflict = { legId: "outbound", seat: lost };
  b.conflictHandled = true;
  assert.equal(seatsComplete(b), false);
  assert.strictEqual(chooseSeat(b, "outbound", "p0", lost), b);
  assert.ok(b.assignments["return:p0"]);
  const next = chooseSeat(b, "outbound", "p0", { coach: "B", number: 10 });
  assert.ok(seatsComplete(next));
  assert.ok(unavailable(next, next.legs[0], lost));
});
test("recommendation fallback stays deterministic for six people", () => {
  let b = group();
  b = updatePassengers(b, [
    ...b.passengers,
    ...[3, 4, 5].map((i) => ({
      id: `p${i}`,
      name: `Demo ${i}`,
      type: "adult" as const,
    })),
  ]);
  assert.deepEqual(recommend(b), recommend(b));
  assert.ok(seatsComplete(recommend(b)));
});
test("every class supplies at least two schematic coaches", () => {
  for (const id of ["economy", "standard", "business"])
    assert.deepEqual(
      [...new Set(availableSeats(id).map((s) => s.coach))],
      ["A", "B"],
    );
});
test("validation reports precise traveller/contact errors", () => {
  const b = group();
  b.passengers[0].name = "";
  b.contact.email = "invalid";
  assert.ok(passengerErrors(b).p0);
  assert.ok(passengerErrors(b).contactEmail);
  assert.equal(earliestStep(b), 3);
});
test("restore accepts complete round trip and rejects corrupt/old state", () => {
  const b = recommend(group(true));
  assert.deepEqual(restore(JSON.stringify(b)), b);
  assert.throws(() => restore("{broken"));
  assert.throws(() => restore(JSON.stringify({ ...b, version: 0 })));
  assert.throws(() => restore(JSON.stringify({ ...b, passengers: [null] })));
  assert.throws(() =>
    restore(JSON.stringify({ ...b, contact: { name: 7, email: null } })),
  );
  assert.throws(() =>
    restore(
      JSON.stringify({ ...b, search: { ...b.search, date: "2020-01-01" } }),
    ),
  );
});
test("confirmation requires stable paid reference and complete valid booking", () => {
  const b = recommend(group());
  b.status = "paid";
  b.reference = "DFY-1234ABCD";
  assert.equal(restore(JSON.stringify(b)).reference, "DFY-1234ABCD");
  b.reference = "";
  assert.throws(() => restore(JSON.stringify(b)));
  b.reference = "DFY-1234ABCD";
  delete b.assignments[seatKey("outbound", "p0")];
  assert.throws(() => restore(JSON.stringify(b)));
});

test("gender is explicit for every adult and child, with nondisclosure accepted", () => {
  let b = group();
  b.passengers[1] = { ...b.passengers[1], type: "child", gender: undefined };
  assert.equal(
    passengerErrors(b)["p1-gender"],
    "Select a gender option for Passenger 2.",
  );
  b = updatePassengers(
    b,
    b.passengers.map((p) => ({ ...p, gender: "prefer_not_to_say" })),
  );
  assert.deepEqual(passengerErrors(b), {});
  assert.equal(earliestStep(b), 4);
});

test("gender stays attached to stable IDs across reorder, removal, seats and restore", () => {
  let b = group();
  b.passengers[0].gender = "female";
  b.passengers[1].gender = "male";
  b = recommend(b);
  b = updatePassengers(b, [b.passengers[1], b.passengers[0]]);
  const next = restore(JSON.stringify(b));
  assert.equal(next.passengers[0].id, "p1");
  assert.equal(next.passengers[0].gender, "male");
  assert.equal(next.passengers[1].gender, "female");
  assert.deepEqual(passengerErrors(next), {});
  assert.ok(seatsComplete(next));
  assert.equal(next.assignments["outbound:p2"], undefined);
});

test("older drafts leave gender unset and return to passenger validation", () => {
  const b = recommend(group());
  b.passengers.forEach((p) => {
    delete p.gender;
  });
  const next = restore(JSON.stringify(b));
  assert.equal(next.passengers[0].gender, undefined);
  assert.equal(earliestStep(next), 3);
  assert.equal(Object.keys(passengerErrors(next)).length, 3);
  assert.throws(() =>
    restore(
      JSON.stringify({
        ...b,
        passengers: [{ ...b.passengers[0], gender: "unknown" }],
      }),
    ),
  );
});

test("retired Other selections become unset without losing passenger details", () => {
  const b = group();
  const raw = JSON.stringify({
    ...b,
    passengers: b.passengers.map((p, i) =>
      i === 1 ? { ...p, gender: "other" } : p,
    ),
  });
  const next = restore(raw);
  assert.equal(next.passengers[1].gender, undefined);
  assert.equal(next.passengers[1].id, b.passengers[1].id);
  assert.equal(next.passengers[1].name, b.passengers[1].name);
  assert.equal(next.passengers[0].gender, "prefer_not_to_say");
  assert.ok(passengerErrors(next)["p1-gender"]);
});
