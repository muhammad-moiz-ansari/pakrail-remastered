import { z } from "zod";

export const reviewedAt = "2026-11-02T00:00:00Z";
export const classSources = {
  comparison: "https://trackmytrain.com.pk/coach-class-comparison",
  secondary: "https://tracktrain.pk/blog/classes-comparison",
  official: "https://www.pakrail.gov.pk/TrainClasses.aspx",
};
export const travelClasses = [
  {
    id: "economy",
    name: "Economy Class",
    code: "EC",
    aliases: ["Economy", "Economy Seat", "Economy Berth"],
    description:
      "Seated and sleeping configurations. Choose the accommodation offered by your service.",
    benefits: [
      "Seat and berth variants",
      "Numbered accommodation where configured",
    ],
  },
  {
    id: "standard",
    name: "AC Standard",
    code: "ACL",
    aliases: ["AC Standard"],
    description:
      "Air-conditioned travel, with coach arrangements that vary by service.",
    benefits: ["Air-conditioned class", "Check the particular coach layout"],
  },
  {
    id: "business",
    name: "AC Business",
    code: "ACLZ",
    aliases: ["Business", "AC Business"],
    description:
      "A distinct air-conditioned class. The supplied coach has sleeping berths in lounges A–I.",
    benefits: ["Air-conditioned class", "Numbered berth variant documented"],
  },
  {
    id: "sleeper",
    name: "AC Sleeper",
    code: "ACSL",
    aliases: ["AC Sleeper"],
    description:
      "Sleeping accommodation. Cabin arrangement and service availability require the particular coach reference.",
    benefits: [
      "Air-conditioned sleeping class",
      "Upper and lower berth variants",
    ],
  },
  {
    id: "parlour",
    name: "AC Parlour Car",
    code: "PC",
    aliases: ["AC Parlour", "Parlour Car", "Parlor Car", "AC Parlor"],
    description:
      "A separate premium class. The supplied rotating-seat arrangement has no printed numbering reference.",
    benefits: ["Air-conditioned class", "Supplied rotating-seat arrangement"],
  },
];
export function canonicalClass(value: string) {
  const normalized = value.trim().toLowerCase();
  return travelClasses.find((c) =>
    [c.id, c.name, c.code, ...c.aliases].some(
      (v) => v.toLowerCase() === normalized,
    ),
  )?.id;
}
export const accommodationNames = {
  seat: "Standard seat",
  recliner: "Recliner",
  berth: "Sleeping berth",
};
const position = {
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
};
const placeSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().nullable(),
  physicalId: z.string().min(1),
  type: z.enum(["seat", "recliner", "berth"]),
  tier: z.enum(["upper", "middle", "lower"]).optional(),
  bay: z.string(),
  stack: z.string().optional(),
  rotatable: z.boolean().optional(),
  ...position,
});
const structureSchema = z.strictObject({
  id: z.string(),
  type: z.enum(["wall", "table", "aisle", "toilet", "fixture"]),
  label: z.string(),
  ...position,
});
export const layoutSchema = z
  .strictObject({
    id: z.string(),
    version: z.number().int().positive(),
    classId: z.string(),
    name: z.string(),
    mode: z.enum(["seat", "berth"]),
    inventoryFamily: z.string(),
    width: z.number().positive(),
    height: z.number().positive(),
    verification: z.enum(["numbered", "partial"]),
    warning: z.string().optional(),
    sources: z.array(z.string()).min(1),
    reviewedAt: z.string(),
    places: z.array(placeSchema).min(1),
    structures: z.array(structureSchema),
  })
  .superRefine((v, ctx) => {
    for (const field of ["id", "physicalId", "label"] as const) {
      const values = v.places.map((p) => p[field]).filter((p) => p !== null);
      if (new Set(values).size !== values.length)
        ctx.addIssue({ code: "custom", message: `Duplicate place ${field}` });
    }
    if (v.verification === "numbered" && v.places.some((p) => !p.label))
      ctx.addIssue({
        code: "custom",
        message: "Numbered layouts require printed labels",
      });
    if (
      v.places.some((p) => p.x + p.width > v.width || p.y + p.height > v.height)
    )
      ctx.addIssue({ code: "custom", message: "Place escapes coach bounds" });
    if (v.places.some((p) => p.tier && p.type !== "berth"))
      ctx.addIssue({ code: "custom", message: "Only berths have a tier" });
  });
export type CoachLayout = z.infer<typeof layoutSchema>;
export type CoachPlace = CoachLayout["places"][number];
export type CoachStructure = CoachLayout["structures"][number];
const root = "references/Seat Arrangements/";
const source = (folder: string, files: string[]) =>
  files.map((f) => root + folder + "/" + f);
const labelB = (n: number) => `${String(n).padStart(2, "0")}B`;
function place(
  label: string | null,
  x: number,
  y: number,
  bay: string,
  type: CoachPlace["type"],
  extra: Partial<CoachPlace> = {},
): CoachPlace {
  return {
    id: label ?? `row-${bay}-${x}`,
    label,
    physicalId: label ?? `row-${bay}-${x}`,
    x,
    y,
    width: 88,
    height: 100,
    bay,
    type,
    ...extra,
  };
}
function structure(
  type: CoachStructure["type"],
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
): CoachStructure {
  return { id: `${type}-${x}-${y}`, type, label, x, y, width, height };
}
function economy(mode: "seat" | "berth"): CoachLayout {
  const places: CoachPlace[] = [],
    structures: CoachStructure[] = [];
  for (let bay = 0; bay < 10; bay++) {
    const y = bay * 260;
    for (let face = 0; face < 2; face++) {
      const row = bay * 2 + face;
      for (let col = 0; col < 3; col++) {
        const label = labelB(row * 3 + 3 - col);
        places.push(
          place(
            label,
            240 + col * 92,
            y + face * 140,
            String(bay + 1),
            mode === "berth" ? "berth" : "seat",
            {
              physicalId: `ec78-${label}`,
              ...(mode === "berth"
                ? {
                    tier: (["upper", "middle", "lower"] as const)[col],
                    stack: `bay-${bay + 1}-stack-${face + 1}`,
                  }
                : {}),
            },
          ),
        );
      }
      if (row > 0 && row < 19) {
        const label = `${row + 60}S`;
        places.push(
          place(label, 10, y + face * 140, String(bay + 1), "seat", {
            physicalId: `ec78-${label}`,
          }),
        );
      }
    }
    structures.push(
      structure("table", "Table", 10, y + 110, 80, 20),
      structure("table", "Table", 445, y + 110, 70, 20),
    );
    if (mode === "berth" && bay < 9)
      structures.push(
        structure("wall", "Compartment wall", 0, y + 250, 105, 5),
        structure("wall", "Compartment wall", 235, y + 250, 285, 5),
      );
  }
  structures.unshift(structure("aisle", "Aisle", 112, 0, 115, 2600));
  return {
    id: `economy-${mode}-78`,
    version: 1,
    classId: "economy",
    name: `Economy · ${mode === "seat" ? "fixed-seat configuration" : "three-tier berth configuration"}`,
    mode,
    inventoryFamily: "ec78",
    width: 525,
    height: 2600,
    verification: "numbered",
    reviewedAt,
    sources: source(
      mode === "seat" ? "1. Economy (Seat)" : "2. Economy (Berth)",
      mode === "seat"
        ? ["1.png", "2.png", "seat description.txt"]
        : [
            "1.png",
            "2.png",
            "seat description.txt",
            "train image.png",
            "train ref image 1.png",
            "train ref image 2.png",
          ],
    ),
    places,
    structures,
  };
}
function standard(): CoachLayout {
  const rows = [
    [72, 71],
    [70, 69, 68],
    ...Array.from({ length: 17 }, (_, i) => [i * 3 + 3, i * 3 + 2, i * 3 + 1]),
    [53, 52],
  ];
  const places: CoachPlace[] = [],
    structures: CoachStructure[] = [];
  let y = 0;
  rows.forEach((row, i) => {
    row.forEach((n, col) =>
      places.push(
        place(
          labelB(n),
          240 + (col + (row.length === 2 ? 1 : 0)) * 92,
          y,
          `section-${Math.floor((i + 1) / 2)}`,
          "berth",
        ),
      ),
    );
    if (i >= 4 && i <= 17)
      places.push(
        place(
          labelB(71 - i),
          10,
          y,
          `section-${Math.floor((i + 1) / 2)}`,
          "berth",
        ),
      );
    y += 110;
    if (i % 2 === 0 && i < rows.length - 1) {
      structures.push(structure("table", "Table", 445, y, 70, 20));
      y += 35;
    }
  });
  structures.unshift(structure("aisle", "Aisle", 115, 0, 110, y));
  return {
    id: "ac-standard-72",
    version: 1,
    classId: "standard",
    name: "AC Lower Standard · supplied 72-place berth variant",
    mode: "berth",
    inventoryFamily: "acl72",
    width: 525,
    height: y,
    verification: "numbered",
    warning:
      "Berth tiers are not identified in this reference. No lower, middle or upper tier is inferred from its numbers.",
    reviewedAt,
    sources: source("3. AC Lower Standard (Berth)", ["1.png", "2.png"]),
    places,
    structures,
  };
}
function business(): CoachLayout {
  const places: CoachPlace[] = [],
    structures: CoachStructure[] = [];
  for (let i = 0; i < 9; i++) {
    const letter = String.fromCharCode(65 + i),
      y = i * 280;
    for (let face = 0; face < 2; face++) {
      (["U", "M", "L"] as const).forEach((tier, col) =>
        places.push(
          place(
            `${letter}${tier}${face * 3 + 3 - col}`,
            240 + col * 92,
            y + face * 150,
            `Lounge ${letter}`,
            "berth",
            {
              tier: ({ U: "upper", M: "middle", L: "lower" } as const)[tier],
              stack: `${letter}-${face}`,
            },
          ),
        ),
      );
      structures.push(
        structure(
          "fixture",
          "Unlabelled fixture",
          5,
          y + face * 140 + 35,
          45,
          65,
        ),
      );
    }
    structures.push(
      structure("table", "Table", 445, y + 113, 70, 24),
      structure("wall", "Lounge boundary", 232, y, 4, 100),
      structure("wall", "Lounge boundary", 232, y + 150, 4, 110),
    );
    if (i < 8)
      structures.push(structure("wall", "Lounge wall", 232, y + 270, 290, 5));
  }
  structures.unshift(structure("aisle", "Corridor", 65, 0, 155, 2520));
  return {
    id: "ac-business-54",
    version: 1,
    classId: "business",
    name: "AC Business · lounges A–I",
    mode: "berth",
    inventoryFamily: "aclz54",
    width: 525,
    height: 2520,
    verification: "numbered",
    reviewedAt,
    sources: source("4. AC Business", ["1.png", "2.png", "3.png"]),
    places,
    structures,
  };
}
function sleeper(): CoachLayout {
  const places: CoachPlace[] = [],
    structures: CoachStructure[] = [];
  let y = 0;
  ["A", "B", "C", "D", "E", "F"].forEach((letter, i) => {
    const double = letter === "C" || letter === "D";
    const firstY =
      letter === "A" || letter === "B" || letter === "F" ? y + 55 : y;
    places.push(
      place(`${letter}U2`, 330, firstY, `Cabin ${letter}`, "berth", {
        tier: "upper",
        stack: `${letter}-1`,
      }),
      place(`${letter}L1`, 422, firstY, `Cabin ${letter}`, "berth", {
        tier: "lower",
        stack: `${letter}-1`,
      }),
    );
    const tableY = double || letter === "E" ? y + 110 : y + 15;
    structures.push(structure("table", "Table", 445, tableY, 70, 20));
    if (double) {
      const x = letter === "C" ? 115 : 330;
      places.push(
        place(`${letter}U4`, x, y + 150, `Cabin ${letter}`, "berth", {
          tier: "upper",
          stack: `${letter}-2`,
        }),
        place(`${letter}L3`, x + 92, y + 150, `Cabin ${letter}`, "berth", {
          tier: "lower",
          stack: `${letter}-2`,
        }),
      );
    }
    structures.push(
      structure("wall", "Cabin boundary", 108, y, 4, double ? 255 : 165),
    );
    y += double ? 265 : 175;
    if (i < 5) structures.push(structure("wall", "Cabin wall", 110, y, 410, 4));
    if ([0, 2, 4].includes(i)) {
      const names = i === 0 ? ["A", "B"] : i === 2 ? ["D", "C"] : ["E", "F"];
      structures.push(
        structure("toilet", `Toilet ${names[0]}-Cabin`, 112, y + 5, 182, 38),
        structure("toilet", `Toilet ${names[1]}-Cabin`, 298, y + 5, 222, 38),
      );
      y += 50;
    }
  });
  structures.unshift(structure("aisle", "Corridor", 5, 0, 95, y));
  return {
    id: "cabin-16",
    version: 1,
    classId: "sleeper",
    name: "AC Sleeper folder · 16-berth cabins A–F",
    mode: "berth",
    inventoryFamily: "cabin16",
    width: 525,
    height: y,
    verification: "numbered",
    warning:
      "Class label unresolved: supplied folder says AC Sleeper, accompanying text says AC Business. Geometry retained; no real service or fare assigned.",
    reviewedAt,
    sources: source("5. AC Sleeper", ["1.png", "seat description.txt"]),
    places,
    structures,
  };
}
function parlour(): CoachLayout {
  const places: CoachPlace[] = [];
  for (let row = 0; row < 14; row++)
    for (let col = 0; col < 4; col++)
      places.push(
        place(
          null,
          [10, 102, 334, 426][col],
          row * 115,
          `row-${row + 1}`,
          "seat",
          { rotatable: true },
        ),
      );
  return {
    id: "parlour-56-unnumbered",
    version: 1,
    classId: "parlour",
    name: "AC Parlour · 14 rows of rotating seats",
    mode: "seat",
    inventoryFamily: "pc56",
    width: 525,
    height: 1610,
    verification: "partial",
    warning:
      "Seat numbers are absent from the supplied file. These are unnumbered positions, available for layout preview only. Reclining capability is not specified.",
    reviewedAt,
    sources: source("6. AC Parlour", ["seat arrangement.txt"]),
    places,
    structures: [structure("aisle", "Aisle", 205, 0, 115, 1610)],
  };
}
export const coachLayouts: CoachLayout[] = [
  economy("seat"),
  economy("berth"),
  standard(),
  business(),
  sleeper(),
  parlour(),
].map((v) => layoutSchema.parse(v));
export const getLayout = (id: string, version = 1) =>
  coachLayouts.find((v) => v.id === id && v.version === version);
export const layoutTitle = (layout: CoachLayout) =>
  layout.name
    .replace("supplied ", "")
    .replace("AC Sleeper folder", "AC Sleeper");
export function placeDescription(p: CoachPlace) {
  return `${accommodationNames[p.type]}${p.tier ? ` · ${p.tier} tier` : p.type === "berth" ? " · tier unspecified" : ""}${p.rotatable ? " · rotatable" : ""}`;
}
export const coachInstanceSchema = z.strictObject({
  id: z.string(),
  number: z.string(),
  order: z.number().int().nonnegative(),
  classId: z.string(),
  layoutId: z.string(),
  layoutVersion: z.number().int().positive(),
});
export type CoachInstance = z.infer<typeof coachInstanceSchema>;
export const serviceSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  origin: z.literal("sample"),
  baseFare: z.number().positive(),
  coaches: z.array(coachInstanceSchema),
  // These are the existing prototype's fare rules, not imported railway fares.
  fareMultipliers: z.record(z.string(), z.number().positive()),
});
export type CoachService = z.infer<typeof serviceSchema>;
function configuredCoach(
  number: string,
  order: number,
  layoutId: string,
): CoachInstance {
  const layout = getLayout(layoutId)!;
  return {
    id: `coach-${number}`,
    number,
    order,
    classId: layout.classId,
    layoutId,
    layoutVersion: layout.version,
  };
}
export const sampleCoachServices: CoachService[] = [
  {
    id: "sample-0",
    name: "Mehran Explorer",
    origin: "sample",
    baseFare: 2400,
    coaches: [
      configuredCoach("A", 0, "economy-seat-78"),
      configuredCoach("B", 1, "ac-standard-72"),
    ],
    fareMultipliers: { economy: 1, standard: 1.6 },
  },
  {
    id: "sample-1",
    name: "Indus Voyager",
    origin: "sample",
    baseFare: 2800,
    coaches: [
      configuredCoach("A", 0, "economy-berth-78"),
      configuredCoach("B", 1, "ac-business-54"),
    ],
    fareMultipliers: { economy: 1, business: 2.2 },
  },
  {
    id: "sample-2",
    name: "Northern Journey",
    origin: "sample",
    baseFare: 2600,
    coaches: [
      configuredCoach("A", 0, "economy-seat-78"),
      configuredCoach("B", 1, "ac-business-54"),
      configuredCoach("C", 2, "parlour-56-unnumbered"),
    ],
    fareMultipliers: { economy: 1, business: 2.2 },
  },
  {
    id: "sample-3",
    name: "Emerald Night",
    origin: "sample",
    baseFare: 2200,
    coaches: [
      configuredCoach("A", 0, "economy-berth-78"),
      configuredCoach("B", 1, "cabin-16"),
    ],
    fareMultipliers: { economy: 1 },
  },
];
export type Occupancy = {
  state: "available" | "occupied" | "unknown";
  gender?: "male" | "female" | "unspecified";
};
export function occupancyCategory(value: unknown): Occupancy["gender"] {
  return value === "male" || value === "female" ? value : "unspecified";
}
// No authorized live occupancy source exists. Sample unavailability is neutral.
export function sampleOccupancy(
  layout: CoachLayout,
  placeId: string,
): Occupancy {
  const index = layout.places.findIndex((p) => p.id === placeId);
  return [4, 7, 12, 18].includes(index)
    ? { state: "occupied", gender: "unspecified" }
    : { state: "available" };
}
export type CoachOffer = {
  serviceId: string;
  origin: "sample";
  from: string;
  to: string;
  date: string;
  classId: string;
  className: string;
  mode: "seat" | "berth";
  coaches: CoachInstance[];
  consist: CoachInstance[];
  quote: {
    amount: number;
    currency: "PKR";
    source: "existing-sample-fare";
    passengerCategories: ["adult", "child"];
    selectionSurcharge: 0;
  } | null;
};
export const offerSchema = z.strictObject({
  serviceId: z.string(),
  origin: z.literal("sample"),
  from: z.string(),
  to: z.string(),
  date: z.string(),
  classId: z.string(),
  className: z.string(),
  mode: z.enum(["seat", "berth"]),
  coaches: z.array(coachInstanceSchema),
  consist: z.array(coachInstanceSchema),
  quote: z
    .strictObject({
      amount: z.number().positive(),
      currency: z.literal("PKR"),
      source: z.literal("existing-sample-fare"),
      passengerCategories: z.tuple([z.literal("adult"), z.literal("child")]),
      selectionSurcharge: z.literal(0),
    })
    .nullable(),
});
export const railwayStationIds = ["LHE", "RWP", "KHI", "ISB", "MUX", "FSD"];
export function serviceOffers(
  service: CoachService,
  from: string,
  to: string,
  date: string,
): CoachOffer[] {
  return [
    ...new Set(
      service.coaches.map((c) => `${c.classId}:${getLayout(c.layoutId)!.mode}`),
    ),
  ].map((key) => {
    const [classId, mode] = key.split(":") as [string, "seat" | "berth"];
    const coaches = service.coaches.filter(
      (c) =>
        c.classId === classId &&
        getLayout(c.layoutId, c.layoutVersion)?.mode === mode,
    );
    const quotable =
      railwayStationIds.includes(from) &&
      railwayStationIds.includes(to) &&
      from !== to &&
      service.fareMultipliers[classId] &&
      coaches.every(
        (c) =>
          getLayout(c.layoutId)?.verification === "numbered" &&
          c.layoutId !== "cabin-16",
      );
    return {
      serviceId: service.id,
      origin: "sample",
      from,
      to,
      date,
      classId,
      className: travelClasses.find((c) => c.id === classId)!.name,
      mode,
      coaches: coaches.map((c) => ({ ...c })),
      consist: service.coaches.map((c) => ({ ...c })),
      quote: quotable
        ? {
            amount: Math.round(
              service.baseFare *
                service.fareMultipliers[classId] *
                ([from, to].includes("KHI") ? 2 : 1),
            ),
            currency: "PKR",
            source: "existing-sample-fare",
            passengerCategories: ["adult", "child"],
            selectionSurcharge: 0,
          }
        : null,
    };
  });
}
