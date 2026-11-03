import { loadEnvConfig } from "@next/env";
import { database, closeDatabase } from "../src/server/db/mongodb";
import { geographySeeds, pointSchema } from "../src/lib/journey-geography";
loadEnvConfig(process.cwd());
async function main() {
  const db = await database();
  const collection = db.collection("stationGeography");
  await collection.createIndex({ stationId: 1 }, { unique: true });
  let matched = 0;
  for (const seed of geographySeeds) {
    pointSchema.parse(seed);
    const station = await db
      .collection("stations")
      .findOne({ id: seed.stationId, name: seed.name, active: true });
    if (!station) continue;
    await collection.updateOne(
      { stationId: seed.stationId },
      {
        $set: {
          ...seed,
          verifiedAt: "2026-11-03",
          coordinateKind: "station reference point",
        },
      },
      { upsert: true },
    );
    matched++;
  }
  console.log(
    JSON.stringify({
      matched,
      stored: await collection.countDocuments(),
      stations: await db.collection("stations").countDocuments(),
      routes: await db.collection("routes").countDocuments(),
    }),
  );
}
main()
  .catch(() => {
    console.error(
      "Geography seed failed; check database configuration/connectivity.",
    );
    process.exitCode = 1;
  })
  .finally(closeDatabase);
