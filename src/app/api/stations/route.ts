import { findStations } from "@/server/stations";
import { stationResponse } from "@/server/station-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return stationResponse(request, findStations);
}
