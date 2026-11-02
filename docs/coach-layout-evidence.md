# Coach evidence and implementation register

Reviewed locally and in the browser on 2026-11-02. The 19 supplied files under `references/Seat Arrangements/` are read-only evidence. All 14 images were visually inspected, and all five text files were read in full. The format-reference image supplies presentation order only: number, icon, price. Its fares, colours and icons are not imported.

## Source priority and conflicts

1. https://trackmytrain.com.pk/coach-class-comparison — accessible in a JavaScript browser. Describes Economy Seat, Economy Berth, AC Standard, AC Business, AC Sleeper and Parlour Car. Its generic capacities (108/72/60/46/24/26) and seating descriptions do **not** establish the exact supplied coach variants. No generic capacities, prices, meals, Wi-Fi, bedding or service assignments are copied into the booking configuration.
2. https://tracktrain.pk/blog/classes-comparison — readable. Where it differs on general class descriptions, source 1 takes priority. In particular its Parlour sleeping accommodation description is not used. Neither page overrides the supplied numbered diagrams.
3. https://www.pakrail.gov.pk/TrainClasses.aspx — browser verified the names and source-specific codes: EC Economy Class, ACL AC Standard, ACLZ AC Business, ACSL AC Sleeper, PC AC Parlour Car. These codes do not conflict with an explicit code in sources 1/2.

Economy Seat and Economy Berth are accommodation modes of Economy Class; their supplied matching labels share physical identities within the `ec78` family. Different modes may not create two inventory places. The supplied seated configuration retains the B suffixes as printed, without calling seated places sleeping berths.

“AC Lower Standard (Berth)” is retained as a **variant label** associated with AC Standard by the supplied folder name. “Lower berth” alone is never a class alias. Its berth tiers are not identified in the supplied files and remain unspecified.

At initial inspection, `5. AC Sleeper/seat description.txt` was headed “AC Business Class”, contradicting the folder. Its numbered arrangement agrees with the image (including the offset C stack). The geometry is implemented under the folder's Sleeper label, with an explicit class-label reference warning. No actual service or fare is asserted for it. This choice was raised with the user; changing the marketed association must not change its immutable geometry. During this run the reference file changed independently: its heading now says “AC Sleeper Class”. A byte comparison confirms that the heading is its only change. The closing paragraph still refers to Business. The implementation did not edit this or any other supplied reference file.

The Parlour text proves 14 rows of 2+2 rotating seats, **not** their printed numbers, reclining capability, doors, tables or current fares. Its 56 positions are an unnumbered preview, not 56 verified numbered reservations. Internal row/position IDs are never presented as railway seat numbers. The source-1 pod/recliner coach is a different, unprovided variant; no exact map is invented for it.

## Supplied folder mapping

| Folder | Canonical class / mode | Template, version | Evidence count | Sources | Status |
|---|---|---|---|---|---|
| 1. Economy (Seat) | Economy Class / seat | economy-seat-78 v1 | 78 labelled places | 1.png, 2.png, seat description.txt | Numbering, end gaps, side seats, paired tables; fixed seating confirmed |
| 2. Economy (Berth) | Economy Class / berth | economy-berth-78 v1 | 60 berths + 18 side seats | 1.png, 2.png, seat description.txt, train image.png, train ref image 1.png, train ref image 2.png | 10 bays, tables on both sides, nine internal bay walls, explicitly ordered upper/middle/lower stacks; physical photographs corroborate corridor/tables/stacks |
| 3. AC Lower Standard (Berth) | AC Standard / berth | ac-standard-72 v1 | 72 labelled berths | 1.png, 2.png | Includes leading 72B/71B, 70B–68B, offset side 67B–54B and trailing 53B/52B; tiers not supplied |
| 4. AC Business | AC Business / berth | ac-business-54 v1 | 54 labelled berths | 1.png, 2.png, 3.png | Lounges A–I, two U/M/L stacks each, right tables, compartment walls and left corridor; unlabelled grey left-hand fixtures retained without guessing purpose |
| 5. AC Sleeper | AC Sleeper / berth (class label unresolved) | cabin-16 v1 | 16 labelled berths | 1.png, seat description.txt | Cabins A–F (2/2/4/4/2/2), upper/lower labels, six tables, six labelled toilets, offset CU4/CL3. Folder/text class conflict recorded above |
| 6. AC Parlour | AC Parlour Car / seat | parlour-56-unnumbered v1 | 56 unnumbered positions | seat arrangement.txt | 2+2 × 14, central aisle and rotation; numbering and reclining capability unknown; preview only |

`Website Links for description.txt` and `format reference image.jpg` complete the 19-file inventory. Screenshot prices and coloured availability are observations from an unknown historical journey, not fare quotes or authorized occupancy categories. No reference files are edited.

## Data and booking boundaries

The existing four fictitious services, fare multipliers and simulated payment remain explicitly sample data. The configured sample consists are service-specific; they are not applied to real railway services. Only the pre-existing Economy/Standard/Business sample fare rules are reused. Sleeper/Parlour have no invented monetary quote. No source establishes live train consists, inventory, occupancy gender or real fares. No public endpoint returns customer/occupant records.

Templates are versioned and immutable; seeds reject changed geometry for an existing ID/version. Canonical classes extend the existing `travelClasses` collection. Sample service configurations use `demo_coachServices`. No passenger or historical booking collection is deleted, migrated, or reinterpreted. Legacy browser bookings retain their legacy seat grid and old class/fare labels; edited classes require fresh pinned selections.

Numbered template positions have stable place IDs and physical identities. Recommendations use bay metadata; U/M/L tiles are explicitly diagrammatic tier insets, not beds on the same floor. The independently focused/tappable places and list alternative repeat type, tier and full-ticket fare. Seat selection adds no surcharge. Missing quotes block completion; no unknown fare becomes zero.

## Commands and verification

`npm run coaches:seed -- --offline` validates the bundled reference catalogue without network or writes. `npm run coaches:seed` compares with MongoDB without writes; `npm run coaches:seed -- --apply` applies deterministic, non-destructive upserts. The final execution report records actual counts and checks rather than assuming success.

### Actual persistence and verification

Executed `node --import tsx scripts/coaches.ts --apply` against the configured existing MongoDB database. Initial apply inserted **15 records**: 5 in `travelClasses`, 6 in `coachLayoutTemplates`, and 4 in `demo_coachServices`. A second actual apply inserted **0** and found **15 unchanged**. Read-back verified the same 5/6/4 counts. The five numbered template representations contain 298 labelled positions; the two Economy modes share 78 physical identities, so this is not a claim of 298 distinct seats in a real train. There are also 56 explicitly unnumbered Parlour preview positions. Zero live departure/occupancy/customer booking records were created. No existing collection, customer data, or fare was deleted or overwritten.

The local `/api/coaches` endpoint returned `source: database`, `origin: sample` and the existing sample quotes of PKR 2,800 / PKR 6,160 for Indus Voyager on LHE–RWP. Service/class/layout integrity is checked against pinned references. Public payloads contain coach configuration and fare metadata, never occupant names, contacts, CNICs or booking references. Database failure is labelled as a local reference fallback. Unknown segments have no monetary quote.

Changed areas: `src/lib/coach-layouts.ts` (canonical model and geometry), `src/server/coach-store.ts` / `scripts/coaches.ts` (validated immutable import), `src/app/api/coaches/route.ts` (configuration/quotes), `src/components/coach-map.tsx` (custom icons, number–icon–price tiles, legends, map/list/details), `src/components/coach-booking.tsx` (service-specific choices and train overview), `src/lib/booking.ts` and `booking-app.tsx` (pinned assignments, fare guards, summaries and historical compatibility), `home-experience.tsx` (five canonical classes and reference previews), `src/app/coaches.css`, and the existing catalogue schema/CSV importer.

Canonical IDs retain `economy`, `standard`, `business`; `sleeper` and `parlour` are added. Official codes and spelling aliases are stored separately. Legacy completed bookings continue to show Economy/AC Standard/Business with their old fares and old seat-grid identity, even for past dates. Legacy drafts are prompted to choose their class/places again, retaining trains, travellers, contact information and valid other-leg state. No old seat “12” becomes new berth “12B”.

Automated checks cover all 6 template counts/label sets, irregular numbering, walls/tables/toilets, upper/middle/lower identities, aliases, shared Economy identities, duplicate/occupied rejection, fare guards and totals, return legs, stale recovery and historical receipts. Browser checks visually compared all six renderings with their supplied evidence; tested map/list/details at 390px and 320px; verified keyboard Space removal, Enter selection, Escape and focus restoration, neutral occupied details with no selection action, coach preview without losing selections, and a full adult+child round trip through test payment and confirmation/reload. The sample round trip retained AL1/AM2 outbound and 72B/71B return, with total PKR 20,000 and zero selection surcharge. A discovered mobile receipt wrapping issue was fixed and rechecked with zero detail overflow at 320px. Physical touch hardware was not used; native click/tap activation paths and touch-sized controls are implemented.

Reference integrity recheck: 18 files exactly match their initial SHA-256 hashes. The remaining file is the independently changed Sleeper heading described above; replacing only that heading in memory reproduces its original hash. No reference file was rewritten by this implementation.

Remaining limitations: no supplied current railway fare quotes, real consists, reservation/hold backend or authorized occupant-gender feed exists. The app retains simulated inventory and test payment. Blue/pink male/female styling is implemented but not attached to invented occupants; current unavailable sample places are neutral. AC Standard tiers remain unspecified; Parlour numbering/reclining capability remains unverified; the Sleeper closing paragraph still has a class-name inconsistency. The highest-priority site's generic coach variants have no supplied detailed geometry and therefore do not get fabricated maps.

Final project checks (2026-11-02): **83/83 tests passed**, `npm run typecheck` passed, `npm run lint` passed without warnings, `npm run format:check` passed, and the production Next.js build passed (20 pages generated). `git diff --check` found no whitespace errors. The final API recheck returned database configuration, `Cache-Control: no-store`, the expected existing sample quotes, and no quote for an unknown segment. No deployment or Git commit was performed. The existing development server was reused and left running.
