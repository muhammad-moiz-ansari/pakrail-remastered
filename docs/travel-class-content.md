# Homepage travel-class content review

Reviewed 3 November 2026. One structured editorial record per canonical class lives in `src/lib/class-content.ts`; the shared homepage component uses it for both preview and dialog. No prices, capacities, fares, layouts, bookings or availability were changed.

## Sources and access

1. https://trackmytrain.com.pk/coach-class-comparison — verified through the rendered browser page. The web text extractor returned only “Loading app”; that was not treated as verification. Its class cards describe Economy fan cooling, Standard seated recliners, Business seated comfort/meals/power, Sleeper cabin bedding, and premium Parlour pods.
2. https://tracktrain.pk/blog/classes-comparison — accessible full article. Used only for non-conflicting corroboration (Economy fans/windows and paid food, AC cooling). It reverses important accommodation descriptions relative to source 1 and the local evidence; those conflicting claims were excluded.
3. https://www.pakrail.gov.pk/TrainClasses.aspx — web extractor timed out, but browser rendered successfully. Confirms the five names/codes only, not amenities.

Local evidence read: all seat-description/arrangement text files and website-links file under `references/Seat Arrangements`; layout images `1.png` for Economy Seat, Economy Berth, AC Lower Standard, AC Business and AC Sleeper inspected directly. No reference files modified. Existing verified layout implementation and the user's prior Parlour recliner/rotation clarification retained. The format reference is presentation evidence, not amenity evidence. No new screenshot was included in this user message; the existing card/dialog implementation was inspected instead.

## Decisions by class

| Class | Distinct content and evidence |
| --- | --- |
| Economy | Source 1: fan cooling, open windows, seated/overnight options, bring bedding for berth travel. Source 2 corroborates fans, no AC, basic seats. Local seat text: fixed seats, three-place groups, side seats/tables. Local berth text: partitioned bays, lower/middle/upper stacks and side seats. Suitability follows budget and sitting versus sleeping needs. |
| AC Standard | Source 1: AC, seated 2+2 recliners/headrests, charging in newer seated coaches, no included meals. Local Lower Standard diagram: separate berth variant, grouped/side accommodation and tables, no verified tier labels. Does not apply recliner/power claims to that berth variant. Suits travellers wanting AC, with actual accommodation depending on coach. |
| AC Business | Source 1: wider seated 2+2 variant with legroom, meals/tea/water, power and reading lights. Local diagram: lounges A–I with two lower/middle/upper stacks per lounge and tables. Seated amenities explicitly qualified, not promised in lounge variant. Suits longer seated or sleeping journeys in AC. |
| AC Sleeper | Source 1: lockable four-berth cabin example, blanket/pillow. Local text/image: two- and four-berth cabins, upper/lower tiers, tables, corridor and cabin toilets. Local text explicitly allows individually booked shared berths. No whole-room privacy promise; locks/bedding qualified by service. Suits overnight rest and groups reserving cabin berths. |
| AC Parlour Car | Source 1 describes premium seated pods, food/Wi-Fi/screens. Local text establishes 2+2 with rotation; prior explicit user instruction establishes recliners/current prototype rotation. Local rotating-seat coach is not sold as the premium pod variant; its meals/connectivity/screens unconfirmed. Suits daytime recliner travel. |

## Conflicts and limits

- Generic online arrangements/capacities differ from the supplied coach variants. Do not turn either into a universal layout or infer service equipment. No capacity or price included in this editorial copy.
- Source 2 calls Parlour sleeping cabins, Sleeper open berths and Standard padded seats. Higher-priority source 1 and the local coach evidence take precedence; never describe Parlour as sleeping cabins.
- Source 1's Sleeper cabin-count/capacity statements are internally inconsistent. Omitted; only cabin type and qualified bedding/lock description used.
- Source 1 says Parlour is Green Line-only. No train-specific availability restriction imported: it is not supported by the supplied arrangement, and the user has reserved train-specific rotation restrictions for later.
- Neither comparison proves amenities on the exact simulated service selected by a visitor. Qualification is intentional. Existing sample fares/availability/configuration disclosure and illustrative-photo disclosure retained.

## Storage

The existing MongoDB class records were inspected through the catalogue schema/store and a read-only database dry-run: five class records, 21 total pinned records unchanged, zero inserts. They contain a generic `description`, but no structured preview/accommodation/features/suitability editorial fields, and their fingerprints are required by pinned booking services. The new central content configuration supplies this missing editorial shape without replacing immutable historical catalogue descriptions or duplicating copy in the card/dialog component. No database writes performed.

## Checks

- All five dialogs rendered distinct introductions, accommodation, feature bullets and suitability text.
- Close button tested for every class; Escape tested on mobile.
- Find trains action closes dialog and returns to booking section.
- Mobile viewport 375 × 812: dialog fits horizontally, text wraps, vertical scrolling available; existing typography/theme retained.
- Existing suite: 88 tests passed. TypeScript passed. ESLint, Prettier, production build (20 pages) and git diff whitespace checks passed. The sandbox build initially could not create a Turbopack dependency junction; the same build passed with the permitted filesystem access.
