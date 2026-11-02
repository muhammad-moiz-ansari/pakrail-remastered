import { sessionFor } from "@/server/auth";
import { draftStore, draftView } from "@/server/booking-drafts";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const session = await sessionFor(request.headers);
    if (!session)
      return Response.json(
        { error: "Log in to view this booking." },
        { status: 401, headers },
      );
    const { id } = await params;
    const row = /^[a-f0-9-]{36}$/.test(id)
      ? await (await draftStore()).owned(id, session.user.id)
      : null;
    if (!row)
      return Response.json(
        { error: "Booking not found." },
        { status: 404, headers },
      );
    return Response.json(draftView(row), { headers });
  } catch {
    return Response.json(
      { error: "Booking service unavailable." },
      { status: 503, headers },
    );
  }
}
