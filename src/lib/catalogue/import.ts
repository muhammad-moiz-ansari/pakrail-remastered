import { parse } from "csv-parse/sync";
import {
  catalogueSchemas,
  CatalogueRecord,
  CollectionName,
  identifier,
} from "./models";
import { isDeepStrictEqual } from "node:util";

class ImportIssue extends Error {}
type Row = Record<string, unknown>;
export type Lookup = (
  collection: CollectionName,
  id: string,
) => Promise<Row | null>;
export type Change = {
  id: string;
  before: Row | null;
  record: CatalogueRecord;
  action: "inserted" | "updated" | "unchanged";
};
export type ImportPlan = {
  changes: Change[];
  errors: { row: number; message: string }[];
  counts: {
    inserted: number;
    updated: number;
    unchanged: number;
    rejected: number;
  };
};

// Blank input means "no new fact", never deletion. Arrays are replaced only when non-empty.
export function mergeFacts(existing: Row, incoming: Row): Row {
  const result = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (["__proto__", "prototype", "constructor", "_id"].includes(key))
      continue;
    if (value == null || (Array.isArray(value) && !value.length)) {
      if (!(key in result)) result[key] = value;
      continue;
    }
    if (value === "" || (typeof value === "string" && !value.trim())) continue;
    if (typeof value === "object" && !Array.isArray(value))
      result[key] = mergeFacts(
        (result[key] && typeof result[key] === "object"
          ? result[key]
          : {}) as Row,
        value as Row,
      );
    else result[key] = value;
  }
  return result;
}
export function parseImportFile(content: string, csv: boolean): unknown[] {
  if (!csv) {
    const v: unknown = JSON.parse(content);
    if (!Array.isArray(v)) throw new Error("JSON imports must be arrays.");
    return v;
  }
  const rows = parse(content, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    max_record_size: 200_000,
  }) as Record<string, string>[];
  const jsonFields = new Set([
    "aliases",
    "active",
    "provenance",
    "fieldSources",
    "stops",
    "operatingWeekdays",
    "exceptions",
    "amountMinor",
  ]);
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row)
        .filter(([, value]) => value.trim() !== "")
        .map(([key, value]) => [
          key,
          jsonFields.has(key) && value.trim() ? JSON.parse(value) : value,
        ]),
    ),
  );
}
export function naturalKey(collection: CollectionName, r: Row) {
  const fields: Record<CollectionName, string[]> = {
    stations: ["officialCode"],
    travelClasses: ["code"],
    trains: ["officialNumber", "direction", "serviceVariant"],
    routes: ["trainId", "variant"],
    schedules: ["routeId", "effectiveFrom", "effectiveTo"],
    fares: [
      "routeId",
      "originId",
      "destinationId",
      "classId",
      "passengerCategory",
      "effectiveFrom",
      "effectiveTo",
    ],
  };
  if (
    ["stations", "travelClasses", "trains"].includes(collection) &&
    !r[fields[collection][0]]
  )
    return null;
  return fields[collection]
    .map((k) => String(r[k] ?? "").toLocaleLowerCase("en-US"))
    .join("|");
}
export async function planImport(
  collection: CollectionName,
  rows: unknown[],
  lookup: Lookup,
  existingRows: Row[] = [],
  demo = false,
): Promise<ImportPlan> {
  const changes: Change[] = [],
    errors: ImportPlan["errors"] = [];
  const ids = new Set<string>(),
    keys = new Map<string, string>();
  for (const r of existingRows) {
    const key = naturalKey(collection, r);
    if (key) keys.set(key, String(r.id));
  }
  for (let i = 0; i < rows.length; i++) {
    try {
      const input = rows[i];
      if (!input || typeof input !== "object" || Array.isArray(input))
        throw new ImportIssue("Expected an object.");
      const row = input as Row,
        id = identifier.parse(row.id);
      if (ids.has(id))
        throw new ImportIssue("Duplicate stable ID in this file.");
      ids.add(id);
      const before = await lookup(collection, id);
      const merged = mergeFacts(before ?? {}, row);
      delete merged._id;
      // An omitted nullable provenance value must be explicit on a new record.
      if (!before && row.provenance) merged.provenance = row.provenance;
      const parsed = catalogueSchemas[collection].safeParse(merged);
      if (!parsed.success)
        throw new ImportIssue(
          parsed.error.issues
            .map((v) => `${v.path.join(".") || "record"}: ${v.message}`)
            .join("; "),
        );
      const record = parsed.data;
      if (before) {
        const metadata = new Set([
          "id",
          "provenance",
          "fieldSources",
          "createdAt",
          "updatedAt",
        ]);
        for (const [field, value] of Object.entries(record)) {
          if (metadata.has(field) || isDeepStrictEqual(before[field], value))
            continue;
          const previousSource =
            (before.fieldSources as Record<string, Row> | undefined)?.[field] ??
            (before.provenance as Row | undefined);
          const suppliedSource =
            (row.fieldSources as Record<string, unknown> | undefined)?.[
              field
            ] ?? row.provenance;
          if (
            previousSource?.verificationStatus === "verified" &&
            !suppliedSource
          )
            throw new ImportIssue(
              `Changed verified field ${field} requires explicit source metadata. Do not inherit verification for a new fact.`,
            );
        }
      }
      if ((record.provenance.dataOrigin === "demo") !== demo)
        throw new ImportIssue(
          "Demo and public catalogue records must use separate collections (--demo).",
        );
      if (
        before?.provenance &&
        (before.provenance as Row).verificationStatus === "verified" &&
        record.provenance.verificationStatus === "unverified"
      )
        throw new ImportIssue(
          "Cannot downgrade a verified record through an import. Review the source conflict first.",
        );
      const key = naturalKey(collection, record as unknown as Row);
      if (key && keys.has(key) && keys.get(key) !== id)
        throw new ImportIssue(
          "Conflicting unique catalogue identity; reconcile IDs before importing.",
        );
      if (key) keys.set(key, id);
      const requireRef = async (name: CollectionName, value: string) => {
        const found = await lookup(name, value);
        if (!found)
          throw new ImportIssue(
            `Missing ${name} reference: ${value}. Import dependencies first.`,
          );
        return found;
      };
      if (collection === "routes") {
        const r = record as typeof catalogueSchemas.routes._output;
        await requireRef("trains", r.trainId);
        for (const stop of r.stops)
          await requireRef("stations", stop.stationId);
      }
      if (collection === "schedules")
        await requireRef(
          "routes",
          (record as typeof catalogueSchemas.schedules._output).routeId,
        );
      if (collection === "fares") {
        const f = record as typeof catalogueSchemas.fares._output;
        const r = await requireRef("routes", f.routeId);
        await requireRef("stations", f.originId);
        await requireRef("stations", f.destinationId);
        await requireRef("travelClasses", f.classId);
        if (f.trainId && f.trainId !== r.trainId)
          throw new ImportIssue("Fare train does not match its route.");
        const stops = r.stops as { stationId: string }[];
        if (
          stops.findIndex((v) => v.stationId === f.originId) < 0 ||
          stops.findIndex((v) => v.stationId === f.destinationId) <=
            stops.findIndex((v) => v.stationId === f.originId)
        )
          throw new ImportIssue(
            "Fare must follow a valid ordered origin/destination pair on its route.",
          );
      }
      const comparable = { ...(before ?? {}) };
      delete comparable._id;
      delete comparable.createdAt;
      delete comparable.updatedAt;
      const facts = { ...record };
      delete facts.createdAt;
      delete facts.updatedAt;
      changes.push({
        id,
        before,
        record,
        action: !before
          ? "inserted"
          : isDeepStrictEqual(comparable, facts)
            ? "unchanged"
            : "updated",
      });
    } catch (error) {
      // Error text is from our validator, never raw database driver errors or row contents.
      errors.push({
        row: i + 1,
        message:
          error instanceof ImportIssue
            ? error.message
            : error instanceof Error && error.name === "ZodError"
              ? "Invalid stable ID."
              : "Unable to validate catalogue references. Check the database connection.",
      });
    }
  }
  return {
    changes,
    errors,
    counts: {
      inserted: changes.filter((v) => v.action === "inserted").length,
      updated: changes.filter((v) => v.action === "updated").length,
      unchanged: changes.filter((v) => v.action === "unchanged").length,
      rejected: errors.length,
    },
  };
}
