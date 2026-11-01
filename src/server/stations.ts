import "server-only";
import { database } from "./db/mongodb";
import { DatabaseError, publicDatabaseError } from "./db/errors";
import { StationRecord } from "../lib/catalogue/models";
import {
  escapeRegex,
  publicStation,
  STATION_LIMIT,
} from "../lib/station-search";
import { stations as demoStations } from "../lib/booking";

export async function findStations(q: string) {
  const provider = process.env.STATION_DATA_PROVIDER ?? "mongodb";
  if (provider === "demo") {
    const matcher = new RegExp(escapeRegex(q), "i");
    // Fixture IDs are not official station codes.
    return {
      provider: "demo" as const,
      stations: demoStations
        .filter((s) => matcher.test(`${s.name} ${s.city} ${s.id}`))
        .slice(0, STATION_LIMIT)
        .map((s) => ({ id: s.id, name: s.name, city: s.city })),
    };
  }
  if (provider !== "mongodb") throw new DatabaseError("DB_CONFIG");
  try {
    const db = await database();
    const regex = new RegExp(escapeRegex(q), "i");
    const rows = await db
      .collection<StationRecord>("stations")
      .find(
        {
          active: true,
          "provenance.dataOrigin": { $ne: "demo" },
          ...(q
            ? {
                $or: [
                  { name: regex },
                  { aliases: regex },
                  { officialCode: regex },
                  { city: regex },
                ],
              }
            : {}),
        },
        {
          projection: { _id: 0, id: 1, name: 1, city: 1, officialCode: 1 },
          maxTimeMS: 2000,
        },
      )
      .sort({ name: 1, id: 1 })
      .limit(STATION_LIMIT)
      .toArray();
    return { provider: "mongodb" as const, stations: rows.map(publicStation) };
  } catch (error) {
    throw publicDatabaseError(error);
  }
}
