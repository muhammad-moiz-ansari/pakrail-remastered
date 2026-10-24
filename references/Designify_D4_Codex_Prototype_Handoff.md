# Designify D4 — Codex Prototype Implementation Handoff

Date: 24 October 2026
Project: Designify, Pakistan Railways booking-flow redesign.
Deliverable: CS3014 D4, Prototype: Structure, Function and Accessibility; 9% of final grade.

## 0. Instruction to Codex

Build this prototype using Next.js and TypeScript. Read the companion `Designify_Website_Features_and_UI_Brief.md`, the D4 brief, and the eight screenshots. Inspect the repository and its instructions first. Preserve unrelated work. If no app exists, create it in `D4/designify-prototype/` within the deliverables workspace, or in the supplied empty repository root.

Deliver a responsive, functional booking journey and D4 documentation. Use deterministic local fixtures; no production railway, map, payment or account integrations are required. Do not deploy publicly unless requested. Include actual setup, run, test and build commands in README.

This single handoff contains page-by-page instructions. Latest user instructions and the D4 brief take priority; this handoff defines the current implementation phase. The companion brief describes the broader final design. Record substantial concept changes rather than rewriting research history.

## 1. References

| Filename | Use |
| --- | --- |
| `1. Search page bar.png` | Compact horizontal station/date/passenger/search bar and station swap |
| `2. Search page passenger drop menu - Emirates.png` | Passenger popover and minus/count/plus rows; Adults/Children only |
| `3. departure date selection.png` | Anchored two-month calendar and departure prompt |
| `4. return date selection.png` | Same calendar in return mode |
| `5. return date selection mini calendar (view 2).png` | Pale range fill and rounded selected endpoints |
| `6. ticket info in ticket-style format and selecting from here.png` | Journey-card hierarchy, time/duration/stations, fare area |
| `7. mini map.png` | Results/map placement only for now |
| `8. seat mapping and selectiong.png` | Seat silhouettes, aisle, price/Sold labels |

Use Emirates-inspired professionalism with our green theme, Eurostar-style class comparison, Omio-style result cards and redBus-inspired seat visuals. Do not import airline age rules, foreign brands, promotional claims, or unrelated screenshot features. Images should accompany this document, preferably in `references/`.

## 2. Phase scope

| Feature | Implement now | Later |
| --- | --- | --- |
| Search/results | Functional validation, fixtures, filters/sorting | Live schedules |
| Passengers/classes | Editable cards and counts; mock class comparison | Verified concession/rank policies |
| Seat map | Interactive coaches, assignments, recommendation defaults and recovery | Real inventory and final recommendation algorithm |
| Review/confirmation | Complete computed summaries and simulated booking reference | Real ticket issuance |
| Payment | Mock async success/failure/retry, no real credentials or charges | Payment gateway |
| Route map | Labelled placeholder with station names in right-hand panel | Real map, route data, zoom/pan |
| Moving train | Static train silhouette/illustration placeholder | Crossing animation |
| Accounts | Guest flow, fictional data | Authentication |
| Voucher | Documented local demo voucher | Real discounts |
| Ten-minute timer | Defer; no dead countdown | Verified hold and expiry behaviour |
| Pink/blue sold-seat meaning | Neutral Sold seats while meaning is unverified | Verified legend/data |

Map copy: `Route preview` and `Map preview will be added in the final version`. Show origin/destination text; no fake zoom controls or geographic route claims. Core booking controls must work, not be placeholders. Mark mock booking/payment clearly with a compact demo notice; keep implementation jargon in documentation.

## 3. Workflow and proposed routes

| Screen | Route | Main action |
| --- | --- | --- |
| S1 Home/search | `/` | Search trains |
| S2 Train results/summary | `/booking/trains` | Book this train |
| S3 Class options | `/booking/classes` | Continue to passengers |
| S4 Passenger details | `/booking/passengers` | Continue to seats |
| S5 Seat assignment | `/booking/seats` | Review booking |
| S6 Review/voucher | `/booking/review` | Proceed to payment |
| S7 Payment simulation | `/booking/payment` | Pay [total] — demo |
| S8 Confirmation | `/booking/confirmation` | Print summary / Start new booking |

Use sequential navigation, Back/Edit actions, and a visible progress indicator. This is proposed IA until validated by the team's real card sort. Class precedes detailed passengers, as the user requested. Quantities selected in search generate passenger cards.

Round trips: select outbound and return trains in S2, class per leg in S3, shared passengers in S4, and seats per passenger per leg in S5. Review/confirmation show both legs and combined total. Validate return departure after outbound arrival, including overnight journeys.

## 4. D4 build stages and evidence integrity

### Part A first

1. Prepare a card-sort kit and blank real-participant record. Use supplied card-sort results to derive IA. Without results, label the structure `Proposed — awaiting card-sort validation`.
2. Build connected grayscale wireframes for S1–S8, including an alternate/error route. Use boxes, labels and simple monochrome components.
3. Produce an arrow-based screen-flow diagram with screen IDs and error/recovery branches; Mermaid or SVG is suitable.
4. Prepare draft visual hierarchy/Gestalt notes for the team to review in their own words: proximity for passenger fields, common region for ticket cards, consistent primary-action placement.
5. The team conducts real card sorts, keyboard/screen-reader walkthroughs and studio critiques. Prepare procedures and blank logs; never invent participants, findings, quotes, dates or passes.
6. Apply supplied findings. Preserve Part A before styling, using a commit/tag where available or a separate snapshot plus version manifest/screenshots.

### Part B next

7. Develop the same flow into the functional green prototype. Carry forward Part A fixes and revisit deferred issues.
8. Implement state handling, fixture scenarios and engineering tests. Keep engineering results distinct from the team's manual audit findings.
9. Provide implementation notes, re-check procedures, video outline and submission checklist.

A grayscale toggle can assist viewing but does not replace the preserved early Part A version. If human evidence is missing, continue useful implementation but mark the structure provisional and evidence incomplete. Reconcile real findings before declaring submission readiness.

## 5. Design system — green Part B

| Token | Value | Use |
| --- | --- | --- |
| Primary | `#087F5B` | Buttons, links, selected dates/controls |
| Hover | `#066649` | Primary hover |
| Pressed/dark | `#064E3B` | Pressed state and emphasis |
| Soft green | `#E8F5EE` | Range fill and selected-card background |
| Background | `#F6F8F7` | Page |
| Surface | `#FFFFFF` | Cards, fields, popovers |
| Text | `#172B24` | Main text |
| Muted text | `#52635B` | Supporting labels |
| Control border | `#718079` | Essential control boundaries |
| Divider | `#D5DED9` | Decorative separators |
| Error | `#B42318` | Error with text/icon |
| Warning | `#92400E` | Warning with text/icon |
| Focus | `#064E3B` | Outline with white offset on green surfaces |

White on primary has calculated contrast about 5.00:1; white on hover about 6.99:1. Check every rendered combination; these calculations are not a complete accessibility audit.

Three primary type levels: page title 30–32px, section title 20–24px, body/control 16px; supporting metadata 14px when appropriate. Use a system or locally bundled sans-serif. Spacing: 4/8/12/16/24/32/48px. Controls at least 44px tall as a design target. Cards around 12px radius, fields around 8px, subtle shadows. Content width about 1200px; adapt for mobile. Avoid oversized empty hero sections.

Original palette rationale: Trainline's colour system uses semantic tokens/neutral layers (https://d-system-trnln.webflow.io/color); Flix's published 2019 style guide demonstrates a green-led travel identity (https://flixbrand.com/wp-content/uploads/2019/06/Flix-Brand_Styleguide_external.pdf). Our emerald hex is an original selection, not a copied official brand colour.

Reusable components: Button, Input, StationCombobox, PassengerCounter, DateRangePicker, Stepper, TrainCard, ClassCard, PassengerCard, SeatButton, Dialog/Sheet, BookingSummary, Alert, MapPlaceholder. Document their applicable states.

## 6. Page-by-page implementation

### S1 — Home/search

Show original Designify branding, a short booking-focused heading, prominent search, and static train visual placeholder. No dead marketing links.

Desktop fields: Departure, Arrival, Departing/Returning, Passengers, Search trains, with station swap. Filter station options while typing; use stable station IDs and readable empty-option feedback.

First forward selection: departure opens arrival, arrival opens calendar, committed departure date moves to return selection, return/One Way opens passengers. Do not advance while typing or restart this sequence when users revisit earlier fields. Escape dismisses popovers and returns focus appropriately.

Today's date in Asia/Karachi is selected dynamically. Store date-only values without UTC shifts. Desktop calendar has two months; mobile has one. Keep search values visible, update departure/return prompt, and use pale range preview plus rounded filled endpoints from reference 5. Hover and keyboard focus preview a return range; touch selection works too. Past dates are disabled; return cannot precede departure.

Initially display Add return without a committed return date. In the guided calendar, require return selection or explicit One Way. Dismissing the panel must not invent a return date. Passengers confirm using Done; Search remains an explicit action.

Prototype defaults: one adult, zero children, minimum one adult, maximum six total. These are demo limits, not railway policy. Adults/Children only, no unverified age bands. Use reference 2's +/- rows and disabled minimum decrement.

Validate missing/same stations, invalid dates and counts. Errors are linked to fields; move focus usefully. Search has loading and duplicate-submit protection. Acceptance: three adults can reach valid results using keyboard or mouse.

### S2 — Results and train selection

Top: editable compact journey bar. Main column: reference 6 ticket cards. Right column: map placeholder; place below results on narrow screens.

Card content: train name, large departure/arrival times, smaller duration, stations, relevant details control, strong fare and fare basis. Use PKR and clearly fictional demo trains/schedules. Do not fabricate savings/fastest badges.

Time-range filter is here, not in initial search. Separate it from sorting by departure or price. Filtering changes actual results; display count, no-results text and Clear filters.

Selection reveals a summary and prominent Book this train action. Use accessible card/radio semantics and separate details button; avoid nested interactive buttons. For round trips, select outbound then return with outbound summary retained; ensure valid times.

States: loading, results, selected, no matching trains, simulated failure with Retry. Retain search information throughout.

### S3 — Class/options

Eurostar-inspired comparison cards: full class name, short benefits, fare per passenger, total and clear Select. Show leg/train context. For round trips select each leg's class. Use mock Economy, AC Standard and Business options as illustrative fixtures; do not claim real amenities/layouts.

Rank 0–3 remains unverified. Omit it from required controls for this prototype and document the omission as an R3 limitation; reserve an extension point rather than inventing explanations. Class selection still works. Start with no selected class and require an explicit choice.

Show insufficient-capacity feedback with change-class/train actions. Continue only after required choices are complete.

### S4 — Passenger details

Generate cards matching search counts. Add passenger offers Adult/Child. Permit name/category edits and removal within demo limits. Fields: name/type per passenger and booking contact name/email. Use fictional-data guidance; no CNIC requirement. Optional Use contact name for Passenger 1 is explicit, not automatic.

Use stable passenger IDs. Confirm populated-card deletion or offer Undo. Update counts, fares and seat requirements; removal releases that passenger's seats on both legs. Preserve entered names where valid.

Validate required names, usable contact email and minimum adult count. Show field errors and summary. Acceptance: three adult travellers produce three adult tickets through all later steps.

### S5 — Seat selection

Show leg/train/class, coach selector, passenger list/active passenger, assignment progress and total. At least two mock coaches per class; schematic railway layout, not a claim of real train geometry. Use seat silhouettes and small labels like reference 8.

States: Free = outline + Free/price; Sold = grey + lock/cross + Sold; Selected = green + check + passenger identifier; Recommended = separate star/text badge. Preselected recommendations are also Selected, not merely recommended.

The screenshot has no legend confirming pink/blue meaning. Use neutral Sold seats now; record coloured accents as a final-phase dependency, without inferred gender rules.

Demo recommendation function: prefer enough contiguous free seats in one row/coach; otherwise choose a deterministic nearby row/seat-number set and explain that seats together were unavailable. Never select sold seats or duplicate assignments. Run for initially unassigned passengers; do not overwrite manual selections on rerenders or Back. Document this as a provisional demonstration algorithm, not the final algorithm.

Show `We've selected suggested seats for your group. You can change them.` To change: choose passenger, choose free seat, open sheet with coach/seat/features/price and Confirm seat/Cancel. Cancel preserves the old seat; Confirm atomically releases old assignment and assigns new. Coach changes preserve selections.

Round trips have separate leg switches/progress. Require seats for every passenger on every leg before review. Controlled conflict scenario: a selected seat becomes unavailable on revalidation; identify the affected passenger/leg, retain other assignments, and allow replacement.

### S6 — Review and voucher

Show both legs as applicable: route/date/train/class, passengers, coach/seat, contact, fare breakdown and total. Edit actions navigate to the relevant step while preserving valid data.

Centralize pricing in integer rupees. Demo policy: each passenger including a child occupies one seat and pays the selected fixture fare; no unverified child/senior discount. Sum both legs. Do not hide extra seat fees.

Implement optional `DEMO10` as 10% off base fare, rounded once to nearest rupee. Document it as a fixture rule. Invalid code shows actionable feedback without preventing full-price booking; removing the voucher restores total. One code at a time.

Revalidate all required state before Proceed to payment. This is a review, not proof of issued tickets.

### S7 — Mock payment

Display total and `Demo payment — no money will be charged`. Use a mock payment method; do not collect real card/CVV/bank credentials. Pay calls a deterministic asynchronous simulator, shows processing and blocks repeated submits.

Success creates one stable demo booking reference and navigates to confirmation. Failure retains details and offers Retry. Select failure scenarios through a separate demo/developer page, not ordinary traveller controls. No payment countdown for now.

### S8 — Confirmation

Display `Demo booking confirmed`, reference, simulated payment status, all travellers/legs/seats and total. Do not claim an email was sent. Provide working Print summary with print styles and Start new booking with reset confirmation. No fake valid-travel QR codes.

Refresh does not create another booking. Direct entry without completed state shows a helpful recovery action.

## 7. State, fixtures and implementation structure

Use the repository's installed stable Next.js/React conventions, TypeScript and App Router where compatible. Reuse existing styling/test systems. No database, account service, map SDK or payment SDK is required.

Suggested state:
- Search: station IDs, outbound/return date-only values, trip type, adult/child counts.
- Legs: stable ID, train ID, departure/arrival datetime, class ID.
- Passengers: stable ID, name, category.
- Assignments: leg ID + passenger ID -> coach ID + seat ID.
- Contact, voucher, mock payment status and booking reference.
- Versioned draft and hydration status.

Use sessionStorage for fictional draft persistence across routes/refresh. Access it only client-side after hydration. Validate restored state and dates; handle malformed/old data with a recovery/reset option. Do not put personal details in URL query strings.

Changing route/date/train/class must explain and invalidate only affected downstream choices. Preserve passenger names/contact when still valid. Passenger-count changes adjust cards, totals and assignments consistently. Route guards redirect incomplete sessions to the earliest required step with an explanation.

Centralize pricing, validation, allocation, fixture lookup and state transitions in testable functions. Keep UI components separate from fixture services so future integrations can replace them.

Fixtures need multiple stations/routes and time slots, demo class prices/capacities, two coaches/class with free/sold seats, and deterministic failure cases. Generate dates relative to today so the demo works on future days. Filter past departures when searching today. Use fictional train names and explicitly simulated schedules.

Separate `/demo` controls: Reset, Normal, No results, Search error, Seat conflict, Payment failure. Document exactly how testers trigger each and restore Normal. Avoid uncontrolled random errors and keep testing controls out of the passenger flow.

## 8. Accessibility and states

- Semantic landmarks, skip link, logical headings, page titles and meaningful labels.
- Visible focus distinct from selection; move focus to new page heading after navigation and appropriate error summary/field after invalid submission.
- All comboboxes, calendar, counters, filters, cards, seat controls and dialogs work by keyboard.
- Dialog traps focus while open, Escape closes it, and focus returns to its trigger. Popovers do not trap users in automatic progression.
- Calendar supports date navigation, month changes, selected/range announcements and touch. Document limitations if a native date fallback is necessary.
- Seat accessible name includes coach, number, state, price and assignment/recommendation. Provide a text/list selection alternative if spatial traversal is difficult.
- Announce meaningful result counts, assignment updates, loading completion and errors with appropriate live regions. Avoid announcing every pointer hover.
- Seat/error states remain understandable in grayscale through words, icons and borders.
- Check 200% zoom and around 360px width. No accidental page-level horizontal scrolling; label any contained seat-map scrolling area.
- No motion-dependent functionality; train visual is static for now.

| State | Examples required |
| --- | --- |
| Default | Fields, buttons, cards |
| Focus/hover | Visible focus, consistent hover |
| Active | Pressed controls and selected card/date/seat |
| Disabled | Minimum decrement, sold seat, processing payment |
| Loading | Search and payment |
| Empty | No trains/no filter matches |
| Error | Invalid fields, seat conflict, failed payment |
| Success | Voucher accepted, seat assigned, confirmation |

Do not intentionally create defects just to populate logs. Actual checks may report no findings within their stated scope. Automated testing cannot replace the team's manual keyboard/screen-reader records or prove full accessibility conformance.

## 9. Requirement traceability and design evolution

| ID | D2 target | Response | Evidence needed |
| --- | --- | --- | --- |
| R1 | >=90% identify availability/selection meaning without legend | Direct labels/icons, recommendation separate from availability, seat sheet | Actual moderated comprehension test |
| R2 | >=90% book three adults unassisted | Counts carried forward, adult cards, complete assignments and summary | User test plus engineering three-adult test |
| R3 | Mean confidence >=4/5, nobody rates 1–2 | Class descriptions and prices | Real ratings; rank omission is an explicit limitation |
| R4 | All states distinguishable in grayscale; D2 cites WCAG 2.2 1.4.1 | Labels/icons/outlines | Grayscale inspection and team audit |
| R5 | >=90% start/find Book action within 30 seconds unassisted | Clear Search/Book controls and stepper | Timed first-time-user test |

D2 proposed at least ten first-time student users per test. Do not turn this into an invented D4 card-sort sample-size requirement, invent results, or claim the live demo proves the targets.

Document revisions from D3: upfront passenger counts reintroduced with carry-forward, class before passenger details, recommendations now preselected but editable. These are current design choices, not already validated findings.

## 10. D4 documentation and evidence files

Create `docs/d4/`. These filenames are suggested packaging, not prescribed course filenames.

| Artifact | Contents |
| --- | --- |
| `00-submission-checklist.md` | D4 items, actual path/link/version, done/pending, owner |
| `01-card-sort-kit-and-record.md` | Candidate cards, neutral instructions, blank real-user grouping/label records and evidence references |
| `02-ia-and-wireframe-flow.md` | Proposed/validated status, navigation rationale, card-sort traceability, S1–S8 arrows and error/recovery, hierarchy/Gestalt notes |
| `03-part-a-accessibility-log.md` | Real keyboard/screen-reader findings under POUR, fixed/deferred status |
| `04-critique-record.md` | Actual studio feedback, version, change decision and evidence; mark not conducted if applicable |
| `05-design-system.md` | Palette, type, spacing, components/states |
| `06-implementation-and-simulations.md` | Stack, run steps, vertical-slice rationale, scope, fixtures, assumptions, placeholders, limitations |
| `07-part-b-accessibility-recheck.md` | Each Part A issue and actual re-check evidence; revisit deferred issues |
| `08-ai-use-and-reflection.md` | Actual tool/step use, human changes/verification, personal reflection prompts |
| `09-video-and-live-demo-plan.md` | Six-segment outline, captions and live-checkpoint checklist |
| `10-engineering-validation.md` | Actual commands/results/screenshots and limitations; separate from human research |
| Part A snapshot/version | Earlier grayscale build, screenshots and flow, preserved before Part B |

Audit log columns: ID, screen/component, build version, tester/date, method/tool, steps, observed/expected behaviour, POUR category, impact, fix/defer reason, retest result and evidence. POUR means Perceivable, Operable, Understandable, Robust. Leave observations pending until actually collected.

Card-sort record: participant code, cards/groups/labels, actual evidence, synthesis decision and affected screen. Real users or stand-ins are required. Codex may prepare cards/instructions, never simulate participants as evidence.

Critique record: date, screen/version, feedback source, observation, decision, change, evidence. Do not claim studio sessions happened without records.

Distinguish automatic mocks from Wizard-of-Oz: the latter means a human secretly operates a system function. A deterministic coded simulator is not human-operated Wizard-of-Oz. Document what is implemented, simulated, a placeholder, or deferred and why.

AI-use note must record actual tools, steps, changes and verification. Leave authentic team reflections for team members: (1) What thinking stayed yours versus came from AI? (2) How did it feel to disclose AI use? One or two sentences each, graded for completion. Do not invent personal feelings.

## 11. Video and live checkpoint

Video: MP4 up to five minutes; original team narration and captions; readable interface matching the submitted version. Name `TeamNo-Designify-D4-Prototype.mp4` with the actual team number. Check permissions and keep a local playable backup. Submit with the existing LMS cutoff; no exact date is specified here.

| Time | Content |
| --- | --- |
| 0:00–0:30 | User, group-booking task and seat-confusion problem |
| 0:30–1:00 | R1/R2 and corresponding design responses |
| 1:00–3:00 | Three adults complete the core flow |
| 3:00–4:00 | Seat conflict or payment failure and recovery |
| 4:00–4:40 | Actual accessibility checks, limitations and simulated parts |
| 4:40–5:00 | Focused question: Can you tell which suggested seats are already selected for your group, and how to change them? |

The video supplements both artifact sets and the live checkpoint; it replaces neither. All team members attend and can explain the implementation/simulation decisions. Keep the working build available offline/local where practical for the checkpoint.

## 12. Engineering acceptance checks

Run configured lint/typecheck, production build and focused tests for allocation, pricing, state transitions and essential journeys. Use existing tools where available. Report actual outputs, not assumed passes.

1. Three adults one-way: search, class, names, seats, review, mock pay, confirmation; three tickets and correct total.
2. Adult + child with edits: passenger/card/count/price/seat consistency.
3. Round trip: separate train/class/seat choices for each leg, valid times and combined total.
4. Same stations or invalid dates: actionable error and no invalid navigation.
5. No results or no filter matches: reset/modify actions work.
6. Recommendations exclude sold/duplicate seats and preserve manual choices on revisit.
7. Seat conflict recovery retains unaffected assignments.
8. Valid/invalid/removed voucher produces correct totals and feedback.
9. Payment failure/retry/double click/refresh creates at most one completed booking per attempt.
10. Edit train/class invalidates stale seats/prices while preserving valid passenger data.
11. Refresh, deep link and malformed session have graceful recovery; no hydration errors.
12. Team keyboard and screen-reader walkthroughs are recorded honestly.
13. Desktop/mobile/zoom review checks controls, overflow, popover placement and seat usability.
14. Part A snapshot and green Part B remain separately reviewable.

## 13. Final submission and completion reporting

Deliver the runnable source/build with README; preserved interactive grayscale prototype and flow; working green prototype; D4 documentation/evidence files; actual engineering validation report; and video/demo preparation materials.

D4 also needs the team's completed card-sort record, manual audit/recheck, studio critique record, AI disclosure/reflections, narrated/captioned MP4, and live instructor checkpoint. Prepare templates but mark these pending when missing. Do not label the entire academic submission complete merely because coding is complete.

Final Codex response: what works, how to run both versions, exact simulated/placeholder/deferred features, tests actually run, known bugs and remaining human evidence.

## 14. Deferred final-phase backlog

Live route map/data; moving train animation; verified rank/concession rules; confirmed meaning of pink/blue accents if used; real timetable/inventory; production recommendation algorithm; real accounts/payment/seat holds/ticket issuance; optional ten-minute timer with verified expiry/recovery.

Keep components/services replaceable, but do not integrate those extras in this phase. The priority is one coherent working booking journey with honest, reviewable D4 evidence.
