# Part B design system

Original emerald travel identity, restrained white cards, compact booking controls and a static native SVG train illustration. System fonts keep the build usable without remote assets. Use the supplied screenshots for component hierarchy, not foreign brand content.

| Token                       | Value / use                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Primary / hover / pressed   | `#087F5B` / `#066649` / `#064E3B`                                                                                                        |
| Soft selected / range       | `#E8F5EE`                                                                                                                                |
| Background / surface        | `#F6F8F7` / `#FFFFFF`                                                                                                                    |
| Text / muted                | `#172B24` / `#52635B`                                                                                                                    |
| Essential control / divider | `#718079` / `#D5DED9`                                                                                                                    |
| Error / warning / focus     | `#B42318` / `#92400E` / `#064E3B`                                                                                                        |
| Typography                  | Segoe UI, Arial, sans-serif; task titles 28–32px; section titles 20–24px; body/control baseline 16px; compact supporting metadata varies |
| Spacing                     | 4 / 8 / 12 / 16 / 24 / 32 / 48px, with compact metadata spacing                                                                          |
| Geometry                    | Approx. 1200px content width; cards 10–12px radius, controls 6–8px; visible focus outline with offset                                    |

| Component        | States / behaviour                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Button / Input   | Default, hover/focus, pressed, disabled; invalid feedback linked to fields                                 |
| StationCombobox  | Filtered options, arrow/Enter selection, empty message, Escape dismissal                                   |
| DateRangePicker  | Departure/return modes, date arrows, previous/next months, disabled past dates, range focus/hover, One Way |
| PassengerCounter | Adult minimum one, total demo maximum six, disabled decrement/increment, explicit Done                     |
| Stepper          | Current/completed/disabled future steps; visible labels                                                    |
| TrainCard        | Radio selection, focus outline, separate details, selected border, loading/empty/error recovery            |
| ClassCard        | Comparison, explicit Select, selected check, capacity feedback                                             |
| PassengerCard    | Stable IDs, field errors, add/edit/remove, Undo                                                            |
| SeatButton       | Free outline; Sold grey/cross; Selected owner/check; suggested star separate from availability             |
| Dialog           | Seat details, confirm/cancel, Escape, trapped focus, return to trigger                                     |
| BookingSummary   | Per-leg context, all-traveller base fare, voucher reduction, total                                         |
| Alert            | Text and icon, live status/error announcements                                                             |
| MapPlaceholder   | Endpoints, abstract schematic line, required future-map wording; no zoom controls                          |

White on primary calculates to about 5:1, as stated by the supplied brief. That pair alone is not an accessibility audit. The team must evaluate rendered combinations, text size, zoom, interaction and assistive technology in its own logs.
