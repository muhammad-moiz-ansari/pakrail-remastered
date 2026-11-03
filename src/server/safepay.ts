import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
export function sandboxConfig(forWebhook = false) {
  if (
    process.env.PAYMENT_MODE !== "sandbox" ||
    (!forWebhook && process.env.SAFEPAY_SANDBOX_ENABLED !== "true")
  )
    throw Error("Sandbox checkout is not configured.");
  const key = process.env.SAFEPAY_SANDBOX_PUBLIC_KEY,
    secret = process.env.SAFEPAY_SANDBOX_SECRET,
    webhook = process.env.SAFEPAY_SANDBOX_WEBHOOK_SECRET;
  if (
    !key ||
    !secret ||
    !webhook ||
    [key, secret, webhook].some((v) => /[<>]/.test(v))
  )
    throw Error("Sandbox credentials are missing.");
  return { key, secret, webhook };
}
export function minorAmount(total: number) {
  const amount = total * 100;
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw Error("Invalid PKR amount.");
  return amount;
}
export function verifyWebhook(raw: string, signature: string, secret: string) {
  if (!/^[a-f0-9]{128}$/.test(signature)) return false;
  const expected = createHmac("sha512", secret)
    .update(Buffer.from(raw))
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export const eventSchema = z.object({
  token: z.string().startsWith("evt_"),
  version: z.literal("2.0.0"),
  merchant_api_key: z.string(),
  type: z.string(),
  data: z.object({
    tracker: z.string().startsWith("track_"),
    amount: z.number().int().optional(),
    currency: z.string().optional(),
    metadata: z.object({ order_id: z.string().optional() }).nullish(),
  }),
});
export async function createTracker(amount: number, orderId: string) {
  const c = sandboxConfig();
  const response = await fetch(
    "https://sandbox.api.getsafepay.com/order/payments/v3/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SFPY-MERCHANT-SECRET": c.secret,
      },
      body: JSON.stringify({
        merchant_api_key: c.key,
        intent: "CYBERSOURCE",
        mode: "payment",
        entry_mode: "flex",
        amount,
        currency: "PKR",
        metadata: { order_id: orderId, source: "pakrail-remastered" },
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw Error(
      "Provider session could not be confirmed. Review before retrying.",
    );
  const parsed = z
    .object({
      data: z.object({
        tracker: z.object({ token: z.string().startsWith("track_") }),
      }),
    })
    .parse(await response.json());
  return parsed.data.tracker.token;
}
export function checkoutUrl(tracker: string, id: string, origin: string) {
  const url = new URL("https://sandbox.api.getsafepay.com/checkout/pay");
  url.search = new URLSearchParams({
    beacon: tracker,
    env: "sandbox",
    order_id: id,
    source: "pakrail-remastered",
    webhooks: "true",
    redirect_url: `${origin}/payment-return?attempt=${id}`,
    cancel_url: `${origin}/payment-return?attempt=${id}&cancelled=1`,
  }).toString();
  return url.toString();
}

export function paymentMatches(
  event: {
    merchant_api_key: string;
    data: {
      amount?: number;
      currency?: string;
      metadata?: { order_id?: string } | null;
    };
  },
  attempt: { merchant: string; amount: number; _id: string },
) {
  return (
    event.merchant_api_key === attempt.merchant &&
    event.data.amount === attempt.amount &&
    event.data.currency === "PKR" &&
    event.data.metadata?.order_id === attempt._id
  );
}
