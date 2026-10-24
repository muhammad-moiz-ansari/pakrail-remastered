import { Booking, Search, stations } from "./booking";
/** Display cleanup must not discard a traveller's draft or completed reference. */
export function customerDraft(booking: Booking): Booking {
  return {
    ...booking,
    scenario: "normal",
    conflict: undefined,
    conflictHandled: false,
  };
}
/** Keep completed details while allowing an edited journey to be saved as a draft. */
export function editedSearchDraft(booking: Booking, search: Search): Booking {
  const changed = Object.entries(search).some(
    ([key, value]) => booking.search[key as keyof Search] !== value,
  );
  if (!changed) return booking;
  return { ...booking, search, status: "draft" };
}
/** Editorial destination actions change one search value only. */
export function destinationDraft(booking: Booking, id: string): Booking {
  if (!stations.some((s) => s.id === id)) return booking;
  return editedSearchDraft(booking, { ...booking.search, to: id });
}
