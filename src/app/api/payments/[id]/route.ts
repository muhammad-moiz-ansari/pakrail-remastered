import { sessionFor } from "@/server/auth";
import { database } from "@/server/db/mongodb";
import type { Attempt } from "@/server/payments";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const session = await sessionFor(request.headers);
    if (!session)
      return Response.json(
        { error: "Log in to view payment status." },
        { status: 401, headers },
      );
    const { id } = await params;
    const row = /^[a-f0-9]{64}$/.test(id)
      ? await (
          await database()
        )
          .collection<Attempt>("sandbox_payment_attempts_v1")
          .findOne({ _id: id, ownerId: session.user.id })
      : null;
    if (!row)
      return Response.json(
        { error: "Payment not found." },
        { status: 404, headers },
      );
    return Response.json(
      {
        state: row.state,
        expired: row.expiresAt.getTime() < Date.now(),
        bookingId: row.state === "succeeded" ? row.draftId : null,
      },
      { headers },
    );
  } catch {
    return Response.json(
      { error: "Status unavailable." },
      { status: 503, headers },
    );
  }
}
