import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalClass,
  coachLayouts,
  getLayout,
  layoutSchema,
  occupancyCategory,
  sampleCoachServices,
  sampleOccupancy,
  serviceOffers,
  historicalCoachServices,
  previewFares,
} from "../src/lib/coach-layouts";
import {
  addDays,
  allocationIsTogether,
  changeLeg,
  chooseSeat,
  assignPlace,
  className,
  earliestStep,
  fare,
  freshBooking,
  legSeats,
  money,
  pricing,
  recommend,
  removeSeat,
  restore,
  seatForPlace,
  seatsComplete,
  today,
  trains,
  unavailable,
  validOffer,
  type Booking,
} from "../src/lib/booking";
import { fingerprint, validateCoachCatalogue } from "../src/server/coach-store";

function configured(round = false): Booking {
  const b = freshBooking();
  b.search = {
    ...b.search,
    from: "LHE",
    to: "RWP",
    date: addDays(today(), 2),
    returnDate: round ? addDays(today(), 4) : "",
    trip: round ? "return" : "oneway",
    adults: 3,
  };
  b.passengers = Array.from({ length: 3 }, (_, i) => ({
    id: `p${i}`,
    name: `Traveller ${i}`,
    gender: "prefer_not_to_say",
    type: "adult",
  }));
  b.contact = { name: "Sample Contact", email: "sample@example.com" };
  const train = trains(b.search)[1],
    service = sampleCoachServices[1];
  b.legs = [
    {
      id: "outbound",
      train,
      classId: "economy",
      offer: serviceOffers(service, train.from, train.to, train.date)[0],
    },
  ];
  if (round) {
    const train = trains(b.search, "return")[1];
    b.legs.push({
      id: "return",
      train,
      classId: "business",
      offer: serviceOffers(service, train.from, train.to, train.date)[1],
    });
  }
  return b;
}
test("all supplied template counts, unique IDs and exact numbered sets", () => {
  assert.deepEqual(
    coachLayouts.map((l) => l.places.length),
    [78, 78, 72, 54, 16, 56],
  );
  for (const l of coachLayouts) {
    assert.ok(layoutSchema.safeParse(l).success);
    assert.equal(new Set(l.places.map((p) => p.id)).size, l.places.length);
    assert.equal(
      new Set(l.places.map((p) => p.physicalId)).size,
      l.places.length,
    );
  }
  for (const id of ["economy-seat-78", "economy-berth-78"])
    assert.deepEqual(
      new Set(getLayout(id)!.places.map((p) => p.label)),
      new Set([
        ...Array.from(
          { length: 60 },
          (_, i) => `${String(i + 1).padStart(2, "0")}B`,
        ),
        ...Array.from({ length: 18 }, (_, i) => `${i + 61}S`),
      ]),
    );
  assert.deepEqual(
    new Set(getLayout("ac-standard-72")!.places.map((p) => p.label)),
    new Set(
      Array.from(
        { length: 72 },
        (_, i) => `${String(i + 1).padStart(2, "0")}B`,
      ),
    ),
  );
  assert.equal(validateCoachCatalogue().numberedPlaces, 298);
});
test("Economy berth tables and walls match ten paired bays, not selectable inventory", () => {
  const l = getLayout("economy-berth-78")!;
  assert.equal(l.structures.filter((s) => s.type === "table").length, 20);
  assert.equal(l.structures.filter((s) => s.type === "wall").length, 18);
  assert.equal(l.places.filter((p) => p.type === "berth").length, 60);
  assert.equal(l.places.filter((p) => p.type === "seat").length, 18);
  assert.equal(l.places.find((p) => p.label === "03B")?.tier, "upper");
  assert.equal(l.places.find((p) => p.label === "02B")?.tier, "middle");
  assert.equal(l.places.find((p) => p.label === "01B")?.tier, "lower");
  assert.equal(l.places.find((p) => p.label === "61S")?.y, 140);
  assert.equal(l.places.find((p) => p.label === "78S")?.y, 2340);
  assert.deepEqual(
    l.structures
      .filter((s) => s.type === "table" && s.x === 10)
      .map((s) => s.y),
    Array.from({ length: 10 }, (_, i) => i * 260 + 110),
  );
});
test("Economy representations share physical inventory, seated mode never duplicates berths", () => {
  const a = getLayout("economy-seat-78")!,
    b = getLayout("economy-berth-78")!;
  assert.equal(a.inventoryFamily, b.inventoryFamily);
  assert.deepEqual(
    new Set(a.places.map((p) => p.physicalId)),
    new Set(b.places.map((p) => p.physicalId)),
  );
  assert.ok(a.places.every((p) => p.type === "seat" && !p.tier));
});
test("AC Standard retains irregular end and side numbering without inventing tiers", () => {
  const l = getLayout("ac-standard-72")!;
  assert.deepEqual(
    l.places.filter((p) => p.y === 0).map((p) => p.label),
    ["72B", "71B"],
  );
  assert.deepEqual(
    l.places.filter((p) => p.x === 10).map((p) => p.label),
    Array.from({ length: 14 }, (_, i) => `${67 - i}B`),
  );
  assert.ok(l.places.every((p) => !p.tier));
  assert.equal(l.places.find((p) => p.label === "53B")?.x, 332);
});
test("Business has nine lounges and all explicitly labelled U/M/L stacks", () => {
  const l = getLayout("ac-business-54")!;
  assert.equal(new Set(l.places.map((p) => p.bay)).size, 9);
  for (const letter of "ABCDEFGHI")
    assert.deepEqual(
      l.places.filter((p) => p.bay === `Lounge ${letter}`).map((p) => p.label),
      [
        `${letter}U3`,
        `${letter}M2`,
        `${letter}L1`,
        `${letter}U6`,
        `${letter}M5`,
        `${letter}L4`,
      ],
    );
  assert.equal(l.structures.filter((s) => s.type === "table").length, 9);
});
test("Cabin reference keeps offset C stack, 16 berths and six toilets; conflict remains explicit", () => {
  const l = getLayout("cabin-16")!;
  assert.equal(l.places.find((p) => p.label === "CU4")?.x, 115);
  assert.equal(l.places.find((p) => p.label === "DU4")?.x, 330);
  assert.equal(l.structures.filter((s) => s.type === "toilet").length, 6);
  assert.equal(l.structures.filter((s) => s.type === "table").length, 6);
  assert.equal(l.version, 2);
  assert.match(getLayout("cabin-16", 1)!.warning!, /unresolved/);
});
test("Parlour retains 14 rows of four rotating positions with no fabricated seat numbers", () => {
  const l = getLayout("parlour-56-unnumbered")!;
  assert.equal(l.verification, "partial");
  assert.equal(new Set(l.places.map((p) => p.y)).size, 14);
  assert.ok(
    l.places.every(
      (p) => p.label === null && p.rotatable && p.type === "recliner",
    ),
  );
  const offer = serviceOffers(
    sampleCoachServices[2],
    "LHE",
    "RWP",
    addDays(today(), 1),
  ).find((o) => o.classId === "parlour")!;
  assert.equal(offer.quote?.amount, 9500);
  assert.equal(offer.quote?.source, "approved-sample-fare");
});
test("class aliases normalize spelling and official codes without treating lower berth as a class", () => {
  assert.equal(canonicalClass("Parlor Car"), "parlour");
  assert.equal(canonicalClass(" PC "), "parlour");
  assert.equal(canonicalClass("Economy Berth"), "economy");
  assert.equal(canonicalClass("ACLZ"), "business");
  assert.equal(canonicalClass("Lower berth"), undefined);
});
test("pinned sample services have different consists and approved sample Sleeper fare", () => {
  assert.equal(
    sampleCoachServices[0].coaches.some((c) => c.classId === "business"),
    false,
  );
  assert.equal(
    serviceOffers(sampleCoachServices[3], "LHE", "RWP", today()).find(
      (o) => o.classId === "sleeper",
    )?.quote?.amount,
    8900,
  );
  assert.ok(
    serviceOffers(sampleCoachServices[0], "UNKNOWN", "RWP", today()).every(
      (o) => o.quote === null,
    ),
  );
  assert.equal(money(NaN), "Fare unavailable");
});
test("Sleeper v2 separates toilets into the correct cabins with stepped walls and clear berth margins", () => {
  const layout = getLayout("cabin-16")!;
  const walls = layout.structures.filter((s) => s.type === "wall");
  for (const p of layout.places)
    for (const wall of walls)
      assert.equal(
        p.x < wall.x + wall.width &&
          p.x + p.width > wall.x &&
          p.y < wall.y + wall.height &&
          p.y + p.height > wall.y,
        false,
        `${p.label} overlaps ${wall.label}`,
      );
  const toilets = layout.structures.filter((s) => s.type === "toilet");
  for (const letter of ["A", "E"]) {
    const toilet = toilets.find((s) => s.label === `Toilet ${letter}-Cabin`)!;
    assert.ok(
      walls.some(
        (w) => w.label.includes("left") && w.y > toilet.y + toilet.height,
      ),
    );
  }
  const d = toilets.find((s) => s.label === "Toilet D-Cabin")!;
  assert.ok(
    walls.some((w) => w.label.includes("left") && w.y < d.y && d.y - w.y < 10),
  );
  assert.equal(walls.filter((w) => w.label.includes("riser")).length, 3);
  assert.ok(
    layout.places.find((p) => p.label === "CU2")!.y >
      getLayout("cabin-16", 1)!.places.find((p) => p.label === "CU2")!.y,
  );
});
test("place-first assignment moves the passenger, releases a previous owner and preserves the other leg", () => {
  let b = recommend(configured(true));
  const target = b.assignments["outbound:p1"],
    previous = b.assignments["outbound:p0"],
    returned = b.assignments["return:p0"];
  b = assignPlace(b, "outbound", "p0", target);
  assert.deepEqual(b.assignments["outbound:p0"], target);
  assert.equal(b.assignments["outbound:p1"], undefined);
  assert.deepEqual(b.assignments["return:p0"], returned);
  assert.equal(
    Object.values(b.assignments).filter(
      (s) =>
        s.coach === previous.coach &&
        s.place?.physicalId === previous.place?.physicalId,
    ).length,
    0,
  );
  assert.equal(seatsComplete(b), false);
  b = assignPlace(b, "outbound", "p1", previous);
  assert.ok(seatsComplete(b));
});
test("place-first assignment rejects unavailable or forged targets without removing existing assignments", () => {
  const b = recommend(configured()),
    leg = b.legs[0],
    layout = getLayout(leg.offer!.coaches[0].layoutId)!;
  const occupied = layout.places.find(
    (p) => sampleOccupancy(layout, p.id).state === "occupied",
  )!;
  assert.strictEqual(
    assignPlace(b, leg.id, "p0", seatForPlace(leg, "A", occupied.id)!),
    b,
  );
  const target = {
    ...b.assignments["outbound:p1"],
    place: { ...b.assignments["outbound:p1"].place!, label: "invalid" },
  };
  assert.strictEqual(assignPlace(b, leg.id, "p0", target), b);
});
test("sample preview prices cover every layout and Sleeper quote is charged once", () => {
  for (const layout of coachLayouts) assert.ok(previewFares[layout.id] > 0);
  const b = configured(),
    train = trains(b.search)[3];
  b.legs = [
    {
      id: "outbound",
      train,
      classId: "sleeper",
      offer: serviceOffers(
        sampleCoachServices[3],
        train.from,
        train.to,
        train.date,
      ).find((o) => o.classId === "sleeper"),
    },
  ];
  const selected = recommend(b);
  assert.equal(earliestStep(selected), 6);
  assert.equal(pricing(selected).total, 8900 * 3);
  assert.ok(
    Object.values(selected.assignments).every(
      (s) => s.place?.layoutVersion === 2,
    ),
  );
});
test("historical services and layout versions remain restorable after current configurations change", () => {
  const b = configured(),
    train = b.legs[0].train;
  b.legs[0].offer = serviceOffers(
    historicalCoachServices[1],
    train.from,
    train.to,
    train.date,
  )[0];
  const old = recommend(b);
  old.status = "paid";
  old.reference = "DFY-1234ABCD";
  assert.deepEqual(restore(JSON.stringify(old)), old);
  assert.equal(old.legs[0].offer!.serviceId, "sample-1");
  assert.equal(getLayout("parlour-56-unnumbered", 1)!.places[0].type, "seat");
  assert.equal(
    getLayout("parlour-56-unnumbered", 2)!.places[0].type,
    "recliner",
  );
});
test("recommendations use explicit bays/tiers; unique assignments work on both legs without fare duplication", () => {
  const b = recommend(configured(true));
  assert.ok(seatsComplete(b));
  assert.ok(allocationIsTogether(b, "outbound"));
  assert.ok(allocationIsTogether(b, "return"));
  assert.equal(earliestStep(b), 6);
  assert.equal(pricing(b).total, (2800 + 6160) * 3);
  assert.equal(fare(b.legs[1]), 6160);
  assert.equal(Object.keys(b.assignments).length, 6);
  assert.equal(
    new Set(Object.values(b.assignments).map((s) => s.place?.physicalId)).size,
    6,
  );
  assert.equal(b.legs[1].offer?.quote?.selectionSurcharge, 0);
  assert.ok(Object.values(b.assignments).every((s) => s.place?.label));
  assert.deepEqual(restore(JSON.stringify(b)), b);
});
test("occupied places, duplicate passengers and forged snapshots cannot be selected", () => {
  const b = recommend(configured()),
    leg = b.legs[0],
    layout = getLayout(leg.offer!.coaches[0].layoutId)!;
  const occupied = layout.places.find(
    (p) => sampleOccupancy(layout, p.id).state === "occupied",
  )!;
  const occupiedSeat = seatForPlace(leg, "A", occupied.id)!;
  assert.ok(unavailable(b, leg, occupiedSeat));
  assert.strictEqual(chooseSeat(b, leg.id, "p0", occupiedSeat), b);
  assert.strictEqual(
    chooseSeat(b, leg.id, "p0", b.assignments["outbound:p1"]),
    b,
  );
  const fake = {
    ...b.assignments["outbound:p0"],
    place: { ...b.assignments["outbound:p0"].place!, label: "999B" },
  };
  assert.strictEqual(chooseSeat(b, leg.id, "p0", fake), b);
});
test("own selection is removable and return leg survives class change", () => {
  let b = recommend(configured(true));
  const returned = b.assignments["return:p0"];
  b = removeSeat(b, "outbound", "p0");
  assert.equal(seatsComplete(b), false);
  assert.deepEqual(b.assignments["return:p0"], returned);
  const service = sampleCoachServices[1],
    leg = b.legs[0],
    offer = serviceOffers(
      service,
      leg.train.from,
      leg.train.to,
      leg.train.date,
    )[1];
  b = changeLeg(b, { ...leg, classId: "business", offer });
  assert.deepEqual(b.assignments["return:p0"], returned);
  assert.equal(b.assignments["outbound:p1"], undefined);
});
test("stale layout/quote invalidates only that draft leg and never converts old seat numbers", () => {
  const b = recommend(configured(true));
  b.legs[0].offer!.coaches[0].layoutVersion = 99 as 1;
  assert.equal(validOffer(b.legs[0]), false);
  const restored = restore(JSON.stringify(b));
  assert.equal(restored.legs[0].classId, "");
  assert.equal(restored.assignments["outbound:p0"], undefined);
  assert.ok(restored.assignments["return:p0"]);
  assert.match(restored.recoveryNotice!, /outdated/);
});
test("unknown fares block checkout and quotes cannot cross segments or class", () => {
  const b = configured();
  b.legs[0].offer!.quote = null;
  assert.equal(earliestStep(b), 2);
  assert.equal(legSeats(b.legs[0]).length, 0);
  assert.equal(Number.isFinite(pricing(b).total), false);
});
test("minimal occupancy categories never infer binary gender and reference payloads contain no occupants", () => {
  for (const v of [
    undefined,
    "other",
    "prefer_not_to_say",
    "Unknown",
    "Ms Name",
    99,
  ])
    assert.equal(occupancyCategory(v), "unspecified");
  assert.equal(occupancyCategory("female"), "female");
  for (const layout of coachLayouts) {
    const genders = new Set(
      layout.places
        .map((p) => sampleOccupancy(layout, p.id).gender)
        .filter(Boolean),
    );
    assert.deepEqual(genders, new Set(["male", "female", "unspecified"]));
  }
  assert.doesNotMatch(
    JSON.stringify(
      serviceOffers(sampleCoachServices[0], "LHE", "RWP", today()),
    ),
    /passengerName|contact|CNIC|bookingReference/,
  );
});
test("reference fingerprints are repeatable and geometry changes produce a different version fingerprint", () => {
  const layout = getLayout("cabin-16")!;
  assert.equal(
    fingerprint(layout),
    fingerprint(JSON.parse(JSON.stringify(layout))),
  );
  assert.notEqual(
    fingerprint(layout),
    fingerprint({ ...layout, name: "Changed" }),
  );
});
test("completed legacy booking keeps its historical class, fare and seat grid even after its date passes", () => {
  let b = configured();
  delete b.legs[0].offer;
  b.legs[0].classId = "business";
  b.passengers = b.passengers.slice(0, 2);
  b.search.adults = 2;
  b = recommend(b);
  b.status = "paid";
  b.reference = "DFY-1234ABCD";
  b.search.date = "2026-01-01";
  b.legs[0].train.date = b.search.date;
  const next = restore(JSON.stringify(b));
  assert.equal(className(next.legs[0]), "Business");
  assert.equal(fare(next.legs[0]), 6160);
  assert.equal(next.assignments["outbound:p0"].place, undefined);
  assert.equal(next.status, "paid");
});
