# Phase 2 — accounts and mandatory pre-payment login

Implemented 3 November 2026. Phases 0–1, the latest banner-removal instruction, existing classes/layouts, passenger genders, calendars, Careers/Our people and homepage content are preserved. No Phase 3–6 feature implementation is included.

## Account foundation and routes

- Stable `better-auth@1.7.15` plus matching `@better-auth/mongo-adapter@1.7.15`, compatible with installed Next.js 16 / React 19 / MongoDB 7. Native MongoDB connection reused; standalone-compatible adapter configuration, without pretending MongoDB multi-document transactions exist.
- Better Auth handles password hashing/checking, email normalization, session cookies, revocation, expiration, CSRF/origin checks, verification and one-time password resets. No homegrown password/JWT/session implementation or public admin role.
- `/login`, `/signup`, `/forgot-password`, `/reset-password`; persistent labels, confirmation, password visibility toggle, autocomplete, accessible errors and busy states. Normal 8–128 character library policy; no paste restriction.
- Header and mobile navigation expose Log in/Create account or My account/Log out. `/account` lists the latest 100 owned completed simulations; `/account/bookings/[id]` and `/api/account/bookings/[id]` authorize the session and account ID server-side. Wrong-owner IDs return not found; guests cannot query tickets. Existing ticket-only print portal is reused.
- Seven-day library sessions with daily refresh and no cookie cache. Secure cookies under configured HTTPS, HttpOnly and SameSite=Lax. Logout and reset revoke sessions. Only allowlisted internal return destinations are accepted by UI navigation. Auth responses are private/no-store.
- Persistent database rate limiting is enabled in development as well: sign-in/sign-up at most five requests per minute, password recovery three per minute. Configure deployment ingress to overwrite forwarded IP headers; this local configuration is not a claim of deployed abuse protection.

## Draft ownership and checkout

- `/api/booking-draft` stores versioned authoritative drafts in `booking_drafts_v1`; all mutations require the configured same Origin and JSON. A random 256-bit HttpOnly cookie capability scopes anonymous drafts. Only its SHA-256 hash is stored. A bare draft ID, submitted owner ID or matching email cannot grant access.
- Public train/class/passenger/seat pages remain available without login. Browser edits still persist locally; debounced server saves retain useful progress. An unavailable backend does not disable browsing, but payment fails closed with the local draft retained.
- Explicit checkout saves the latest snapshot and acquires a ten-minute sample place hold before login. Auth navigation also saves available work. Claiming is a conditional atomic/idempotent owner transition on only the current capability-authorized draft. Once owned, the capability alone is insufficient: reads/writes/checkout require the matching account.
- Login/signup preserves station names/IDs, dates, both legs, trains, class/offer, passengers/gender, assignments and voucher. No automatic passenger substitution with account data, email-based historical imports or account ownership changes.
- `checkout-policy.ts` validates restored models, current canonical sample train configuration, current class/layout offers, exact numbered place metadata, passenger details and totals. Client-paid submissions are rejected.
- `demo_seat_holds_v1` uses unique physical-place/coach/service/date/exact-segment keys. Acquisition is conditional on a free/expired or same-draft hold; conflicting drafts cannot reserve those same sample places. A short per-draft update lock serializes changes. Editing the selected inventory releases that draft's previous held places; login/claim never extends the deadline.
- Expired holds preserve draft details and require the explicit **Check my places again** action. Renewal checks availability of the existing choices, without choosing replacements silently. Conflicts send the traveller back to seats.
- `/booking/payment` checks session, owned draft, hold and current validity on the server. Its component uses that server snapshot. Client payment UI rechecks on focus/interval; the completion endpoint independently rechecks session, ownership and hold. Removing the frontend navigation gate cannot bypass authorization.
- The retained **simulation** completes through the authenticated server action and stores an immutable account-owned snapshot/reference. Retries reuse a completed result. It makes no provider transaction and charges no money. Phase 3 must replace this explicit simulation with signed provider confirmation and durable provider-attempt/reconciliation logic. Sample hold keys are not real railway inventory or overlapping-segment track occupancy.
- New server-completed snapshots carry `accountBookingId`; local confirmation redirects to the authorized account ticket page. Old browser-only guest summaries retain their previous scope/labels and are not adopted as authenticated server bookings. Searching or explicitly starting over creates a separate draft capability and does not overwrite the previous account's records.

## Non-destructive database changes

Idempotent unique/query indexes and independent collections:

- `auth_user`: normalized email uniqueness.
- `auth_account`: provider/account identity uniqueness; library password hashes.
- `auth_session`: unique library token and user lookup.
- `auth_verification`: library verification/recovery records.
- `auth_rateLimit`: unique limiter key.
- `booking_drafts_v1`: unique token hash and account/completion lookup.
- `demo_seat_holds_v1`: unique `_id` inventory identity and draft lookup.

No existing collection was dropped/reset, no historical booking was migrated, and no public catalogue records were replaced. Actual checks created five uniquely labelled QA users (two API runs plus one browser signup) and two completed sample bookings. QA records remain in the development database; generated passwords were neither hardcoded nor reported. No real card/payment data was collected.

## Configuration and development mail

`.env.example` contains placeholders. Ignored `.env.local` was given a generated high-entropy auth secret only if absent, exact `BETTER_AUTH_URL=http://127.0.0.1:3000` if absent, and development mail mode if absent. Existing database credentials were preserved. Use the configured hostname consistently; localhost and 127.0.0.1 are different origins.

- `BETTER_AUTH_SECRET`: random 32+ characters; keep server-only and stable across restarts. Rotate deliberately, not every build.
- `BETTER_AUTH_URL`: exact application origin, HTTPS for deployment.
- `AUTH_MAIL_MODE=local`: enabled only outside production. Verification/recovery callbacks write private ignored `.local/auth-mail/*.json` files. They are never exposed by an application endpoint or printed in normal server logs.
- `npm run auth:mail -- --latest` deliberately reads the private development message through local CLI tooling. These links are bearer secrets; do not publish the output. Clear expired local mail according to your local development policy.
- Recovery/verification through this sink was exercised. No email is sent externally. Production mail is not configured: recovery UI reports the limitation; external delivery, production ingress/cookie behavior and deployment lifecycle still require configuration/testing. Verification is optional for email/password login; accounts accurately show verification status.

## Verification performed

- 98 unit/model tests passed, including six new cases for safe redirects, owner checks, hold expiry, forged prices, stripping client owner claims/rejecting paid drafts, and exact inventory identity.
- `node --import tsx scripts/check-accounts.ts --run` (or `npm run accounts:check`) passed 13 grouped checks through the actual local HTTP endpoints and configured MongoDB: public pre-payment access; anonymous payment rejection; draft persistence/claim; competing holds; signup/normalization/duplicate email; logout/revoked cookie; wrong/correct password; cross-account claim/checkout/completion/ticket queries; unchanged login deadline; expired-hold recovery; idempotent simulation and totals; actual library verification and one-time password reset via local sink; expired sessions; hostile Origin rejection.
- The CLI is explicitly development-only, requires localhost origin and creates QA records; it is not part of the default test suite and does not contact a payment/email provider.
- Separate invalid-login test: statuses 401, 401, 401, 401, 401, then 429.
- Browser: mobile signup at 375 × 812 fit without horizontal overflow (286px-wide, 48px-high fields); mismatched passwords produced inline alert; visibility toggle worked. Browser signup reached My bookings, session survived reload, and logout returned the protected page to login. Desktop account/header also inspected without horizontal overflow. No touch hardware was used and no full visual round-trip booking was repeated; API tests exercised the return-trip draft/ownership path.
- Production build passed (including dynamic protected routes), TypeScript passed, ESLint passed, Prettier passed, production dependency audit reported zero advisories. Existing 92 tests stayed green. No deployment, live charge or external email test claimed.

## Sources consulted

Current official docs, matched against installed 1.7.15 package source/types:

- https://better-auth.com/docs/installation
- https://better-auth.com/docs/adapters/mongo
- https://better-auth.com/docs/authentication/email-password
- https://better-auth.com/docs/integrations/next
- https://better-auth.com/docs/concepts/session-management
- https://better-auth.com/docs/concepts/rate-limit
- https://better-auth.com/docs/concepts/email

Installed Next.js guides for authentication, cookies, headers and Route Handlers were consulted. The current handoff's Phase 2 access timing takes precedence: no login gate before payment.
