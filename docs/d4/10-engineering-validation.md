# Engineering validation — B.1

Executed by Codex on 24 October 2026 in the supplied Windows repository. These are engineering results, **not** the team’s card-sort findings, manual accessibility audit, user-test outcomes or WCAG conformance evidence.

## Environment and commands

Node 24.19.0, npm 11.17.0; locked Next.js 16.4.3, React/React DOM 19.3.1, TypeScript 5.9.3. `package-lock.json` is included for reproducible `npm ci`. No service credentials or environment file.

| Command                            | Actual outcome                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `npm install --no-audit --no-fund` | Installed successfully; initial registry metadata lookup hit sandbox DNS restrictions, installation itself completed                 |
| `npm run typecheck`                | Passed, exit 0                                                                                                                       |
| `npm run lint`                     | Passed, exit 0                                                                                                                       |
| `npm test`                         | 21 passed, 0 failed; Node test runner through tsx                                                                                    |
| `npm run build`                    | Production compilation, TypeScript and generation of all routes passed; final repeat after metadata/focus refinements recorded below |
| `npm run format:check`             | Final check result recorded below                                                                                                    |
| `git diff --check`                 | Passed; Git notes normal LF→CRLF conversion on Windows                                                                               |

Unit coverage: Karachi date arithmetic and malformed dates; required/identical stations; explicit trip choice; group limits; unique available contiguous allocation; deterministic fallback and disclosure when split; manual-seat preservation; atomic rejection of sold/duplicate choices; both-leg pricing; voucher add/remove and rounding; equal child fixture fares; passenger removal on both legs; affected-leg class invalidation; capacity guards; stale route/date guards; overnight return timing; conflict recovery; two coaches per class; precise passenger/email validation; corrupt/old draft recovery; stable completed reference requirements.

## Browser checks actually performed

Used the Codex in-app browser against the localhost development server. The server required running outside the restricted shell sandbox to expose its loopback socket. No site was deployed and no external railway/payment service was contacted.

| Check                             | Observed outcome                                                                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guided station selection          | Typed Lahore/Rawalpindi into combobox and committed using Enter; arrival and then calendar opened                                                                                         |
| Three adults one way              | 25 Oct 2026, Mehran Explorer, Economy; three named fictional travellers, contact, assigned seats, review, payment and confirmation                                                        |
| Seat cancellation/change          | Confirmed A4 for Traveller 1; opening A6 and cancelling retained A4; other assignments remained                                                                                           |
| Voucher                           | Base PKR 7,200; DEMO10 removed PKR 720; payment total PKR 6,480                                                                                                                           |
| Payment failure/retry             | Controlled first failure showed actionable no-charge feedback with details retained; double-clicked Retry reached one confirmation                                                        |
| Refresh                           | Reference DFY-3F9BDC60 stayed identical after confirmation reload                                                                                                                         |
| Adult + child, round trip         | 25 Oct outbound Economy / 26 Oct return AC Standard; separate trains/classes/seats; total PKR 13,760; four traveller-leg tickets on confirmation                                          |
| Traveller removal / Undo          | Removed populated child card and restored it with Undo; name/type/count recovered                                                                                                         |
| Seat conflict                     | First Review released only the adult’s actual outbound seat A1; Sold state, replacement prompt, child and both return seats retained; A3 replacement continued to review and confirmation |
| Mobile width                      | Results, seats and round-trip confirmation at a 360×800 viewport; document scrollWidth 345px, within viewport; seat map scrolling contained in labelled region                            |
| Seat text alternative             | Text selection displayed available seats with coach, number, owner/Free and fare                                                                                                          |
| Direct confirmation without draft | Redirected to Search and displayed “Complete search before continuing. Your valid details are saved.”                                                                                     |
| Part A                            | Independent grayscale HTML loads; S2 → no-results error branch → Retry returned to S2                                                                                                     |

Screenshots in `evidence/`: mobile round-trip confirmation, preserved Part A search, and final desktop homepage. These illustrate checked versions; they are not participant or human accessibility findings.

## Corrections and verification limits

Engineering checks caught and fixed: heading focus being reset by field edits; syntax/type errors during authoring; recommendation badges staying on manual choices; conflict handling marking a fixed seat rather than the actual lost seat; paid-reference edits; recovery messages being consumed twice in development Strict Mode; route-specific page titles. No known blocking defect remains in the two completed browser journeys within this checked scope.

Browser tooling occasionally timed out while development files were recompiling. Fresh state inspection verified subsequent successful actions. These tooling failures are not reported as successful interaction checks. Automated invariant tests cover overnight timing, malformed storage and class invalidation; those are not claimed as additional completed browser journeys.

Still pending: the team’s full keyboard-only walkthrough, actual screen-reader announcements, 200% browser zoom review, grayscale comprehension with users, cross-browser/touch-device coverage, real card sort, studio critique, narrated/captioned video and live instructor checkpoint. No real Part A findings were supplied, so no personal audit fixes can be marked carried forward. Browser session storage is required for persistence across page reloads; no cross-tab/device state or production booking guarantee exists.

The final build encountered a Windows sandbox `EPERM` creating a generated `_not-found` cache directory. Repeating the build outside that restriction passed with exit 0, including all 11 generated pages. After the final search refinements, the production build passed again (exit 0), including TypeScript and all 11 pages. Formatting passed with exit 0. A browser check confirmed that changing a previously committed one-way departure preserved One Way, closed the calendar and returned focus to the departure trigger instead of restarting the guided sequence.
