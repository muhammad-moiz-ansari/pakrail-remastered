# Coach selection fixes — 2 November 2026

This follow-up supersedes the initial UI, sample-pricing and Parlour limitations in `coach-layout-evidence.md` where described below. The user's annotated Sleeper screenshot and explicit confirmation of rotatable Parlour recliners are the sources for these corrections. Supplied reference files remain unchanged.

## Changes

- Coach-map scrolling now uses normal scroll chaining at both vertical boundaries. Browser wheel checks moved the main page from 3868 to 3148 at the map's top and from 4187 to 4907 at its bottom while the coach stayed at the respective boundary.
- The former “Accessible place list” is named **Place list**, with an explanation that it contains the same accommodation details in a text layout for keyboard users, screen readers and narrow screens. It remains an alternative to the visual map.
- Male, female and unspecified occupied examples are shown in both layout previews and booking maps. These are deliberately labelled **sample occupancy**, without occupant identities or inference from names. The actual-data normalization still keeps unknown/prefer-not-to-say categories neutral.
- **AC Sleeper `cabin-16` v2** retains all sixteen printed labels, tiers, the offset C stack and the six toilets/tables. Berths have more clearance below cabin boundaries. Stepped walls put A's left toilet above the A/B boundary and B's right toilet below it. C/D uses the reverse step, and E/F follows the A/B pattern. Old v1 geometry is retained.
- **AC Parlour `parlour-56-unnumbered` v2** uses premium recliner icons and marks all current positions rotatable, as requested. The 14 × 2+2 arrangement is retained. Future service-specific rotation restrictions can be introduced through different pinned layouts/configurations. No train names or seat numbers were invented.
- Booking coach navigation now uses the selected leg's class-specific coaches, rather than the full consist. For Economy outbound and AC Standard return, only Economy coaches appear outbound and only Standard coaches appear on return.
- Selection starts with the place. Its details show a radio list of all travellers, including their existing assignment. Selecting a passenger immediately moves them to the new place on that leg. Reassigning a group-owned place releases its former passenger. Reopening a selected place shows its current passenger checked; **Remove assignment** explicitly releases it. Return-leg assignments remain independent.
- The passenger sidebar is a read-only summary and is no longer sticky, preventing it from covering the lower information panel.

## Prices and database changes

The user approved **PKR 8,900 Sleeper** and **PKR 9,500 Parlour** as labelled sample fares. These are stored in the new sample service configurations and quoted with source `approved-sample-fare`. The existing route factor and adult/child sample fare behaviour are retained; selection adds no surcharge.

Standalone previews now display example full-ticket prices for all six arrangements: Economy Seat 4,350; Economy Berth 4,250; AC Standard 11,150; AC Business 6,250; Sleeper 8,900; Parlour 9,500 (PKR). The first five amounts were visible in the supplied reference screenshots; the user approved Sleeper's use and supplied approval for the illustrative Parlour amount. Preview copy explains that the selected journey's fare may differ. These examples are not live railway fare quotes.

Parlour's class sample price is visible, but numbered reservations remain disabled because its source still contains no printed place numbers. Unknown journey segments still have no quote; no real fare is fabricated.

The actual MongoDB apply inserted **six records**: two new layout versions and four new sample service configurations (`sample-0-v2` through `sample-3-v2`). The earlier fifteen records were unchanged. Read-back/repeated dry-run found **zero new records and 21 unchanged**, comprising five canonical classes, eight saved layout versions and eight sample service configurations. Six layouts/four service configurations are current; the remainder preserve earlier snapshots. No customer data or historical template was replaced.

## Verification

The automated suite covers place-first movement/reassignment, unavailable/forged targets, both journey legs, historical version restoration, approved sample prices and no duplicate fare charging. Geometry checks ensure no Sleeper berth overlaps a wall and each toilet step has the intended orientation.

Browser checks cover both wheel boundaries, corrected Sleeper geometry, Parlour recliner/rotation details, class-only coach navigation, passenger radio assignment and checked state, preserved return assignments, sample male/female colours, sidebar position and a 320px assignment dialog. Physical touch hardware was not used.

Final checks: **88/88 tests passed**, TypeScript passed, lint passed without warnings, formatting passed, and the production Next.js build passed (20 pages). A complete browser round trip used Economy outbound and AC Standard return. After moving/reassigning passengers, confirmation and reload retained outbound 03B/04B and return 72B/71B, with the correct PKR 12,480 total. At 320px the dialog had no page-wide horizontal overflow and its passenger labels exceeded 44px touch-target height; Space and Escape restored the expected radio/focus state. Computed occupied backgrounds were blue `rgb(234,241,250)`, pink `rgb(248,234,240)` and neutral grey `rgb(233,235,230)`.

No Git commit or deployment was performed. The supplied Seat Arrangements files have no changes in the final diff.
