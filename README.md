# Designify — Pakistan rail booking prototype

A responsive CS3014 D4 prototype built in this repository with Next.js App Router, React and TypeScript. Original emerald identity, guided train search, ticket-style results, class comparison, editable travellers, seats for each leg, review/vouchers, demo payment and printable confirmation.

## Run locally

Requires Node.js 22.13+ (tested with Node 24.19) and npm. No environment variables or service credentials required.

```powershell
npm ci
npm run dev
```

Open [Designify](http://localhost:3000). Use one hostname consistently; localhost and 127.0.0.1 have separate browser draft storage.

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

Run `npm start` after building, with the dev server stopped if it occupies port 3000. Another port: `npm run dev -- --port 3001` or `npm start -- --port 3001`. System fonts and bundled SVG/icons need no remote assets after installation.

## Two versions

- **Part A:** [preserved grayscale structural flow](http://localhost:3000/part-a/index.html), independent source in `public/part-a/index.html`, authored before the green application. Can also be opened directly. Includes S1–S8 and error/recovery navigation. See `docs/d4/part-a-manifest.md`.
- **Part B:** [functional green prototype](http://localhost:3000), all eight booking screens.
- **Testing:** [demo scenarios](http://localhost:3000/demo), outside the traveller flow.

IA: **Proposed — awaiting card-sort validation**. See the [D4 checklist](docs/d4/00-submission-checklist.md). Real card sorting, team keyboard/screen-reader audit and recheck, studio critique, personal reflections, narrated/captioned MP4 and live instructor checkpoint remain the team’s work. No findings or participants are invented.

## Try a booking

1. Choose Lahore Junction → Rawalpindi and a future date, then explicit One Way or a return date.
2. Set three adults → Done → Search trains. Four fictional services run on future dates; today excludes departed services in Asia/Karachi.
3. Select a train → Book this train. Returns require a second train after the outbound arrival, including overnight journeys.
4. Explicitly select class for each leg. Economy, AC Standard and Business are illustrative; Business has four available demo seats.
5. Enter fictional names and a contact email such as `demo@example.com`.
6. Suggested seats arrive selected. Choose traveller → free seat → Confirm seat to change; Cancel retains the previous choice. Coach switches preserve assignments. Text selection offers an alternative to the spatial map. Returns need seats for both legs.
7. Review details. Optional `DEMO10` takes 10% off combined base fare, rounded once. Every adult/child pays the selected class fare; no extra seat fee.
8. Proceed to payment → Pay [total] — demo → confirmation. Print summary uses the browser. Refresh keeps the reference. Start new booking asks before reset.

## Controlled scenarios

Select at `/demo`, then open the relevant booking step. **Normal** restores ordinary simulation; Reset clears the draft after confirmation.

| Scenario        | Trigger                       | Recovery                                                      |
| --------------- | ----------------------------- | ------------------------------------------------------------- |
| No results      | Open results                  | Clear filters and retry / edit journey                        |
| Search error    | Open results                  | Retry search restores Normal                                  |
| Seat conflict   | Click Review booking on Seats | Replace the affected passenger’s outbound seat; others remain |
| Payment failure | Click Pay once                | Retry succeeds with details retained                          |

For a seat conflict after a complete draft, open Seats through Edit/Back or `/booking/seats`, then Review. Generic Return to booking opens the earliest incomplete step, or Payment if all details are complete.

## Architecture and scope

`src/lib/booking.ts`: fixtures, validation, pricing, state transitions and allocation. `src/components/search-form.tsx`: guided search. `src/components/booking-app.tsx`: journey UI, guards, seats, payment and summary. `tests/booking.test.ts`: domain tests. `src/app/globals.css`: responsive and print styles.

Versioned fictional drafts use `sessionStorage` after hydration. Stale/malformed drafts recover with a message. Names/contact do not enter URLs. Each tab has its own session; this is not cross-device persistence or a real seat hold.

Six stations, four fictional services, two mock coaches per class, illustrative amenities/capacity and provisional deterministic seat suggestions. Delays/failures are coded simulation, not human-operated Wizard-of-Oz. No real account, timetable, map, inventory, payment or ticket issuance. Route map is labelled placeholder; train is static SVG. Rank 0–3, concessions, age rules, pink/blue meanings, production allocation and countdown/holds remain deferred. No real credentials, email claims or travel-valid QR.

Actual checks and limits: [engineering validation](docs/d4/10-engineering-validation.md). Automated tests and Codex browser checks do not replace the team’s accessibility findings or establish WCAG conformance.
