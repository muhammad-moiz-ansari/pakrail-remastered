import { stationQuery, PublicStation } from "../lib/station-search";
import { publicDatabaseError } from "./db/errors";

export async function stationResponse(
  request: Request,
  search: (
    q: string,
  ) => Promise<{ provider: "mongodb" | "demo"; stations: PublicStation[] }>,
) {
  let q: string;
  try {
    q = stationQuery(new URL(request.url).searchParams);
  } catch {
    return Response.json(
      {
        error:
          "Station query must be one value of at most 80 characters, without control characters.",
      },
      { status: 400 },
    );
  }
  try {
    return Response.json(await search(q), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const safe = publicDatabaseError(error);
    return Response.json(
      { error: safe.message, code: safe.code },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
