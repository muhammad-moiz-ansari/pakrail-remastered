# Phase 5: Journey route mini-map



Inspected the supplied `references/7. mini map.png` locally: ticket cards with a compact side map, station labels, route connector and zoom controls. Replaced the existing train-results RoutePreview placeholder in that same sidebar. No reference files were changed. No Phase 6 or deferred checkout test was performed.



Leaflet 1.9.4 stable (not 2.0 beta), browser-only dynamic import, Next client boundary, global Leaflet CSS. Version-matched reference: https://leafletjs.com/reference-1.9.4.html . Default tiles: https://tile.openstreetmap.org/{z}/{x}/{y}.png ; policy reviewed at https://operations.osmfoundation.org/policies/tiles/ . Browser caching/referrer defaults retained, visible attribution, no bulk downloads/prefetch, no keys/accounts/geolocation. NEXT_PUBLIC_MAP_TILE_URL and NEXT_PUBLIC_MAP_ATTRIBUTION can configure a different permitted provider. These are public configuration, never secrets.



The map fits only the requested endpoints. A/B markers have keyboard-accessible popups; visible endpoint text remains outside the map. Zoom and reset controls work independently of selecting a train. Drag, touch pinch, double-click and wheel zoom are disabled to preserve page scrolling. The panel is full-width on mobile, 300px high, and may be collapsed/reopened; desktop occupies the existing results sidebar. ResizeObserver invalidates layout on size changes; cleanup removes map/listeners and disconnects the observer. Route fetches are cancelled and keyed by endpoint IDs so stale responses cannot replace new geography. Outbound/return changes remount the panel; selected train context updates without an unnecessary geography fetch.



## Data and actual database writes



The existing database contains six active station records and **zero route records**. Current booking services are explicitly sample services; no verified service stop sequence or rail-aligned geometry exists. Therefore no intermediate stops or service-specific track path is invented. The visible connector is labelled Approximate route and explicitly says it does not trace railway tracks. This is not live tracking.



Seed: `npx tsx scripts/geography.ts`. Separate stationGeography collection, unique stationId index, source and verification date stored, no changes to existing station records, bookings, holds or services. The seed only upserts a coordinate if both station ID and exact reviewed station name match an active database record. Executed twice: matched 6, stored 6 each time; no duplicate records. Public read endpoint `/api/journey-geography?from=LHE&to=KHI` exposes only station location/provenance fields, validates bounded IDs and caches public results for an hour. Invalid coordinates are omitted. Missing geography gives partial/text fallback; DB failure gives 503 and leaves ticket selection available.



Coordinates are station reference points, not city centres or platform-specific survey data. Source pages read on 3 November 2026 (secondary geographic references except Multan's government page):

- LHE / LAHORE JN.: 31.5772, 74.3363 — https://en.wikipedia.org/wiki/Lahore_Junction_railway_station

- RWP / RAWALPINDI: 33.6036, 73.0483 — https://en.wikipedia.org/wiki/Rawalpindi_railway_station

- KHI / KARACHI CANTT: 24.8438, 67.0412 — https://en.wikipedia.org/wiki/Karachi_Cantonment_railway_station

- ISB / MARGALA: 33.663653, 73.048182 — https://en.wikipedia.org/wiki/Margalla_railway_station (distinct from Rawalpindi)

- MUX / MULTAN CANTT: 30.1804, 71.4446 — https://multan.punjab.gov.pk/node/289

- FSD / FAISALABAD: 31.41722, 73.09667 — https://en.wikipedia.org/wiki/Faisalabad_railway_station



## Checks



110 tests passed, including coordinate bounds/nonfinite rejection, query validation, missing/partial response contracts and existing booking tests. Typecheck, lint, formatting and production build passed. Actual public endpoint checks: Lahore–Karachi and its reversal return correctly ordered points; unknown–Lahore returns one point; identical endpoints and extra parameters return 400. Seed rerun verified six records remain six. Physical touch hardware, forced tile failure, rapid-request race and a complete return-booking browser walkthrough remain unexercised; their safeguards are implemented, not claimed as tested. No actual track geometry or live service route is claimed.



Browser checks completed signed out: searched Lahore to Karachi, viewed station markers and loaded OSM basemap, selected Emerald Night and verified context updates, used zoom/reset, collapsed/reopened at 390px. Map measured 301px wide by 300px high, page had no horizontal overflow. Desktop/mobile screenshots inspected. No reservation or payment was made.



## Language and interaction update

Supersedes the Leaflet/raster implementation above: MapLibre GL JS 6.16.0 now uses OpenFreeMap Liberty vector style. Public config: NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty . No key or paid account. Guides checked: https://openfreemap.org/quick_start/ and https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/ . Vector-source attribution remains expanded and visible.

The fetched public style's city/state/country layers originally concatenate Latin and non-Latin names. Name-label expressions now prefer the HTML language's name:language and name_language fields, then name:latin and name. The website declares en, so English names are preferred; missing translations fall back without invented names. Non-name labels such as road numbers are preserved. Language is read when the map opens; a future live language switch must remount the map. No new website language selector was added.

Normal drag, wheel/trackpad zoom, double-click, touch pan/pinch and keyboard navigation are enabled; rotation stays disabled. Page scrolling works outside the map. Reset restores the endpoint bounds. Coordinates, approximate-route disclosure, booking state and request cancellation are retained. Style fetch is abortable; map and resize observer are cleaned up on close/unmount. WebGL/provider failure retains the text summary with an unavailable message.


MapLibre 6's worker is served locally at /vendor/maplibre/worker.mjs with a package-version query. scripts/prepare-map.mjs copies the installed worker and its licence before npm run dev/build; generated files are gitignored and excluded from application lint. This fixes the Next dev worker URL failure observed and corrected during browser verification.

Update verification: English Pakistan/Quetta/Larkana labels visually confirmed in the real signed-out route panel; drag panning and wheel zoom confirmed by changed viewport. Reset restores the journey. 110 tests passed, typecheck/formatting passed, production npm run build (including prebuild worker preparation) passed. Physical pinch on touch hardware remains untested. No database or booking changes were needed for this update.
