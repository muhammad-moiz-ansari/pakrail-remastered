import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { Db } from "mongodb";
import {
  coachLayouts,
  allCoachLayouts,
  allCoachServices,
  layoutSchema,
  reviewedAt,
  sampleCoachServices,
  serviceSchema,
  travelClasses,
  classSources,
} from "../lib/coach-layouts";
import { travelClassSchema } from "../lib/catalogue/models";

const owner = "supplied-coach-references-2026-11-02";
export const fingerprint = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function validateCoachCatalogue() {
  const keys = new Set();
  for (const layout of allCoachLayouts) {
    layoutSchema.parse(layout);
    const key = `${layout.id}:${layout.version}`;
    if (keys.has(key)) throw Error("Duplicate layout identity");
    keys.add(key);
  }
  for (const service of allCoachServices) {
    serviceSchema.parse(service);
    if (
      new Set(service.coaches.map((c) => c.id)).size !== service.coaches.length
    )
      throw Error("Duplicate coach identity");
    if (
      new Set(service.coaches.map((c) => c.order)).size !==
      service.coaches.length
    )
      throw Error("Duplicate coach order");
    for (const coach of service.coaches)
      if (
        !allCoachLayouts.some(
          (l) =>
            l.id === coach.layoutId &&
            l.version === coach.layoutVersion &&
            l.classId === coach.classId,
        )
      )
        throw Error("Unknown/incompatible coach layout");
  }
  return {
    classes: travelClasses.length,
    templates: coachLayouts.length,
    templateVersions: allCoachLayouts.length,
    numberedPlaces: coachLayouts
      .filter((l) => l.verification === "numbered")
      .reduce((n, l) => n + l.places.length, 0),
    unnumberedPositions: 56,
    sampleServices: sampleCoachServices.length,
    sampleServiceVersions: allCoachServices.length,
    liveDepartures: 0,
  };
}
const sourceFact = (sourceUrl: string, notes: string) => ({
  sourceUrl,
  retrievedAt: reviewedAt,
  verifiedAt: reviewedAt,
  verificationStatus: "verified" as const,
  dataOrigin: "manually-entered" as const,
  notes,
});
export const classRecords = travelClasses.map((c) =>
  travelClassSchema.parse({
    id: c.id,
    name: c.name,
    code: c.code,
    aliases: c.aliases,
    description: c.description,
    accommodationModes: [
      ...new Set(
        coachLayouts.filter((l) => l.classId === c.id).map((l) => l.mode),
      ),
    ],
    sourceCodes: { "pakrail.gov.pk": c.code },
    provenance: sourceFact(
      classSources.official,
      "Official names/codes browser checked. Layout evidence is recorded separately.",
    ),
    fieldSources: {
      name: sourceFact(
        classSources.official,
        "Canonical source-specific name.",
      ),
      code: sourceFact(
        classSources.official,
        "Official code; not a global code system.",
      ),
      description: sourceFact(
        classSources.comparison,
        "General category only; supplied local coach diagrams define variants. No universal amenities or capacity imported.",
      ),
    },
  }),
);
export async function seedCoachCatalogue(db: Db, apply = false) {
  const counts = validateCoachCatalogue();
  const records = [
    ...classRecords.map((record) => ({
      collection: "travelClasses",
      query: { id: record.id },
      record,
    })),
    ...allCoachLayouts.map((record) => ({
      collection: "coachLayoutTemplates",
      query: { id: record.id, version: record.version },
      record,
    })),
    ...allCoachServices.map((record) => ({
      collection: "demo_coachServices",
      query: { id: record.id },
      record,
    })),
  ];
  const plan: {
    collection: string;
    id: string;
    action: "insert" | "unchanged";
  }[] = [];
  for (const entry of records) {
    const existing = await db.collection(entry.collection).findOne(entry.query);
    const hash = fingerprint(entry.record);
    const storedPayload = existing
      ? Object.fromEntries(
          Object.entries(existing).filter(
            ([key]) =>
              !["_id", "referenceOwner", "fingerprint", "createdAt"].includes(
                key,
              ),
          ),
        )
      : null;
    if (
      existing &&
      (existing.referenceOwner !== owner ||
        existing.fingerprint !== hash ||
        !isDeepStrictEqual(storedPayload, entry.record))
    )
      throw Error(
        `Existing ${entry.collection}/${entry.record.id} is not the identical owned reference version. No replacement allowed; review it or create a new template version.`,
      );
    if (entry.collection === "travelClasses") {
      const conflict = await db.collection(entry.collection).findOne({
        code: (entry.record as (typeof classRecords)[number]).code,
        id: { $ne: entry.record.id },
      });
      if (conflict)
        throw Error(
          `Class code already belongs to a different record. Review the mapping for ${entry.record.id}; no customer record overwritten.`,
        );
    }
    plan.push({
      collection: entry.collection,
      id: entry.record.id,
      action: existing ? "unchanged" : "insert",
    });
  }
  if (apply) {
    await db
      .collection("travelClasses")
      .createIndex({ id: 1 }, { unique: true, name: "stable_id_unique" });
    await db
      .collection("coachLayoutTemplates")
      .createIndex({ id: 1, version: 1 }, { unique: true });
    await db
      .collection("demo_coachServices")
      .createIndex({ id: 1 }, { unique: true });
    for (const entry of records) {
      const hash = fingerprint(entry.record);
      // Include fingerprint/owner in the predicate: a racing import cannot overwrite data.
      await db.collection(entry.collection).updateOne(
        { ...entry.query, fingerprint: hash, referenceOwner: owner },
        {
          $setOnInsert: {
            ...entry.record,
            referenceOwner: owner,
            fingerprint: hash,
            createdAt: reviewedAt,
          },
        },
        { upsert: true },
      );
    }
  }
  return {
    mode: apply ? "applied" : "dry-run",
    counts,
    inserted: plan.filter((p) => p.action === "insert").length,
    unchanged: plan.filter((p) => p.action === "unchanged").length,
    plan,
  };
}
export async function readCoachService(db: Db, id: string) {
  const row = await db
    .collection("demo_coachServices")
    .findOne({ id, referenceOwner: owner }, { projection: { _id: 0 } });
  if (!row) return null;
  const hash = row.fingerprint;
  const data = Object.fromEntries(
    Object.entries(row).filter(
      ([key]) => !["referenceOwner", "fingerprint", "createdAt"].includes(key),
    ),
  );
  const service = serviceSchema.parse(data);
  if (fingerprint(service) !== hash)
    throw Error("Coach service integrity mismatch");
  for (const id of new Set(service.coaches.map((c) => c.classId))) {
    const expected = classRecords.find((c) => c.id === id);
    const stored = await db
      .collection("travelClasses")
      .findOne({ id }, { projection: { fingerprint: 1 } });
    if (!expected || stored?.fingerprint !== fingerprint(expected))
      throw Error("Pinned class reference not available");
  }
  for (const coach of service.coaches) {
    const expected = allCoachLayouts.find(
      (l) => l.id === coach.layoutId && l.version === coach.layoutVersion,
    );
    const stored = await db
      .collection("coachLayoutTemplates")
      .findOne(
        { id: coach.layoutId, version: coach.layoutVersion },
        { projection: { fingerprint: 1 } },
      );
    if (!expected || stored?.fingerprint !== fingerprint(expected))
      throw Error("Pinned layout not available");
  }
  return service;
}
