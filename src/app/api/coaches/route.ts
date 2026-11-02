import { database } from "@/server/db/mongodb";
import { readCoachService } from "@/server/coach-store";
import { sampleCoachServices, serviceOffers } from "@/lib/coach-layouts";
import { validDate } from "@/lib/booking";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("service") ?? "",
    from = params.get("from") ?? "",
    to = params.get("to") ?? "",
    date = params.get("date") ?? "";
  const headers = { "Cache-Control": "no-store" };
  if (
    !/^sample-[0-3]$/.test(id) ||
    !/^[\w.-]{1,80}$/.test(from) ||
    !/^[\w.-]{1,80}$/.test(to) ||
    from === to ||
    !validDate(date)
  )
    return Response.json(
      { error: "Choose a valid service, segment and date." },
      { status: 400, headers },
    );
  try {
    const service = await readCoachService(await database(), id);
    if (!service)
      return Response.json(
        { error: "Coach configuration is not imported yet." },
        { status: 503, headers },
      );
    return Response.json(
      {
        source: "database",
        origin: "sample",
        offers: serviceOffers(service, from, to, date),
      },
      { headers },
    );
  } catch {
    // The offline sample is an explicit development boundary, never live inventory.
    const service = sampleCoachServices.find((s) => s.id === id)!;
    return Response.json(
      {
        source: "local-reference-fallback",
        origin: "sample",
        notice:
          "Database unavailable. Local reference layouts and existing sample fares are shown; no real reservation is made.",
        offers: serviceOffers(service, from, to, date),
      },
      { headers },
    );
  }
}
