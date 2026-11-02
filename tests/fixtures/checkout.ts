import {
  freshBooking,
  addDays,
  today,
  trains,
  recommend,
  type Booking,
} from "../../src/lib/booking";
import {
  sampleCoachServices,
  serviceOffers,
} from "../../src/lib/coach-layouts";
export function checkoutFixture(): Booking {
  let b = freshBooking();
  b.search = {
    from: "LHE",
    to: "RWP",
    date: addDays(today(), 5),
    returnDate: addDays(today(), 6),
    trip: "return",
    adults: 1,
    children: 1,
  };
  b.passengers = [
    { id: "a", name: "Account Check Adult", type: "adult", gender: "male" },
    { id: "b", name: "Account Check Child", type: "child", gender: "female" },
  ];
  b.contact = { name: "Account Check", email: "check@example.test" };
  b.legs = (["outbound", "return"] as const).map((id, i) => {
    const train = trains(b.search, id)[0];
    const offer = serviceOffers(
      sampleCoachServices[0],
      train.from,
      train.to,
      train.date,
    ).find((o) => o.classId === (i ? "standard" : "economy"))!;
    return { id, train, classId: offer.classId, offer };
  });
  b = recommend(b);
  // recommend handles verified offers, preserving place metadata.
  return b;
}
