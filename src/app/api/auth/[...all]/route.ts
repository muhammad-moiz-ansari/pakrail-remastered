import { getAuth } from "@/server/auth";
export const runtime = "nodejs";
async function handler(request: Request) {
  try {
    const response = await (await getAuth()).handler(request);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return Response.json(
      { message: "Account service is unavailable. Please try again later." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export const GET = handler;
export const POST = handler;
