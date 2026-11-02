# Incremental railway catalogue backend

Implemented in the existing Next.js 16.4.3 / React 19 app with MongoDB's official Node.js driver (7.x), Zod runtime validation and local TypeScript CLI tools. There are no public write/admin/import endpoints. The existing UI, calendar, genders, seats and test payment remain in place.

## Atlas and environment

1. Create an Atlas project and deployment manually. Create a database user scoped to this database and allow the app/server's actual outbound IP in Atlas Network Access. Do not disable TLS or broadly allow all IPs as a workaround.
2. Keep the app's runtime account read-only for catalogue collections. Use a separately managed write-capable account when running imports/index setup locally. Never commit either connection string.
3. Copy `.env.example` to `.env.local` **only if `.env.local` does not already exist**. Fill `MONGODB_URI` and `MONGODB_DB` locally. Both are server-only; never prefix secrets with `NEXT_PUBLIC_`. All actual `.env*` files are ignored. The existing `.env.local` was preserved.
4. `STATION_DATA_PROVIDER=mongodb` is the default. `STATION_DATA_PROVIDER=demo` explicitly enables labelled in-memory fixtures; a database failure never switches to them.

```powershell
npm ci
npm run db:check
```

The check is a read-only ping. It does not create catalogue records or indexes. A live Atlas ping and database-aware station dry-run succeeded on 2026-11-02. After user approval on 2026-11-02, catalogue indexes were initialized and all six station records were applied. The post-import dry-run reports 6 unchanged, 0 inserts, 0 updates and 0 rejects. Live `/api/stations` checks found each of the six records with provider `mongodb` and minimal public fields. See `approved-station-import.txt`, `approved-station-postcheck.txt` and `live-station-api-check.txt`; `first-station-dry-run.txt` preserves the original review.

Connection setup is lazy: no database is required during `next build`. `src/server/db/mongodb.ts` caches one client pool globally across development reloads, resets failed connections, bounds connection/query waits and sanitizes configuration/connection errors. `src/server/stations.ts` is guarded by `server-only`. Database routes declare the Node.js runtime. CLI modules share the connection core without importing the Next-only guard. Do not import `src/server/**` into client components.

## Collections and identity

Every record has an immutable, stable internal `id`, independent of MongoDB `_id` or an unconfirmed official code. Never recycle IDs. The six first-review IDs (`LHE`, `RWP`, `KHI`, `ISB`, `MUX`, `FSD`) retain the existing prototype's **internal identifiers** to preserve drafts and editorial destination links; they are **not asserted official railway station codes**.

| Collection | Required identity/references and optional facts |
| --- | --- |
| `stations` | `id`, `name`, provenance; optional `officialCode`, `city`, `aliases`, nullable `active` |
| `trains` | `id`, `name`, provenance; optional official number, direction, service variant, nullable active |
| `travelClasses` | `id`, `name`, provenance; optional code and verified description; no invented rank/amenity mapping |
| `routes` | `id`, `trainId`, `variant`, ordered `stops`; each stop has station ID and sequence; arrival/departure local `HH:mm` and separate nullable day offsets are optional |
| `schedules` | `id`, `routeId`, provenance; optional effective period, weekdays (ISO Monday=1…Sunday=7), per-date exceptions and their source metadata |
| `fares` | `id`, `routeId`, origin, destination, class, `currency: PKR`, provenance; optional matching train ID, passenger category, integer `amountMinor` (paisa), effective period |

`active` on stations is a **local search visibility flag**, not live operational availability. Unknown city, times, day offsets, weekday patterns, fares and status can be omitted or null where supported. `amountMinor: 0` means zero, not unknown. Do not populate amounts until train/route, exact ordered station pair, class, category and effective applicability are known. Routes with repeated stations/loops are deliberately rejected in this first version; review the route model before adding such services.

Provenance is required: source URL (nullable when there is no source), optional title, retrieval timestamp, nullable verification timestamp, `verificationStatus` (`unverified`, `verified`, `stale`), `dataOrigin` (`official-public`, `manually-entered`, `demo`) and optional notes. Creation/update timestamps are assigned on apply. A verified fact requires a source URL, verification date and non-demo origin. `fieldSources` supports different sources for individual facts; route stops and schedule exceptions can also carry their own provenance. Date-only research timestamps in the first dataset use midnight Asia/Karachi explicitly; they do not assert an exact time of observation.

Unique indexes enforce stable IDs, optional station/class codes (partial string indexes prevent missing-code collisions), train number/direction/service variant, route train/variant, schedule route/effective period and scoped fare identity. Lookup indexes cover station visibility/name/aliases, train name and route stops. Import validation additionally rejects duplicate stop stations/sequences, reversed known times/periods, inconsistent fare train/route and invalid references. Indexes do not imply timetable completeness or live availability.

## Review, indexes and gradual import

Templates for **all six collections**, in JSON and CSV, are in `data/catalogue/templates/`. They are examples requiring replacement and source review, not imported facts. JSON is an array. CSV structured columns (`provenance`, `fieldSources`, `aliases`, `stops`, `operatingWeekdays`, `exceptions`, `active`, `amountMinor`) contain JSON values escaped according to CSV rules. Empty CSV fields are omitted. Files are capped at 5 MB / 5000 rows.

Dependency order: **stations / travelClasses / trains → routes → schedules and fares**. Dependencies must already exist in the same catalogue domain before importing dependent files. Dry-runs do not stage cross-file dependencies.

Run from the repository root. Direct Node commands below avoid npm-wrapper differences in forwarding `--apply` and `--offline` flags:

```powershell
# Offline validation: no DB reads or writes, references to existing data unavailable
node --import tsx scripts/catalogue.ts import stations data/catalogue/review/stations.public-review.json --offline

# Database-aware dry-run (default): reads only, shows proposed records/counts/errors
node --import tsx scripts/catalogue.ts import stations data/catalogue/review/stations.public-review.json

# Explicit index initialization; inspect/reconcile existing duplicates if it fails
node --import tsx scripts/catalogue.ts indexes --apply

# ONLY AFTER approving the proposed six station records
node --import tsx scripts/catalogue.ts import stations data/catalogue/review/stations.public-review.json --apply

npm run dev
```

Package aliases `npm run db:indexes` and `npm run catalogue:import` are also implemented; without `--apply`, both are dry-runs. Use the direct commands above when passing flags in PowerShell.

Imports validate all rows before writing anything. They show proposed inserted/updated/unchanged/rejected counts and row errors. Any rejected row blocks the whole apply phase. DB-aware dry-runs check references and unique identities against existing records. Offline counts cannot establish live idempotency/conflicts. Apply requires the explicit stable-ID index. Record insert/update decisions are stable-ID upserts; unchanged facts are not rewritten or re-timestamped. Blank strings, nulls and empty arrays do not erase existing facts; zero/false remain meaningful. Update checks the previous `updatedAt` to detect concurrent edits. Do not run concurrent importers. Apply is not an all-file transaction: a database failure can leave a validated subset written; dry-run again and repeat safely. Removals/explicit clearing require a separately reviewed maintenance operation, not blank import cells.

Conflicting natural identities are rejected, not guessed/merged under another ID. Imports cannot downgrade verified records to unverified, and changed verified facts require explicitly supplied source metadata rather than inheriting an older verification. If sources disagree, stop, document the disagreement, and reconcile it before applying; do not silently label a guess verified. Use per-field provenance and `stale` when a previously checked fact needs review. This importer is not an authoritative source-reconciliation engine.

Demo records require `--demo` and go to `demo_stations`, `demo_trains`, etc. Initialize their indexes separately with `indexes --demo --apply`. The API's explicit demo provider uses existing in-memory fixtures, never those collections or public records. No demo seed has been applied to Atlas.

## Station API and UI

`GET /api/stations?q=...` accepts a single optional query of at most 80 characters, escapes regex metacharacters and rejects control characters. It returns up to 12 active catalogue stations matched by name, alias, city or official code, sorted by name/ID. Responses expose only `id`, `name`, optional `city`/`code` and the provider label. Internal source notes, Mongo `_id`, connection details and credentials are excluded. Database/query failures return a sanitized HTTP 503, never fixture results. Empty results are distinct from errors. Regex lookup is bounded by result count and execution time; very large catalogues will need a dedicated search index/normalized prefix fields and deployment-level rate limiting.

Both shared station selectors debounce by 250ms, abort previous requests and guard response order. They retain keyboard selection, show loading/no matches/error/Retry and label explicit demo data. Selected IDs remain in `search.from` / `search.to`; a small name snapshot in existing session draft state preserves labels across reload, swap, edit and downstream summaries. It is **not server-side booking authorization**. No gender, contact or passenger details are sent to the station endpoint or imported. The static informational station directory and editorial destination shortcuts remain prototype content; they are not a new database-backed directory.

## Boundary to future real bookings

Only station lookup is database-backed. Current train results, prices, classes/amenities, seat availability/recommendations, vouchers and payment completion are simulations and labelled accordingly. A catalogue timetable is not live status. No booking documents or passenger/payment/account data have been inserted into Atlas.

Before production booking work, design date-specific train runs and coach inventory, atomic seat holds with expiry, unique allocations and double-booking protection, authenticated booking ownership, server-authoritative prices, verified payment webhooks with idempotency, and confirmed ticket issuance. Do not treat inserting a booking document or a successful test payment as a railway reservation.

## Checks and next steps

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`. Focused catalogue tests cover file validation, idempotent plans, blank preservation, duplicate identities, reference checks, query escaping/limits, source separation and sanitized errors. The live connection ping is separate from fixture-based importer tests. First review/approve the six names, initialize indexes and apply only that file, then check station search. Add verified classes/trains/routes gradually after source review; bulk train/schedule/fare import has not been performed.
