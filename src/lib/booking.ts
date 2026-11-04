export const stations = [
  { id: "LHE", name: "Lahore Junction", city: "Lahore", code: "LHE" },
  { id: "RWP", name: "Rawalpindi", city: "Rawalpindi", code: "RWP" },
  { id: "KHI", name: "Karachi Cantonment", city: "Karachi", code: "KHI" },
  { id: "ISB", name: "Islamabad Margalla", city: "Islamabad", code: "ISB" },
  { id: "MUX", name: "Multan Cantonment", city: "Multan", code: "MUX" },
  { id: "FSD", name: "Faisalabad", city: "Faisalabad", code: "FSD" },
];
export const station = (id: string) =>
  stations.find((s) => s.id === id)?.name ?? "Choose station";
export const money = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;
export function today() {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return `${p.find((x) => x.type === "year")!.value}-${p.find((x) => x.type === "month")!.value}-${p.find((x) => x.type === "day")!.value}`;
}
export function addDays(d: string, n: number) {
  const v = new Date(`${d}T12:00:00Z`);
  v.setUTCDate(v.getUTCDate() + n);
  return v.toISOString().slice(0, 10);
}
export const prettyDate = (d: string) =>
  d
    ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Add return";
export const classes = [
  {
    id: "economy",
    name: "Economy",
    multiplier: 1,
    description: "A simple, comfortable way to get there.",
    benefits: [
      "Standard seating",
      "Shared carriage",
      "Seat selection included",
    ],
    capacity: 24,
  },
  {
    id: "standard",
    name: "AC Standard",
    multiplier: 1.6,
    description: "A little more comfort for your journey.",
    benefits: [
      "Air-conditioned carriage",
      "Reclining seats",
      "Seat selection included",
    ],
    capacity: 20,
  },
  {
    id: "business",
    name: "Business",
    multiplier: 2.2,
    description: "More space to settle in and unwind.",
    benefits: ["Spacious seating", "Quiet carriage", "Seat selection included"],
    capacity: 4,
  },
];
export type Search = {
  from: string;
  to: string;
  date: string;
  returnDate: string;
  trip: "undecided" | "oneway" | "return";
  adults: number;
  children: number;
};
export type Passenger = { id: string; name: string; type: "adult" | "child" };
export type Train = {
  id: string;
  name: string;
  departure: string;
  arrival: string;
  duration: number;
  price: number;
  from: string;
  to: string;
  date: string;
  arrivalDay: number;
};
export type Leg = { id: "outbound" | "return"; train: Train; classId: string };
export type Seat = { coach: string; number: number };
export type Scenario =
  "normal" | "empty" | "search-error" | "seat-conflict" | "payment-failure";
export type Booking = {
  version: 1;
  search: Search;
  legs: Leg[];
  passengers: Passenger[];
  assignments: Record<string, Seat>;
  contact: { name: string; email: string };
  voucher: string;
  status: "draft" | "paid";
  reference: string;
  scenario: Scenario;
  conflictHandled: boolean;
  suggested: Record<string, Seat>;
  conflict?: { legId: string; seat: Seat };
};
export const freshBooking = (): Booking => ({
  version: 1,
  search: {
    from: "",
    to: "",
    date: today(),
    returnDate: "",
    trip: "undecided",
    adults: 1,
    children: 0,
  },
  legs: [],
  passengers: [{ id: "p1", name: "", type: "adult" }],
  assignments: {},
  contact: { name: "", email: "" },
  voucher: "",
  status: "draft",
  reference: "",
  scenario: "normal",
  conflictHandled: false,
  suggested: {},
});
export function validDate(d: unknown): d is string {
  return (
    typeof d === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !Number.isNaN(new Date(`${d}T12:00:00Z`).getTime()) &&
    new Date(`${d}T12:00:00Z`).toISOString().slice(0, 10) === d
  );
}
export function searchErrors(s: Search) {
  const e: Record<string, string> = {};
  if (!stations.some((v) => v.id === s.from))
    e.from = "Choose a departure station.";
  if (!stations.some((v) => v.id === s.to)) e.to = "Choose an arrival station.";
  if (s.from && s.from === s.to) e.to = "Choose a different arrival station.";
  if (!validDate(s.date) || s.date < today())
    e.date = "Choose today or a future departure date.";
  if (s.trip === "undecided")
    e.date = "Choose a return date or select One Way.";
  if (
    s.trip === "return" &&
    (!validDate(s.returnDate) || s.returnDate < s.date)
  )
    e.date = "Return date must be on or after departure.";
  if (
    s.adults < 1 ||
    s.children < 0 ||
    s.adults + s.children > 6 ||
    ![s.adults, s.children].every(Number.isInteger)
  )
    e.passengers = "Choose at least one adult and no more than six travellers.";
  return e;
}
export function trains(
  s: Search,
  leg: "outbound" | "return" = "outbound",
): Train[] {
  const date = leg === "outbound" ? s.date : s.returnDate;
  const from = leg === "outbound" ? s.from : s.to;
  const to = leg === "outbound" ? s.to : s.from;
  const long = [from, to].includes("KHI");
  const duration = long ? 1020 : 270;
  const schedule = [
    { name: "Mehran Explorer", time: "06:30", price: 2400 },
    { name: "Indus Voyager", time: "10:00", price: 2800 },
    { name: "Northern Journey", time: "15:30", price: 2600 },
    { name: "Emerald Night", time: "22:00", price: 2200 },
  ];
  return schedule
    .map((t, i) => {
      const m =
        Number(t.time.slice(0, 2)) * 60 +
        30 * (t.time.endsWith("30") ? 1 : 0) +
        duration;
      return {
        id: `${leg}-${i}`,
        name: t.name,
        departure: t.time,
        arrival: `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
        duration,
        price: t.price * (long ? 2 : 1),
        from,
        to,
        date,
        arrivalDay: Math.floor(m / 1440),
      };
    })
    .filter(
      (t) =>
        date > today() ||
        new Date(`${date}T${t.departure}:00+05:00`).getTime() > Date.now(),
    );
}
export function returnValid(out: Train, ret: Train) {
  return (
    new Date(`${ret.date}T${ret.departure}:00+05:00`).getTime() >
    new Date(`${out.date}T${out.departure}:00+05:00`).getTime() +
      out.duration * 60000
  );
}
export const fare = (l: Leg) =>
  Math.round(
    l.train.price * (classes.find((c) => c.id === l.classId)?.multiplier ?? 1),
  );
export function pricing(b: Booking) {
  const base = b.legs.reduce((n, l) => n + fare(l) * b.passengers.length, 0);
  const discount = b.voucher === "DEMO10" ? Math.round(base * 0.1) : 0;
  return { base, discount, total: base - discount };
}
export const seatKey = (leg: string, pid: string) => `${leg}:${pid}`;
export const sold = (coach: string, n: number, classId: string) =>
  [5, 8, 13, 19].includes(n) ||
  (classId === "business" && n > 2) ||
  (coach === "B" && [3, 6].includes(n));
export function availableSeats(classId: string): Seat[] {
  return ["A", "B"].flatMap((coach) =>
    Array.from({ length: 16 }, (_, i) => ({ coach, number: i + 1 })).filter(
      (s) => !sold(coach, s.number, classId),
    ),
  );
}
export function unavailable(b: Booking, l: Leg, s: Seat) {
  return (
    sold(s.coach, s.number, l.classId) ||
    !!(
      b.conflict?.legId === l.id &&
      b.conflict.seat.coach === s.coach &&
      b.conflict.seat.number === s.number
    )
  );
}
export function allocationIsTogether(b: Booking, legId: string) {
  const seats = b.passengers.map((p) => b.assignments[seatKey(legId, p.id)]);
  const first = seats[0];
  if (!first || seats.some((s) => !s)) return false;
  return seats.every(
    (s) =>
      s.coach === first.coach &&
      Math.floor((s.number - 1) / 4) === Math.floor((first.number - 1) / 4),
  );
}
export function recommend(b: Booking): Booking {
  const assignments = { ...b.assignments };
  const suggested = { ...b.suggested };
  for (const l of b.legs) {
    const used = new Set(
      b.passengers
        .map((p) => assignments[seatKey(l.id, p.id)])
        .filter(Boolean)
        .map((s) => `${s.coach}:${s.number}`),
    );
    const needing = b.passengers.filter(
      (p) => !assignments[seatKey(l.id, p.id)],
    );
    let free = availableSeats(l.classId).filter(
      (s) => !used.has(`${s.coach}:${s.number}`) && !unavailable(b, l, s),
    );
    const together = free.find((s) =>
      needing.every(
        (_, i) =>
          free.some((v) => v.coach === s.coach && v.number === s.number + i) &&
          Math.floor((s.number - 1) / 4) === Math.floor((s.number + i - 1) / 4),
      ),
    );
    if (together)
      free = [
        ...free.filter(
          (s) =>
            s.coach === together.coach &&
            s.number >= together.number &&
            s.number < together.number + needing.length,
        ),
        ...free.filter(
          (s) =>
            s.coach !== together.coach ||
            s.number < together.number ||
            s.number >= together.number + needing.length,
        ),
      ];
    needing.forEach((p, i) => {
      if (free[i]) {
        assignments[seatKey(l.id, p.id)] = free[i];
        suggested[seatKey(l.id, p.id)] = free[i];
      }
    });
  }
  return { ...b, assignments, suggested };
}
export function chooseSeat(
  b: Booking,
  leg: string,
  pid: string,
  seat: Seat,
): Booking {
  const l = b.legs.find((v) => v.id === leg);
  if (
    !l ||
    !b.passengers.some((p) => p.id === pid) ||
    unavailable(b, l, seat) ||
    !availableSeats(l.classId).some(
      (s) => s.coach === seat.coach && s.number === seat.number,
    )
  )
    return b;
  if (
    b.passengers.some(
      (p) =>
        p.id !== pid &&
        b.assignments[seatKey(leg, p.id)]?.coach === seat.coach &&
        b.assignments[seatKey(leg, p.id)]?.number === seat.number,
    )
  )
    return b;
  const key = seatKey(leg, pid);
  if (
    b.scenario === "seat-conflict" &&
    !b.conflictHandled &&
    l.id === "outbound" &&
    seat.coach === "A" &&
    [4, 6].includes(seat.number)
  ) {
    const assignments = { ...b.assignments };
    const suggested = { ...b.suggested };
    delete assignments[key];
    delete suggested[key];
    return {
      ...b,
      assignments,
      suggested,
      conflictHandled: true,
      conflict: { legId: l.id, seat },
    };
  }
  return {
    ...b,
    assignments: { ...b.assignments, [key]: seat },
    suggested: Object.fromEntries(
      Object.entries(b.suggested).filter(([k]) => k !== key),
    ),
  };
}
export function updatePassengers(b: Booking, passengers: Passenger[]): Booking {
  const ids = new Set(passengers.map((p) => p.id));
  return {
    ...b,
    passengers,
    search: {
      ...b.search,
      adults: passengers.filter((p) => p.type === "adult").length,
      children: passengers.filter((p) => p.type === "child").length,
    },
    assignments: Object.fromEntries(
      Object.entries(b.assignments).filter(([k]) => ids.has(k.split(":")[1])),
    ),
    suggested: Object.fromEntries(
      Object.entries(b.suggested).filter(([k]) => ids.has(k.split(":")[1])),
    ),
    status: "draft",
    reference: "",
  };
}
export function changeLeg(b: Booking, leg: Leg): Booking {
  const old = b.legs.find((l) => l.id === leg.id);
  if (
    old?.train.id === leg.train.id &&
    old.train.from === leg.train.from &&
    old.train.to === leg.train.to &&
    old.train.date === leg.train.date &&
    old.classId === leg.classId
  )
    return b;
  return {
    ...b,
    legs: [...b.legs.filter((l) => l.id !== leg.id), leg].sort((a) =>
      a.id === "outbound" ? -1 : 1,
    ),
    assignments: Object.fromEntries(
      Object.entries(b.assignments).filter(
        ([k]) => !k.startsWith(`${leg.id}:`),
      ),
    ),
    suggested: Object.fromEntries(
      Object.entries(b.suggested).filter(([k]) => !k.startsWith(`${leg.id}:`)),
    ),
    conflict: b.conflict?.legId === leg.id ? undefined : b.conflict,
    conflictHandled: b.conflict?.legId === leg.id ? false : b.conflictHandled,
    status: "draft",
    reference: "",
  };
}
export const passengerErrors = (b: Booking) => {
  const e: Record<string, string> = {};
  b.passengers.forEach((p) => {
    if (p.name.trim().length < 2) e[p.id] = "Enter the traveller’s full name.";
  });
  if (b.contact.name.trim().length < 2) e.contactName = "Enter a contact name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.contact.email))
    e.contactEmail = "Enter a usable email, such as name@example.com.";
  if (!b.passengers.some((p) => p.type === "adult"))
    e.passengers = "At least one adult is required.";
  return e;
};
export function seatsComplete(b: Booking) {
  return b.legs.every((l) => {
    const seen = new Set();
    return b.passengers.every((p) => {
      const s = b.assignments[seatKey(l.id, p.id)];
      if (!s || unavailable(b, l, s) || seen.has(`${s.coach}:${s.number}`))
        return false;
      seen.add(`${s.coach}:${s.number}`);
      return true;
    });
  });
}
export function earliestStep(b: Booking): number {
  if (Object.keys(searchErrors(b.search)).length) return 0;
  if (b.legs.length !== (b.search.trip === "return" ? 2 : 1)) return 1;
  const o = b.legs.find((l) => l.id === "outbound"),
    r = b.legs.find((l) => l.id === "return");
  if (
    !o ||
    (r && !returnValid(o.train, r.train)) ||
    b.legs.some(
      (l) =>
        l.train.from !== (l.id === "outbound" ? b.search.from : b.search.to) ||
        l.train.to !== (l.id === "outbound" ? b.search.to : b.search.from) ||
        l.train.date !==
          (l.id === "outbound" ? b.search.date : b.search.returnDate),
    )
  )
    return 1;
  if (
    b.legs.some(
      (l) =>
        !classes.some(
          (c) => c.id === l.classId && c.capacity >= b.passengers.length,
        ),
    )
  )
    return 2;
  if (Object.keys(passengerErrors(b)).length) return 3;
  if (!seatsComplete(b)) return 4;
  return 6;
}
export function restore(raw: string): Booking {
  const value: unknown = JSON.parse(raw);
  const fail = () => {
    throw Error(
      "This saved draft is outdated or could not be restored. Start a new booking.",
    );
  };
  if (!value || typeof value !== "object") return fail();
  const b = value as Booking;
  if (
    b.version !== 1 ||
    !b.search ||
    !Array.isArray(b.passengers) ||
    !Array.isArray(b.legs) ||
    !b.contact ||
    !b.assignments ||
    !b.suggested ||
    ![
      "normal",
      "empty",
      "search-error",
      "seat-conflict",
      "payment-failure",
    ].includes(b.scenario) ||
    !["draft", "paid"].includes(b.status) ||
    typeof b.reference !== "string" ||
    !["", "DEMO10"].includes(b.voucher) ||
    typeof b.conflictHandled !== "boolean"
  )
    return fail();
  const s = b.search;
  if (
    !validDate(s.date) ||
    s.date < today() ||
    typeof s.from !== "string" ||
    typeof s.to !== "string" ||
    typeof s.returnDate !== "string" ||
    !["undecided", "oneway", "return"].includes(s.trip) ||
    !Number.isInteger(s.adults) ||
    s.adults < 1 ||
    !Number.isInteger(s.children) ||
    s.children < 0 ||
    s.adults + s.children > 6 ||
    (s.returnDate && !validDate(s.returnDate))
  )
    return fail();
  if (
    b.passengers.length < 1 ||
    b.passengers.length > 6 ||
    b.passengers.some(
      (p) =>
        !p ||
        typeof p.name !== "string" ||
        !["adult", "child"].includes(p.type) ||
        typeof p.id !== "string" ||
        p.id.includes(":"),
    ) ||
    new Set(b.passengers.map((p) => p.id)).size !== b.passengers.length ||
    typeof b.contact.name !== "string" ||
    typeof b.contact.email !== "string"
  )
    return fail();
  if (
    b.legs.length > 2 ||
    new Set(b.legs.map((l) => l.id)).size !== b.legs.length ||
    b.legs.some(
      (l) =>
        !l ||
        !["outbound", "return"].includes(l.id) ||
        !l.train ||
        typeof l.classId !== "string" ||
        (l.classId && !classes.some((c) => c.id === l.classId)) ||
        !validDate(l.train.date) ||
        !Number.isFinite(l.train.price) ||
        l.train.price < 0 ||
        !stations.some((v) => v.id === l.train.from) ||
        !stations.some((v) => v.id === l.train.to) ||
        !/^\d{2}:\d{2}$/.test(l.train.departure) ||
        !/^\d{2}:\d{2}$/.test(l.train.arrival) ||
        !Number.isFinite(l.train.duration) ||
        l.train.duration < 1 ||
        !Number.isInteger(l.train.arrivalDay) ||
        typeof l.train.name !== "string",
    )
  )
    return fail();
  if (
    [b.assignments, b.suggested].some(
      (map) =>
        typeof map !== "object" ||
        Array.isArray(map) ||
        Object.entries(map).some(
          ([k, v]) =>
            !v ||
            !["A", "B"].includes(v.coach) ||
            !Number.isInteger(v.number) ||
            v.number < 1 ||
            v.number > 16 ||
            !b.legs.some((l) => l.id === k.split(":")[0]) ||
            !b.passengers.some((p) => p.id === k.split(":")[1]),
        ),
    )
  )
    return fail();
  if (
    b.conflict &&
    (!b.conflict.seat ||
      !["outbound", "return"].includes(b.conflict.legId) ||
      !["A", "B"].includes(b.conflict.seat.coach) ||
      !Number.isInteger(b.conflict.seat.number) ||
      b.conflict.seat.number < 1 ||
      b.conflict.seat.number > 16)
  )
    return fail();
  if (
    b.status === "paid" &&
    (!/^DFY-[A-Z0-9]{8}$/.test(b.reference) || earliestStep(b) < 6)
  )
    return fail();
  return b;
}
