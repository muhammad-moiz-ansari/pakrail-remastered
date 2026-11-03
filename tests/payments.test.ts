import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyWebhook, minorAmount, eventSchema } from "../src/server/safepay";
test("payment amount uses integer PKR minor units and rejects invalid totals", () => {
  assert.equal(minorAmount(123.45), 12345);
  for (const value of [NaN, -1, 0, Infinity])
    assert.throws(() => minorAmount(value));
});
test("webhook rejects bad, missing and modified signatures", () => {
  const body = JSON.stringify({ type: "payment.succeeded" });
  const signature = createHmac("sha512", "fixture-secret")
    .update(body)
    .digest("hex");
  assert.equal(verifyWebhook(body, signature, "fixture-secret"), true);
  assert.equal(verifyWebhook(body + " ", signature, "fixture-secret"), false);
  assert.equal(verifyWebhook(body, signature, "wrong-secret"), false);
  assert.equal(verifyWebhook(body, "", "fixture-secret"), false);
});
test("only documented versioned webhook envelope is accepted", () => {
  assert.equal(eventSchema.safeParse({ success: true }).success, false);
  assert.equal(
    eventSchema.safeParse({
      token: "evt_test",
      version: "2.0.0",
      merchant_api_key: "test",
      type: "payment.failed",
      data: { tracker: "track_test" },
    }).success,
    true,
  );
});

test("confirmation must match merchant, total, currency and order", async () => {
  const { paymentMatches } = await import("../src/server/safepay");
  const a = { merchant: "sandbox-merchant", amount: 10000, _id: "order" };
  const e = {
    merchant_api_key: a.merchant,
    data: { amount: a.amount, currency: "PKR", metadata: { order_id: a._id } },
  };
  assert.equal(paymentMatches(e, a), true);
  assert.equal(paymentMatches({ ...e, merchant_api_key: "other" }, a), false);
  for (const patch of [
    { amount: 1 },
    { currency: "USD" },
    { metadata: { order_id: "other" } },
  ])
    assert.equal(
      paymentMatches({ ...e, data: { ...e.data, ...patch } }, a),
      false,
    );
});

test("failure webhook accepts the provider's empty metadata while capture still requires order matching", () => {
  const parsed = eventSchema.safeParse({
    token: "evt_failure",
    version: "2.0.0",
    merchant_api_key: "sandbox",
    type: "payment.failed",
    data: { tracker: "track_failure", metadata: {} },
  });
  assert.equal(parsed.success, true);
});

test("checkout stays disabled while signed notifications remain verifiable", async () => {
  const { sandboxConfig } = await import("../src/server/safepay");
  const names = [
    "PAYMENT_MODE",
    "SAFEPAY_SANDBOX_ENABLED",
    "SAFEPAY_SANDBOX_PUBLIC_KEY",
    "SAFEPAY_SANDBOX_SECRET",
    "SAFEPAY_SANDBOX_WEBHOOK_SECRET",
  ];
  const saved = names.map((k) => process.env[k]);
  try {
    process.env.PAYMENT_MODE = "sandbox";
    process.env.SAFEPAY_SANDBOX_ENABLED = "false";
    process.env.SAFEPAY_SANDBOX_PUBLIC_KEY = "test-public";
    process.env.SAFEPAY_SANDBOX_SECRET = "test-server";
    process.env.SAFEPAY_SANDBOX_WEBHOOK_SECRET = "test-webhook";
    assert.throws(() => sandboxConfig());
    assert.equal(sandboxConfig(true).webhook, "test-webhook");
    process.env.PAYMENT_MODE = "live";
    assert.throws(() => sandboxConfig(true));
  } finally {
    names.forEach((k, i) => {
      if (saved[i] === undefined) delete process.env[k];
      else process.env[k] = saved[i];
    });
  }
});

test("failure metadata may be absent or null without allowing a successful unmatched capture", async () => {
  const { paymentMatches } = await import("../src/server/safepay");
  const data = { tracker: "track_failure", metadata: null };
  assert.equal(
    eventSchema.safeParse({
      token: "evt_failure",
      version: "2.0.0",
      merchant_api_key: "sandbox",
      type: "payment.failed",
      data,
    }).success,
    true,
  );
  assert.equal(
    paymentMatches(
      {
        merchant_api_key: "sandbox",
        data: { ...data, amount: 100, currency: "PKR" },
      },
      { merchant: "sandbox", amount: 100, _id: "order" },
    ),
    false,
  );
});
