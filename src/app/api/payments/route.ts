import { cookies } from "next/headers";
import { sessionFor, authOrigin } from "@/server/auth";
import { draftCookie } from "@/server/booking-drafts";
import { initiate } from "@/server/payments";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (request.headers.get("origin") !== authOrigin())
      return Response.json(
        { error: "Request not permitted." },
        { status: 403, headers },
      );
    const session = await sessionFor(request.headers);
    if (!session)
      return Response.json(
        { error: "Log in before payment." },
        { status: 401, headers },
      );
    return Response.json(
      await initiate(
        (await cookies()).get(draftCookie)?.value,
        session.user.id,
      ),
      { headers },
    );
  } catch {
    return Response.json(
      {
        error:
          "Sandbox checkout is unavailable or this attempt requires review. Your draft is saved; no payment success was recorded.",
      },
      { status: 503, headers },
    );
  }
}
