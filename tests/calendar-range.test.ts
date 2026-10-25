import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dragRange,
  selectCalendarDate,
  rangeGestureIntent,
} from "../src/lib/calendar-range";
import { addDays, freshBooking, today } from "../src/lib/booking";

test("full-range drag normalizes backward movement across months and years", () => {
  assert.deepEqual(
    dragRange("2027-01-08", "2026-12-29", "depart", "2026-12-01", "2026-10-25"),
    {
      date: "2026-12-29",
      returnDate: "2027-01-08",
    },
  );
});

test("return-only dragging preserves departure and rejects an earlier endpoint", () => {
  assert.deepEqual(
    dragRange("2026-11-20", "2026-11-12", "return", "2026-11-01", "2026-10-25"),
    {
      date: "2026-11-01",
      returnDate: "2026-11-12",
    },
  );
  assert.equal(
    dragRange("2026-11-20", "2026-10-30", "return", "2026-11-01", "2026-10-25"),
    null,
  );
});

test("same-day ranges stay valid, but past or impossible dates cannot be endpoints", () => {
  assert.deepEqual(
    dragRange("2026-10-25", "2026-10-25", "depart", "2026-10-25", "2026-10-25"),
    {
      date: "2026-10-25",
      returnDate: "2026-10-25",
    },
  );
  assert.equal(
    dragRange("2026-10-24", "2026-11-01", "depart", "2026-10-25", "2026-10-25"),
    null,
  );
  assert.equal(
    dragRange("2026-10-25", "2026-11-31", "depart", "2026-10-25", "2026-10-25"),
    null,
  );
});

test("click selection commits return without changing departure or other search values", () => {
  const s = freshBooking().search;
  const date = addDays(today(), 3);
  const next = selectCalendarDate(s, "return", date)!;
  assert.deepEqual(next, { ...s, trip: "return", returnDate: date });
  assert.equal(s.returnDate, "");
});

test("departure edits retain a valid return, clearing only a return now before departure", () => {
  const s = {
    ...freshBooking().search,
    trip: "return" as const,
    returnDate: addDays(today(), 4),
  };
  assert.equal(
    selectCalendarDate(s, "depart", addDays(today(), 2))?.returnDate,
    s.returnDate,
  );
  const next = selectCalendarDate(s, "depart", addDays(today(), 5))!;
  assert.equal(next.returnDate, "");
  assert.equal(next.trip, "return");
  assert.equal(selectCalendarDate(s, "return", addDays(today(), -1)), null);
});

test("cancelled or invalid preview calculations never mutate the committed search", () => {
  const s = {
    ...freshBooking().search,
    trip: "return" as const,
    returnDate: addDays(today(), 5),
  };
  const before = { ...s };
  dragRange(s.date, addDays(s.date, 9), "depart", s.date);
  dragRange(s.date, addDays(s.date, -1), "return", s.date);
  assert.deepEqual(s, before);
});

test("touch scroll intent wins before drag; small pointer movement remains a tap", () => {
  assert.equal(rangeGestureIntent(3, 4, false), "pending");
  assert.equal(rangeGestureIntent(3, 4, true), "pending");
  assert.equal(rangeGestureIntent(3, 12, true), "scroll");
  assert.equal(rangeGestureIntent(12, 3, true), "drag");
  assert.equal(rangeGestureIntent(0, 12, false), "drag");
});
