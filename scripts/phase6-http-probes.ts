import { loadEnvConfig } from "@next/env";
import { createHmac, randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { geographyResponse } from "../src/lib/journey-geography";
loadEnvConfig(process.cwd());
assert.notEqual(process.env.NODE_ENV, "production");
assert.ok(process.argv.includes("--run"), "Use --run for local QA only.");
const origin = process.env.BETTER_AUTH_URL!;
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
async function main() {
  const guest = await fetch(origin + "/api/payments", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(guest.status, 401);
  const body = JSON.stringify({
    token: "evt_phase6_local_probe_" + randomUUID(),
    version: "2.0.0",
    merchant_api_key: process.env.SAFEPAY_SANDBOX_PUBLIC_KEY,
    type: "payment.succeeded",
    data: { tracker: "track_phase6_local_probe_" + randomUUID() },
  });
  const bad = await fetch(origin + "/api/payments/webhook", {
    method: "POST",
    body,
  });
  assert.equal(bad.status, 400);
  const signature = createHmac(
    "sha512",
    process.env.SAFEPAY_SANDBOX_WEBHOOK_SECRET!,
  )
    .update(body)
    .digest("hex");
  const accepted = await fetch(origin + "/api/payments/webhook", {
    method: "POST",
    headers: { "x-sfpy-signature": signature },
    body,
  });
  assert.equal(accepted.status, 200);
  for (const [from, to, expected] of [
    ["LHE", "KHI", ["LHE", "KHI"]],
    ["KHI", "LHE", ["KHI", "LHE"]],
    ["unknown-phase6", "LHE", ["LHE"]],
  ] as const) {
    const response = await fetch(
      `${origin}/api/journey-geography?from=${from}&to=${to}`,
    );
    assert.equal(response.status, 200);
    const { points } = geographyResponse.parse(await response.json());
    assert.deepEqual(
      points.map((point) => point.stationId),
      expected,
    );
  }
  console.log(
    JSON.stringify({
      guestPaymentSession: guest.status,
      invalidWebhook: bad.status,
      locallySignedUnknownTrackerWithoutCookie: accepted.status,
      providerPayment: false,
      mapEndpointOrderingAndPartialGeography: "passed",
    }),
  );
}
main().catch(() => {
  console.error("Phase 6 HTTP probe failed.");
  process.exitCode = 1;
});
