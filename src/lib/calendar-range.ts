import { Search, today, validDate } from "./booking";

export type DateField = "depart" | "return";
export type TravelRange = { date: string; returnDate: string };

export function rangeGestureIntent(dx: number, dy: number, touch: boolean) {
  if (touch && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) return "scroll";
  return Math.hypot(dx, dy) < 7 ? "pending" : "drag";
}

// ISO calendar-date strings compare without converting the selected local day.
export function dragRange(
  anchor: string,
  candidate: string,
  field: DateField,
  departure: string,
  minimum = today(),
): TravelRange | null {
  if (![anchor, candidate].every((d) => validDate(d) && d >= minimum))
    return null;
  if (field === "return")
    return candidate >= departure
      ? { date: departure, returnDate: candidate }
      : null;
  return anchor <= candidate
    ? { date: anchor, returnDate: candidate }
    : { date: candidate, returnDate: anchor };
}

export function selectCalendarDate(s: Search, field: DateField, date: string) {
  if (
    !validDate(date) ||
    date < today() ||
    (field === "return" && date < s.date)
  )
    return null;
  if (field === "return")
    return { ...s, returnDate: date, trip: "return" as const };
  return {
    ...s,
    date,
    returnDate: s.returnDate >= date ? s.returnDate : "",
  };
}
