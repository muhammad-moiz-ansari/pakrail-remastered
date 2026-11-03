import { database } from "@/server/db/mongodb";
import { routeQuery, pointSchema } from "@/lib/journey-geography";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const input = routeQuery.safeParse(Object.fromEntries(params));
  if (!input.success || params.size !== 2)
    return Response.json(
      { error: "Provide two distinct station IDs." },
      { status: 400 },
    );
  try {
    const db = await database();
    const ids = [input.data.from, input.data.to];
    const stations = await db
      .collection("stations")
      .find(
        { id: { $in: ids }, active: true },
        { projection: { _id: 0, id: 1, name: 1 } },
      )
      .toArray();
    const rows = await db
      .collection("stationGeography")
      .find(
        { stationId: { $in: stations.map((s) => s.id) } },
        {
          projection: {
            _id: 0,
            stationId: 1,
            name: 1,
            lat: 1,
            lng: 1,
            source: 1,
          },
        },
      )
      .toArray();
    const points = ids.flatMap((id) => {
      const row = rows.find((p) => p.stationId === id);
      const parsed = pointSchema.safeParse(row);
      return parsed.success ? [parsed.data] : [];
    });
    return Response.json(
      { points },
      { headers: { "Cache-Control": "public, max-age=3600" } },
    );
  } catch {
    return Response.json(
      { error: "Station geography is temporarily unavailable." },
      { status: 503 },
    );
  }
}
