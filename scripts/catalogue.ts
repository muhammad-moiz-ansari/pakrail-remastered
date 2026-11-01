import { loadEnvConfig } from "@next/env";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { database, closeDatabase } from "../src/server/db/mongodb";
import { publicDatabaseError } from "../src/server/db/errors";
import { collectionName, initializeIndexes } from "../src/server/db/indexes";
import { catalogueSchemas, CollectionName } from "../src/lib/catalogue/models";
import { parseImportFile, planImport } from "../src/lib/catalogue/import";

// Same environment-file precedence as Next, without printing any values.
loadEnvConfig(process.cwd());
async function main() {
  const [command, ...args] = process.argv.slice(2);
  const demo = args.includes("--demo"),
    apply = args.includes("--apply"),
    offline = args.includes("--offline");
  const knownFlags = ["--demo", "--apply", "--offline"];
  if (args.some((v) => v.startsWith("--") && !knownFlags.includes(v)))
    throw Error("Unknown CLI flag.");
  if (apply && offline)
    throw Error("--apply cannot be combined with --offline.");
  if (command === "check") {
    const db = await database();
    await db.command({ ping: 1 });
    console.log(
      "MongoDB connection check passed (read-only ping). No catalogue changes applied.",
    );
    return;
  }
  if (command === "indexes") {
    if (!apply) {
      console.log(
        "Index dry-run. Re-run with --apply to create catalogue indexes.",
      );
      return;
    }
    await initializeIndexes(await database(), demo);
    console.log(
      `Indexes initialized for ${demo ? "separate demo" : "public catalogue"} collections.`,
    );
    return;
  }
  if (command !== "import")
    throw Error(
      "Use check, indexes [--apply] [--demo], or import <collection> <file.json|csv> [--offline] [--demo] [--apply].",
    );
  const positional = args.filter((v) => !v.startsWith("--"));
  if (
    positional.length !== 2 ||
    !Object.hasOwn(catalogueSchemas, positional[0])
  )
    throw Error("Specify a supported collection and one JSON/CSV file.");
  const collection = positional[0] as CollectionName,
    path = resolve(positional[1]);
  if ((await stat(path)).size > 5_000_000)
    throw Error("Import file exceeds the 5 MB limit.");
  let rows: unknown[];
  try {
    rows = parseImportFile(
      await readFile(path, "utf8"),
      path.toLowerCase().endsWith(".csv"),
    );
  } catch {
    throw Error(
      "Invalid import file: expected a JSON array or CSV with valid JSON in structured columns.",
    );
  }
  if (rows.length > 5000)
    throw Error("Import files are limited to 5000 records.");
  const db = offline ? null : await database();
  const lookup = async (name: CollectionName, id: string) => {
    if (!db) return null;
    try {
      return await db.collection(collectionName(name, demo)).findOne({ id });
    } catch (e) {
      throw publicDatabaseError(e);
    }
  };
  const existing = db
    ? await db
        .collection(collectionName(collection, demo))
        .find({}, { limit: 100_000 })
        .toArray()
    : [];
  const plan = await planImport(collection, rows, lookup, existing, demo);
  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply-plan" : "dry-run",
        referenceChecks: offline
          ? "offline: existing database and external references not checked"
          : "database checked",
        collection: collectionName(collection, demo),
        counts: plan.counts,
        errors: plan.errors,
        proposedRecords: plan.changes.map((v) => ({
          action: v.action,
          ...v.record,
        })),
      },
      null,
      2,
    ),
  );
  if (plan.errors.length) {
    process.exitCode = 1;
    console.log("No writes applied: resolve every rejected row first.");
    return;
  }
  if (!apply) {
    console.log(
      "No writes applied. Review proposed records before using --apply.",
    );
    return;
  }
  if (!db) throw Error("Apply requires a database.");
  // Refuse writes before the explicit index initialization command has run.
  const indexes = await db
    .collection(collectionName(collection, demo))
    .listIndexes()
    .toArray();
  if (!indexes.some((i) => i.name === "stable_id_unique" && i.unique))
    throw Error("Initialize unique indexes before applying imports.");
  const target = db.collection(collectionName(collection, demo));
  for (const change of plan.changes) {
    if (change.action === "unchanged") continue;
    const now = new Date().toISOString();
    const record = {
      ...change.record,
      createdAt: change.before?.createdAt ?? now,
      updatedAt: now,
    };
    if (!change.before) await target.insertOne(record);
    else {
      const result = await target.replaceOne(
        {
          id: change.id,
          updatedAt: change.before.updatedAt ?? { $exists: false },
        },
        record,
      );
      if (!result.matchedCount)
        throw Error(
          "Catalogue changed during import. Stop and re-run the dry-run before retrying.",
        );
    }
  }
  console.log(
    "Import applied. Repeat imports preserve stable IDs; unchanged rows are not written.",
  );
}
main()
  .catch((error) => {
    // Driver errors, connection strings, filesystem paths and supplied rows are never logged.
    const allowed =
      error instanceof Error &&
      !error.name.startsWith("Mongo") &&
      !["TypeError", "SyntaxError"].includes(error.name);
    console.error(
      allowed &&
        !/(mongodb(?:\+srv)?:\/\/|password|ECONN|ENOTFOUND)/i.test(
          error.message,
        )
        ? error.message
        : "Catalogue operation failed. Check configuration, connectivity, indexes and source data; no credentials have been logged.",
    );
    process.exitCode = 1;
  })
  .finally(() => closeDatabase().catch(() => undefined));
