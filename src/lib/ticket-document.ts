import {
  type Booking,
  restore,
  pricing,
  fare,
  className,
  station,
  seatKey,
  seatLabel,
  seatDescription,
} from "./booking";

/** Current bookings are local simulations, not authenticated railway reservations. */
export function ticketDocument(booking: Booking) {
  try {
    const snapshot = restore(JSON.stringify(booking));
    if (snapshot.status !== "paid") return null;
    return {
      reference: snapshot.reference,
      status: "Test payment completed",
      totals: pricing(snapshot),
      legs: snapshot.legs.map((leg) => ({
        id: leg.id,
        from: station(leg.train.from, snapshot.search),
        to: station(leg.train.to, snapshot.search),
        date: leg.train.date,
        train: leg.train.name,
        departure: leg.train.departure,
        arrival: leg.train.arrival,
        arrivalDay: leg.train.arrivalDay,
        className: className(leg),
        passengers: snapshot.passengers.map((passenger) => {
          const seat = snapshot.assignments[seatKey(leg.id, passenger.id)];
          return {
            name: passenger.name,
            type: passenger.type,
            coach: seat.coach,
            place: seatLabel(seat),
            accommodation: seatDescription(seat),
            fare: fare(leg),
          };
        }),
      })),
    };
  } catch {
    return null;
  }
}
