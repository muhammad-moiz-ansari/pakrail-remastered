# Phase 3 — sandbox payment integration (3 November 2026)

## Status

Implemented the sandbox integration code and development fixtures. **End-to-end provider verification is blocked; Phase 3 is not fully verified.** No gateway credentials are configured, no Safepay transaction was created, no provider callback was received, no live mode was enabled, and no new gateway-paid booking is claimed.

## Changes

- `/api/payments`: authenticated, same-Origin hosted-checkout initiation. Reads only the owned server draft, revalidates current sample fares/places and the existing deadline, calculates integer PKR minor units, and inserts a durable `sandbox_payment_attempts_v1` record before calling the provider.
- Direct HTTPS call to Safepay `/order/payments/v3/` with merchant server authentication, payment/flex/CYBERSOURCE configuration and non-personal order metadata. Hosted URL is restricted to the Safepay sandbox host. Requests time out after 15 seconds. No customer PAN/CVV is collected or stored.
- A deterministic identity pins an attempt to draft, snapshot, amount and hold deadline. Repeated initiation reuses a pending tracker; ambiguous provider timeouts/errors become `review_required`, without automatically opening another potentially conflicting transaction. Failed attempts currently require review rather than an automatic new tracker; merchant-specific retry behavior remains to be verified.
- Pending payment attempts prevent draft mutation until their hold deadline. Login does not extend it. Existing customer bookings/print behavior are retained; the old `complete-simulation` client action is removed so it cannot bypass provider confirmation.
- `/api/payments/webhook` does not require a shopper login. Verifies HMAC-SHA512 against the raw body with constant-time comparison, validates the documented version 2.0.0 envelope, sandbox merchant, mapped tracker and (for capture success) integer amount, PKR currency and order reference. Only minimal verified event facts are retained in `sandbox_payment_events_v1`; raw passenger/card payloads are not saved.
- Capture success finalizes the account booking using the existing draft/inventory checks. Replayed successes retain the completed booking; failures do not downgrade a succeeded attempt. Confirmation arriving after the original deadline goes to `review_required`; it does not reclaim reassigned seats or claim a refund. Inventory/storage failures require review. This is still project/sample inventory, not official railway reservation issuance.
- `/payment-return` reads private `/api/payments/[id]` status, enforces account ownership there, and polls at most 20 times. Returning/cancelling is UI navigation only, never payment proof. Unknown status is not reported as success/failure. A provider cancellation remains pending until authoritative confirmation or review; a browser query cannot cancel a potentially paid attempt.
- Three official public dummy test records were **actually imported** into `sandbox_payment_test_cases_v1`: two frictionless successes and one authentication failure. First run inserted 3; repeat inserted 0 / unchanged 3. No CVV or billing identity was stored. No public fixture endpoint exists.

## Setup and remaining contract validation

Ignored server environment needs:

```
PAYMENT_MODE=sandbox
SAFEPAY_SANDBOX_ENABLED=true
SAFEPAY_SANDBOX_PUBLIC_KEY=<sandbox merchant public key>
SAFEPAY_SANDBOX_SECRET=<sandbox merchant server secret>
SAFEPAY_SANDBOX_WEBHOOK_SECRET=<sandbox endpoint secret>
BETTER_AUTH_URL=<exact application origin>
```

Defaults remain disabled. Use only actual sandbox credentials. Configure a reachable authorized HTTPS endpoint at `<origin>/api/payments/webhook` in the sandbox merchant dashboard, subscribed to payment capture success/failure. No tunnel, public exposure or merchant account was created automatically.

**Important unresolved compatibility check:** the official API documents v3 tracker setup, while the official Node SDK's checkout URL builder and initialization use an older API. The current code uses v3 tracker setup with the documented hosted checkout URL convention. This pairing, response shape, capture amount units and merchant checkout configuration must be confirmed with actual sandbox credentials before enabling use. It is not presented as tested compatibility.

Webhook documentation also differs across generations: the old Node SDK signs JSON of `body.data`, current card documentation describes the raw envelope, and Raast uses a different timestamped scheme. This implementation targets the current card v2.0.0 envelope/raw HMAC-SHA512 contract; it does not accept multiple algorithms as a fallback. Confirm the actual sandbox delivery bytes/version before enabling. If it differs, reject and update against that provider contract; never mark paid speculatively.

The old SDK was inspected but **removed** after its transitive axios dependency brought in unpatched high-severity advisories. No new runtime dependency is retained.

Development fixture command (refuses production, live-looking database names and missing explicit development acknowledgement):

```
$env:PAYMENT_MODE='sandbox'
node --import tsx scripts/payment-fixtures.ts --development-database
```

Use published dummy instruments manually on Safepay's sandbox page only. The current official testing reference allows a future expiry and an arbitrary test CVV; those instructions are not persisted as customer card data. Never use a real card. A fixture does not authorize payment.

## Verification and limits

- Full suite: 102 tests passed, with four payment tests including minor units, altered/missing/wrong signatures, versioned envelopes and wrong merchant/amount/currency/order. TypeScript and production build passed. Lint and formatting passed. All 13 updated account/draft HTTP regression check groups passed; two QA users/drafts were created and zero completed bookings were created.
- Actual fixture database import and repeatability were checked as above. No customer collection was reset or historical record migrated.
- No authentic provider success, authentication failure, cancellation, delayed/duplicate webhook, late payment, refund or merchant dashboard reconciliation was tested. Unit-generated signatures are tests, not provider deliveries.
- The pending-return UI, disabled/missing-configuration behavior and code paths are implemented, but an entire browser checkout cannot be verified until credentials/callback access and the hosted-flow contract are resolved.
- Provider-attempt reconciliation and multi-document inventory finalization still need fault-injection/concurrency verification on the configured MongoDB topology. The existing per-draft lock protects ordinary concurrent actions; it is not claimed to supply database-wide transactions. Do not enable this integration for production or real charges.

## Sources consulted

- https://apidocs.getsafepay.com/ — rendered browser plus indexed official payment/testing reference; v3 setup, minor units and dummy instruments.
- https://github.com/getsafepay/safepay-node — official SDK and installed 3.0.2 source inspected, then removed.
- https://safepay-docs.netlify.app/developers/webhooks/webhook-types/ — documented v2.0.0 payment envelope and capture/failure meanings.
- https://safepay-docs.netlify.app/developers/webhooks/verify-hmac-signatures/ — current card signature guidance.
- https://safepay.helpscoutdocs.com/article/82-testing-the-latest-safepay-checkout-integration — sandbox/3DS testing.
- https://safepay.helpscoutdocs.com/article/173-asp-net-integration-guide — hosted checkout flow concepts only; no framework-specific code copied.

Gallery, geographical map and other unrelated phases were not started.

## Webhook connection setup — 3 November 2026

The user supplied the sandbox public/server keys locally. At their request, a temporary Cloudflare Quick Tunnel was created to a restricted Node relay (`scripts/webhook-relay.mjs`), not to the Next.js port directly. The official cloudflared 2026.10.7 binary was downloaded into ignored `.local/bin` and its SHA-256 checked against the official GitHub release asset digest.

The relay listens only on 127.0.0.1:8791 and accepts only JSON POST `/api/payments/webhook`, up to 64 KiB. It forwards the exact body and signature to the fixed local app handler at 127.0.0.1:3000. It never forwards browser cookies or exposes account/auth/site routes. Public GET `/` and `/account` returned 404; an unsigned public webhook POST returned 400. The current temporary URL is recorded in ignored `.local/webhook-connection.json`.

Safepay sandbox account webhooks were enabled through its dashboard. The endpoint was created and its saved subscriptions verified as `payment.succeeded` and `payment.failed`, version 2.0.0. The shared secret is still to be copied by the user into ignored `.env.local`; sandbox checkout should stay disabled until signature/contract tests complete. No provider payment or valid signed provider delivery is claimed yet.

The app, relay and cloudflared processes must all stay running for delivery. Stopping cloudflared disables the public connection; restarting a Quick Tunnel produces a different hostname, which must be updated in the sandbox endpoint. For manual restarts from the project directory:

```
npm run dev
node scripts/webhook-relay.mjs
.local/bin/cloudflared.exe tunnel --url http://127.0.0.1:8791 --no-autoupdate
```

Run these in separate terminals. Do not tunnel port 3000 directly. This temporary development setup is not production hosting or a permanent webhook address.

## Signed provider delivery verification — 3 November 2026

The user saved the sandbox webhook secret in ignored `.env.local`. Configuration presence was checked without displaying any credential. `SAFEPAY_SANDBOX_ENABLED` remains false.

Genuine dashboard-generated version 2.0.0 notifications were requested through the logged-in Safepay sandbox dashboard and received via the public webhook-only tunnel:

- `payment.succeeded`: signature verified and merchant matched, recorded 2026-11-03 14:51:51 UTC (19:51:51 Pakistan time).
- `payment.failed`: signature verified and merchant matched, recorded 2026-11-03 14:58:30 UTC (19:58:30 Pakistan time).

These are provider test notifications, not actual card transactions or evidence of checkout/capture completion. Unknown trackers are acknowledged and minimally recorded without finalizing any booking. The local `sandbox_webhook_receipts_v1` records contain only event identity, type, time and merchant-match boolean. Neither secrets nor raw customer/card payloads are stored there.

Two fixes were needed during verification:

1. Receiving signed notifications is independent of the checkout-start enable flag. Existing notifications must remain verifiable while new checkouts are disabled. Sandbox-only mode and credential validation still apply.
2. The real provider failure test contained null metadata. Failure metadata may now be absent, empty or null; successful capture still requires the stored order reference, merchant, amount and currency to match.

Verified but schema-rejected payloads produce only a hash/time/field-path diagnostic in `sandbox_webhook_rejections_v1`; no raw payload is retained. Webhook rejection logs contain a bounded diagnostic code rather than exception data or secrets.

Seven targeted payment tests pass, including regression coverage for the disabled-checkout/active-webhook separation and null failure metadata. This resolves the webhook setup/signature-delivery blocker. Hosted checkout compatibility and authentic sandbox card transactions remain unverified; no live mode or new paid booking was enabled by this verification.
