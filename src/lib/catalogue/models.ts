import { z } from "zod";

export const identifier = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/);
const text = z.string().trim().min(1).max(500);
const date = z.iso.date();
const timestamp = z.iso.datetime({ offset: true });
export const sourceSchema = z
  .strictObject({
    sourceUrl: z.url().nullable(),
    sourceTitle: text.optional(),
    retrievedAt: timestamp,
    verifiedAt: timestamp.nullable(),
    verificationStatus: z.enum(["unverified", "verified", "stale"]),
    dataOrigin: z.enum(["official-public", "manually-entered", "demo"]),
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((s, ctx) => {
    if (
      s.verificationStatus === "verified" &&
      (!s.verifiedAt || !s.sourceUrl || s.dataOrigin === "demo")
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Verified facts require a source URL, verification date and non-demo origin.",
      });
    if (s.sourceUrl && !/^https?:\/\//i.test(s.sourceUrl))
      ctx.addIssue({
        code: "custom",
        message: "Source URL must use HTTP or HTTPS.",
      });
    if (s.sourceUrl && URL.canParse(s.sourceUrl)) {
      const url = new URL(s.sourceUrl);
      if (url.username || url.password)
        ctx.addIssue({
          code: "custom",
          message: "Source URLs must be public and contain no credentials.",
        });
    }
  });
const common = {
  id: identifier,
  provenance: sourceSchema,
  fieldSources: z
    .record(z.string().regex(/^[a-zA-Z][\w.-]{0,99}$/), sourceSchema)
    .optional(),
  createdAt: timestamp.optional(),
  updatedAt: timestamp.optional(),
};
const period = {
  effectiveFrom: date.nullable().optional(),
  effectiveTo: date.nullable().optional(),
};
const checkPeriod = (v: {
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}) => !v.effectiveFrom || !v.effectiveTo || v.effectiveFrom <= v.effectiveTo;

export const stationSchema = z.strictObject({
  ...common,
  name: text,
  officialCode: z.string().trim().min(1).max(30).optional(),
  city: text.nullable().optional(),
  aliases: z.array(text).max(50).optional(),
  active: z.boolean().nullable().optional(),
});
export const trainSchema = z.strictObject({
  ...common,
  name: text,
  officialNumber: z.string().trim().min(1).max(40).optional(),
  direction: text.optional(),
  serviceVariant: text.optional(),
  active: z.boolean().nullable().optional(),
});
export const travelClassSchema = z.strictObject({
  ...common,
  name: text,
  code: z.string().trim().min(1).max(40).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  aliases: z.array(text).max(50).optional(),
  accommodationModes: z.array(z.enum(["seat", "berth", "recliner"])).optional(),
  sourceCodes: z.record(z.string(), z.string()).optional(),
});
const stopSchema = z.strictObject({
  stationId: identifier,
  sequence: z.number().int().nonnegative(),
  arrivalTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
  departureTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
  arrivalDayOffset: z.number().int().nonnegative().nullable().optional(),
  departureDayOffset: z.number().int().nonnegative().nullable().optional(),
  provenance: sourceSchema.optional(),
});
export const routeSchema = z
  .strictObject({
    ...common,
    trainId: identifier,
    variant: text,
    stops: z.array(stopSchema).min(2).max(500),
  })
  .superRefine((r, ctx) => {
    const ids = new Set(),
      sequences = new Set();
    let previousDeparture: number | undefined;
    for (let i = 0; i < r.stops.length; i++) {
      const s = r.stops[i];
      if (
        ids.has(s.stationId) ||
        sequences.has(s.sequence) ||
        (i > 0 && s.sequence <= r.stops[i - 1].sequence)
      )
        ctx.addIssue({
          code: "custom",
          path: ["stops", i],
          message:
            "Stops must have unique stations and strictly increasing sequence numbers.",
        });
      ids.add(s.stationId);
      sequences.add(s.sequence);
      const minutes = (time?: string | null, offset?: number | null) =>
        time != null && offset != null
          ? offset * 1440 +
            Number(time.slice(0, 2)) * 60 +
            Number(time.slice(3))
          : undefined;
      const arrival = minutes(s.arrivalTime, s.arrivalDayOffset),
        departure = minutes(s.departureTime, s.departureDayOffset);
      if (
        (arrival !== undefined &&
          previousDeparture !== undefined &&
          arrival < previousDeparture) ||
        (arrival !== undefined &&
          departure !== undefined &&
          departure < arrival)
      )
        ctx.addIssue({
          code: "custom",
          path: ["stops", i],
          message: "Known times/day offsets must follow route order.",
        });
      previousDeparture = departure ?? arrival ?? previousDeparture;
    }
  });
export const scheduleSchema = z
  .strictObject({
    ...common,
    routeId: identifier,
    ...period,
    operatingWeekdays: z
      .array(z.number().int().min(1).max(7))
      .max(7)
      .refine((v) => new Set(v).size === v.length, "Weekdays must be unique.")
      .nullable()
      .optional(),
    exceptions: z
      .array(
        z.strictObject({
          date,
          operates: z.boolean(),
          provenance: sourceSchema.optional(),
        }),
      )
      .optional(),
  })
  .refine(checkPeriod, "Effective period is reversed.");
export const fareSchema = z
  .strictObject({
    ...common,
    routeId: identifier,
    trainId: identifier.optional(),
    originId: identifier,
    destinationId: identifier,
    classId: identifier,
    passengerCategory: text.nullable().optional(),
    amountMinor: z
      .number()
      .int()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER)
      .nullable()
      .optional(),
    currency: z.literal("PKR"),
    ...period,
  })
  .refine(checkPeriod, "Effective period is reversed.")
  .refine(
    (f) => f.originId !== f.destinationId,
    "Fare origin and destination must differ.",
  );

export const catalogueSchemas = {
  stations: stationSchema,
  trains: trainSchema,
  travelClasses: travelClassSchema,
  routes: routeSchema,
  schedules: scheduleSchema,
  fares: fareSchema,
};
export type CollectionName = keyof typeof catalogueSchemas;
export type StationRecord = z.infer<typeof stationSchema>;
export type TrainRecord = z.infer<typeof trainSchema>;
export type TravelClassRecord = z.infer<typeof travelClassSchema>;
export type RouteRecord = z.infer<typeof routeSchema>;
export type ScheduleRecord = z.infer<typeof scheduleSchema>;
export type FareRecord = z.infer<typeof fareSchema>;
export type CatalogueRecord = z.infer<
  (typeof catalogueSchemas)[CollectionName]
>;
