import { cookies } from "next/headers";
import { draftStore, draftCookie, draftView } from "@/server/booking-drafts";
import { sessionFor, authOrigin } from "@/server/auth";
import { CheckoutError } from "@/lib/checkout-policy";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
function failure(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof CheckoutError
          ? error.message
          : "Your saved booking service is unavailable. Your browser draft is retained.",
      code: error instanceof CheckoutError ? error.code : "SERVICE_UNAVAILABLE",
    },
    { status: error instanceof CheckoutError ? error.status : 503, headers },
  );
}
export async function GET(request: Request) {
  try {
    const session = await sessionFor(request.headers),
      token = (await cookies()).get(draftCookie)?.value;
    const row = await (await draftStore()).current(token, session?.user.id);
    return Response.json(row ? draftView(row) : null, { headers });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    if (
      request.headers.get("origin") !== authOrigin() ||
      !request.headers.get("content-type")?.startsWith("application/json")
    )
      throw new CheckoutError("ORIGIN", "This request is not permitted.", 403);
    const raw = await request.text();
    if (raw.length > 96000)
      throw new CheckoutError("SIZE", "Booking data is too large.", 413);
    const body = JSON.parse(raw),
      session = await sessionFor(request.headers),
      store = await draftStore(),
      jar = await cookies();
    const token = jar.get(draftCookie)?.value;
    if (body.action === "detach") {
      jar.delete(draftCookie);
      return Response.json(null, { headers });
    }
    if (body.action === "save") {
      const { row, token: next } = await store.save(
        body.snapshot,
        token,
        session?.user.id,
      );
      jar.set(draftCookie, next, {
        httpOnly: true,
        secure: authOrigin().startsWith("https:"),
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return Response.json(draftView(row), { headers });
    }
    if (body.action === "prepare")
      return Response.json(
        draftView(
          await store.prepare(token, session?.user.id, body.renew === true),
        ),
        { headers },
      );
    if (!session)
      throw new CheckoutError(
        "LOGIN_REQUIRED",
        "Log in to continue to payment.",
        401,
      );
    if (body.action === "claim") {
      const row = await store.claim(token, session.user.id);
      return Response.json(row ? draftView(row) : null, { headers });
    }
    if (body.action === "checkout")
      return Response.json(
        draftView(await store.checkout(token, session.user.id)),
        { headers },
      );
    if (body.action === "complete-simulation")
      return Response.json(
        draftView(await store.completeSimulation(token, session.user.id)),
        { headers },
      );
    throw new CheckoutError("ACTION", "Choose a valid booking action.", 400);
  } catch (e) {
    return failure(e);
  }
}
