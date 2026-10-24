# Designify — Website Features and UI/UX Brief

Date: 24 October 2026
Status: Design preferences for the future website; not yet implemented or user-validated.

## 1. Overall direction

Use Emirates as the primary reference for a professional, cohesive visual style. Where the specific preferences below differ, those preferences take priority. Adapt the patterns to railway booking using an original Designify identity.

This document organizes Moiz's observations and preferences from reviewing booking websites. It does not claim that these features have passed usability testing.

## 1.1 Green theme and current prototype scope

Green is the required theme colour. Use **deep emerald #087F5B** as the primary accent, **#066649** for hover, **#064E3B** for pressed/dark emphasis, and **#E8F5EE** for subtle selected/range backgrounds. Pair with white surfaces, **#F6F8F7** page backgrounds, **#172B24** main text, and **#52635B** secondary text. Keep red for errors and amber for warnings; status meaning also needs words/icons.

The shade is an original Designify choice after reviewing Trainline's colour-token/neutral-surface approach, Flix's published green-led brand guidance, and the supplied Emirates/Omio/redBus screenshots. Preserve Emirates-inspired professional structure, without using Emirates red as the main theme. The palette is not a claim about another company's current exact colours.

Calculated white-on-#087F5B contrast is approximately 5.00:1 (sRGB relative luminance). White-on-hover is approximately 6.99:1. These are colour-pair calculations, not proof that the complete site passes an accessibility audit.

Sources reviewed: [Trainline colour system](https://d-system-trnln.webflow.io/color), [Flix published style guide (2019)](https://flixbrand.com/wp-content/uploads/2019/06/Flix-Brand_Styleguide_external.pdf), and the eight supplied screenshots.

**Current phase override:** implement the D4 booking prototype first. The route map is a clearly labelled placeholder with station names, not a live map. Use a static train illustration/placeholder instead of the moving train animation for now. These features remain in the final-phase design scope. Mock schedules, fares, availability, and payment are allowed when documented; the core booking interactions must actually work. Follow `Designify_D4_Codex_Prototype_Handoff.md` for phase-specific implementation details.

The green palette applies to Part B. Preserve Part A as an intentionally grayscale structural prototype with its own evidence and version.

## 2. Design references

| Area | Reference | Direction |
| --- | --- | --- |
| Overall UI | [Emirates](https://www.emirates.com/) | Professional presentation, consistent typography, spacing, and booking controls. Use the green palette in Section 1.1; typography is specified in the D4 implementation handoff. |
| Homepage/search | Emirates + [Omio](https://www.omio.com/) | Emirates-led appearance with the guided search interaction described below. |
| Train results/booking | Custom preferences + [Eurostar](https://www.eurostar.com/uk-en) | Ticket-shaped result cards, route map, and a selection bar inspired by the user's Eurostar screenshot. |
| Class comparison | Eurostar | Understandable comparison of class benefits, descriptions, and prices. |
| Seat map/details | [redBus](https://www.redbus.in/) | Seat-map layout and visual treatment, adjusted as specified below. |

All eight numbered visual references have now been supplied and reviewed. See Section 13 for the exact filename-to-component mapping and implementation guidance. Written preferences override incidental details in a screenshot.

## 3. Homepage and search

### 3.1 Search fields

- Departure station.
- Arrival/destination station.
- Departure date, with today's date selected dynamically by default.
- Return date, with a One Way option to skip it.
- Passenger quantities: Adults and Children only.

Do not put departure-time range selection in the initial search form. Provide it after Search in the results-page filter/sort area.

### 3.2 Guided interaction sequence

1. User selects the departure station.
2. The arrival-station selector automatically opens.
3. After an arrival station is selected, the departure-date mini calendar opens automatically.
4. Today's date is initially selected; the user can accept it or choose another date.
5. After the departure date is committed, the same mini calendar moves to return-date selection.
6. User selects a return date or chooses One Way to skip the return date.
7. The passenger-quantity dropdown opens next.
8. User sets the adult/child quantities, confirms them, and presses Search trains.

Automatically open the next control after the previous selection is committed, not while the user is typing. Search itself remains an explicit action. The initial trip-type default is still undecided.

### 3.3 Calendar behaviour

- Use one anchored mini-calendar interaction for departure and return dates, showing two consecutive months side by side on desktop with month headings, weekday labels, and previous/next month arrows.
- Follow references 3 and 4 for departure/return mode and the One Way control; use reference 5 for the continuous pale range band and stronger rounded endpoint styling. Apply a consistent Designify palette rather than mixing red and blue selection styles.
- Change the prompt from choosing a departure date to choosing a return date, and keep both field values visible above the calendar. On narrow screens, show one month at a time.
- When selecting a return date, hovering over a date after departure highlights the range from departure through the hovered date.
- After selection, retain the highlight for the chosen range.
- Choosing One Way clears or disables the return-date requirement.
- Support equivalent keyboard and touch selection without depending on hover.

### 3.4 Passenger dropdown

- Follow reference 2: an anchored white dropdown with a small pointer, a Passengers heading, separate category rows, a centred count/category label, and square minus/plus buttons at the left/right. Show disabled minus controls at the minimum count.
- Remove the Infant row shown in the reference. Its airline age bands are not approved railway age rules; use verified age guidance when available.
- Include Adults and Children only, with clear count controls and a summary in the search bar.
- Carry quantities into the passenger-details step so users do not repeat the same work.
- Adult/child age boundaries, default counts, and maximum counts remain undecided.
- Whether seniors appear later as a passenger category or concession is still open; they are not part of this search dropdown.

## 4. Train results and booking action

### 4.1 Selection bar and filters

- Use reference 1's compact horizontal search bar: departure and arrival fields with a swap control between them, a combined departure-date/Add return area, passenger dropdown, and prominent Search button. Reuse this structure on the results page while retaining the Emirates-led overall style.
- Keep the selected journey details visible and editable.
- Include departure-time range controls in the filter/sort area after Search.
- Distinguish a time-range filter from sorting by departure time.

### 4.2 Ticket-style result cards

- Present each available train option as reference 6 shows: a white rounded rectangular ticket-style card with a subtle border/shadow on a light background. The reference does not require decorative perforations, barcodes, or ticket cut-outs.
- Place operator/train identity near the top; show prominent departure and arrival times separated by smaller duration text and short horizontal connectors, with station names underneath. Place the fare prominently at the lower right, with passenger-count/trip-type context below.
- Use a small lower-left details control for relevant journey details. Transfer counts, savings, and fastest badges shown in the reference are optional only when supported by actual data; do not fabricate them.
- Let users click or keyboard-activate a ticket card to select it.
- Make the selected card unmistakable and show a clear booking/continue action.
- Keep the content readable: train name, stations, travel date, departure/arrival times, and fare information.
- Clearly identify whether the displayed fare is a starting fare, per-passenger fare, or group total.

### 4.3 Route map

**D4 now:** placeholder only. The following describes the later final-phase target.

- Follow reference 7: a desktop results column on the left with a compact route map in a right-hand column. Use a subdued basemap, labelled station endpoints, a visible connecting line, and zoom controls.
- On mobile, place the map below results or behind an accessible Show route control (implementation recommendation).
- Do not reproduce the adjacent app-promotion panel or QR code; these are incidental to the screenshot, not requested features.
- Clearly identify the origin and destination.
- Keep written journey information available alongside the map.
- Mapping provider and route-data source remain undecided. An illustrative line must not be presented as a verified railway route.

## 5. Class comparison and selection

- Use Eurostar's class-comparison approach as the reference.
- Show full class names, short explanations, relevant benefits, and prices.
- Make the selected class obvious and allow it to be changed.
- Keep this step before passenger details, following the sequence chosen earlier.
- Verify the actual class list and what Rank 0–3 means before writing explanations or selecting defaults. Do not invent railway policy.

## 6. Passenger details

- Collect details for the adults and children selected during search.
- Support editing passenger information and clearly adding adults.
- Reflect count changes consistently in the journey summary, prices, and required seat assignments.
- Do not automatically assume the account holder is travelling.

## 7. Seat map and seat details

### 7.1 Visual direction

- Use reference 8: recognizable outlined seat silhouettes arranged in rows with an aisle gap; a small price or Sold label appears below each seat. Adapt the geometry to a railway coach rather than copying the bus layout literally.
- The screenshot shows green outlined and filled seat variants, and pale grey sold seats with faint pink/blue accents. It has no legend establishing the meaning of the green fill or pink/blue accents. Define our own explicit Free/Taken/Selected/Recommended legend rather than inferring booking policy from these colours.
- For sold/unavailable seats, retain the grey treatment but make the pink and blue accents observed in the reference slightly more prominent within that treatment.
- Confirm what the pink and blue colours mean before implementing the legend or associated rules.
- Use text/icons as well as colour so seat states remain understandable in grayscale.

### 7.2 Seat states and assignments

- Clearly distinguish Free, Taken/Sold, and Selected.
- Treat recommendation as information separate from availability.
- Show which passenger owns each selected seat and how many passengers still need seats.
- Carry forward the seat-details/confirmation interaction, including seat identity and relevant price information.

### 7.3 Recommended seats selected by default

- Automatically pre-select recommended seats when the user reaches seat selection.
- The recommendation algorithm will be decided later.
- Explain that the initial seats were selected automatically and allow users to change them easily.
- Only select available seats; prevent duplicate assignment to multiple passengers.
- UI selection does not imply a completed booking or a real seat hold unless that behaviour is actually implemented.

Possible algorithm inputs for discussion, not approved rules: keeping the group together, passenger preferences, and availability within the selected class.

## 8. Train animation

**D4 now:** static placeholder only; implement movement in the final phase.

- Include a moving train animation entering from one side of the screen and exiting from the other.
- Placement, direction, speed, trigger, and repetition frequency remain undecided.
- Keep it from obscuring controls or delaying booking.
- Support reduced motion; provide pause/stop controls if using persistent animation.

## 9. Workflow context

1. Search: stations, departure date, return date or One Way, passenger quantities.
2. Results: time filters, ticket-style train cards, route map, and booking action.
3. Rank/class/ticket-option selection with verified explanations.
4. Passenger details.
5. Seat selection, starting with editable recommended seats.
6. Review the journey, passengers, seats, and total; optional voucher if included.
7. Payment.
8. Booking confirmation.

Steps 6–8 carry forward the earlier workflow discussion. The latest notes do not specify new visual references for them. The previously proposed ten-minute payment timer remains a separate decision requiring defined seat-hold, expiry, and retry behaviour.

A return journey needs train and seat selections for both legs. Decide how the outbound and return choices fit into this flow before implementing round trips.

## 10. Supporting implementation recommendations

These support the design; they are not claims about the reference websites or completed research findings.

- Keep automatic opening predictable, dismissible, and accessible by keyboard. Revisiting earlier fields should not trap users in repeated automatic progression.
- Preserve entered information when going Back or editing previous steps.
- Validate station/date combinations and provide actionable errors.
- Include loading, empty, error, and success states where relevant.
- Maintain visible focus, meaningful labels, and readable contrast.
- For D4 Part A, build and preserve grayscale wireframes before developing the styled functional version.
- Complete the actual card sort and the team's keyboard/screen-reader walkthroughs required by D4. This preferences document does not replace that evidence.

## 11. Changes from earlier concepts to document

| Latest preference | Change to record |
| --- | --- |
| Passenger quantities in search | Reintroduces the upfront count D3 previously rejected as duplicated effort. Explain the revised rationale and carry counts forward to avoid asking twice. |
| Class before passenger details | Uses the chosen D2 order rather than D3's passenger-first storyboard. |
| Recommended seats pre-selected | Revises the earlier recommendation-toggle/manual-choice concept. Preserve user control and test whether users understand the defaults. |
| Adults and Children in search | Limits search categories compared with the earlier Adult/Child/Senior proposal. Later handling of seniors remains open. |
| Return trips, route map, train animation | Additional features requiring scope and interaction decisions. |

## 12. Open decisions checklist

- [x] Review the supplied search-bar screenshot and all seven companion references; map them to components in Section 13.
- [ ] Choose the initial trip type and outbound/return selection sequence.
- [ ] Define passenger age categories, count limits, and defaults.
- [ ] Verify rank meanings, class options, and seat/berth distinctions.
- [ ] Confirm the meanings of pink/blue seat accents.
- [ ] Define the recommendation algorithm and fallback when adjacent seats are unavailable.
- [ ] Decide whether seniors are handled later as a category/concession.
- [ ] Choose route-map data/provider and animation behaviour.
- [ ] Decide whether to include the payment timer and its recovery path.
- [x] Set green as the theme and select deep emerald #087F5B; use Section 1.1 and the D4 handoff for tokens.
- [ ] Validate the palette and component states in the rendered prototype.

Use this brief as the current design direction. Resolve the open decisions explicitly during design rather than silently treating assumptions as established railway rules.


## 13. Visual reference inventory and Codex handoff

Attach all eight original images together with this Markdown file when giving the implementation task to Codex. The images communicate proportions, spacing, shapes, and visual hierarchy that text cannot specify fully. Preserve their numbered filenames so the mapping below remains clear. Local copies accompany this brief in the `references/` folder; if sending elsewhere, include that folder or attach the images separately.

| No. | Exact filename | What to take from it |
| --- | --- | --- |
| 1 | `1. Search page bar.png` | Compact horizontal field grouping, station swap control, combined date area with Add return, passenger summary, prominent Search action. |
| 2 | `2. Search page passenger drop menu - Emirates.png` | Anchored passenger popover, heading, category rows, count labels, square minus/plus buttons, disabled-control appearance. Keep Adults/Children only. |
| 3 | `3. departure date selection.png` | Wide anchored two-month calendar, departure-mode heading, month navigation, visible search context, One Way control. |
| 4 | `4. return date selection.png` | Same calendar switching to return mode, both dates visible, range spanning months, distinct departure and return endpoints. |
| 5 | `5. return date selection mini calendar (view 2).png` | Pale continuous range highlight with strong rounded start/end caps. Use this range treatment within the calendar interaction from references 3–4. |
| 6 | `6. ticket info in ticket-style format and selecting from here.png` | Rounded journey cards, time/duration hierarchy, stations beneath times, compact details control, strong fare area and passenger/trip summary. |
| 7 | `7. mini map.png` | Results on the left and compact route map on the right, muted map styling, station labels, markers, connecting line, zoom controls. |
| 8 | `8. seat mapping and selectiong.png` | Seat silhouettes, rows/aisle spacing, price/Sold labels, green available-style treatment and grey sold treatment with faint pink/blue accents. |

### Reference priority

1. Explicit written requirements in this brief take priority.
2. Use the numbered screenshots for the specified component's appearance.
3. Use Emirates as the overall professional visual direction.
4. Fill remaining gaps with consistent, accessible railway-specific design; keep unresolved business rules explicit.

### Details not automatically imported from screenshots

- Do not add Infants, airline age thresholds, airport language, or airplane icons; use railway terminology and suitable icons.
- The calendar's +/- 3 days option is visible in references 3–4 but was not requested; it is outside the current feature list unless explicitly added later.
- Screenshot dates and example journeys are sample content, not fixed defaults. Today must be calculated dynamically.
- Do not copy foreign currency, operator branding, promotions, or transfer/savings claims into production content.
- Pink/blue meanings still require clarification because the supplied seat crop has no legend.
- A static screenshot does not prove automatic progression or hover behaviour. Implement those behaviours because they are explicitly requested in this brief.
- Reference 5's rounded range endpoints and references 3–4's calendar shell are a deliberate combination; avoid reproducing their differing colour schemes simultaneously.

### Visual acceptance checklist

- [ ] Search fields follow reference 1's grouping while retaining the requested guided progression.
- [ ] Passenger dropdown follows reference 2 with only Adult/Child rows.
- [ ] Calendar shows the two desktop months, departure/return prompts, One Way, and reference 5's range treatment.
- [ ] Ticket cards follow reference 6's hierarchy and show an obvious selected state.
- [ ] D4 results reserve reference 7's map area with a labelled placeholder; implement the actual map in the final phase, without its app promotion.
- [ ] Seat map follows reference 8's icon/label treatment, with more legible sold-seat accents and an explicit accessible legend.
- [ ] Automatically recommended seats remain editable and associated with passengers.
- [ ] Mobile and keyboard/touch behaviour work beyond the desktop screenshot examples.
