import { receiveWebhook } from "@/server/payments";
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 65536) return new Response(null, { status: 413 });
    await receiveWebhook(raw, request.headers.get("x-sfpy-signature") ?? "");
    return Response.json({ received: true });
  } catch (error) {
    const code =
      error instanceof Error &&
      [
        "INVALID_SIGNATURE",
        "INVALID_EVENT",
        "WRONG_MERCHANT",
        "PAYMENT_MISMATCH",
      ].includes(error.message)
        ? error.message
        : "WEBHOOK_UNAVAILABLE";
    console.warn("Sandbox webhook rejected:", code);
    return Response.json(
      { error: "Webhook could not be accepted." },
      { status: 400 },
    );
  }
}
