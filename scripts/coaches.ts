import { loadEnvConfig } from "@next/env";
import { closeDatabase, database } from "../src/server/db/mongodb";
import {
  seedCoachCatalogue,
  validateCoachCatalogue,
} from "../src/server/coach-store";
import { DatabaseError } from "../src/server/db/errors";

loadEnvConfig(process.cwd());
async function main() {
  const args = process.argv.slice(2);
  if (
    args.some((a) => !["--apply", "--offline"].includes(a)) ||
    (args.includes("--apply") && args.includes("--offline"))
  )
    throw Error("Use [--offline] or [--apply]; default is a database dry-run.");
  const counts = validateCoachCatalogue();
  if (args.includes("--offline")) {
    console.log(
      JSON.stringify({ mode: "offline-validation", counts }, null, 2),
    );
    return;
  }
  const db = await database();
  const result = await seedCoachCatalogue(db, args.includes("--apply"));
  console.log(JSON.stringify(result, null, 2));
  if (args.includes("--apply")) {
    const repeated = await seedCoachCatalogue(db, false);
    console.log(
      JSON.stringify(
        {
          verification: "read-back and repeated dry-run",
          inserted: repeated.inserted,
          unchanged: repeated.unchanged,
          stored: {
            classes: await db.collection("travelClasses").countDocuments({
              referenceOwner: "supplied-coach-references-2026-11-02",
            }),
            templates: await db
              .collection("coachLayoutTemplates")
              .countDocuments({
                referenceOwner: "supplied-coach-references-2026-11-02",
              }),
            sampleServices: await db
              .collection("demo_coachServices")
              .countDocuments({
                referenceOwner: "supplied-coach-references-2026-11-02",
              }),
          },
        },
        null,
        2,
      ),
    );
  }
}
main()
  .catch((e) => {
    console.error(
      e instanceof DatabaseError
        ? "Coach catalogue database is unavailable or not configured."
        : e instanceof Error && !/mongodb|password|srv/i.test(e.message)
          ? e.message
          : "Coach catalogue operation failed.",
    );
    process.exitCode = 1;
  })
  .finally(closeDatabase);
