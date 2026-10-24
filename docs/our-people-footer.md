# Our people and shared footer additions

## Scope

Updated the existing `/information/people` route and shared footer in the authorized checkout. The latest Our People/Footer handoff takes precedence for these additions. The existing typography, palette, homepage, booking state, pricing and test payment are retained. Careers remains the working external destination; no local Careers page was added. Nothing was deployed.

## Page and content

`src/components/people-page.tsx` is a server-rendered editorial page: photographic cover, introduction, staff feature, three leadership cards, then all five supplied biography paragraphs. There is one H1 and no booking search form. The navbar still provides booking access. `src/lib/people-content.ts` holds supplied roles, explicit image mappings, biography, photo sources and focal points. The biography receives only light grammatical cleanup; all supplied dates, qualifications, institutions, training-program names and the “more than 27 years” wording remain.

Portrait mapping, based on the supplied role filenames rather than facial identification:

| Person                    | Supplied file, unchanged                              |
| ------------------------- | ----------------------------------------------------- |
| Mr. Muhammad Hanif Abbasi | `public/images/people/federal-minister.jpg`           |
| Mr. Bilal Azhar Kayani    | `public/images/people/state-minister.jpg`             |
| Mr. Mazhar Ali Shah       | `public/images/people/secretary-(slash)-chairman.jpg` |

Portraits use consistent 4:5 windows with `contain` and individual focal settings, preserving the whole supplied image. Names and titles wrap naturally. The State Minister image is only 225 × 223 pixels; a higher-resolution replacement would improve sharpness. No portrait has been enhanced or overwritten.

## Cover and crew assets

- **Cover:** `public/images/home/destination-rawalpindi.jpg`, the existing Rawalpindi Railway Station photo. [Source](https://commons.wikimedia.org/wiki/File:Rawalpindi_Railway_Station_-_01.jpg), Rana Usman Shakoor, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). It is a temporary station cover, permitted by the handoff when a suitable wide crew photo is unavailable. Replace `peopleAssets.cover` with approved wide Pakistan Railways crew photography when available.
- **Staff:** `public/images/people/train-crew.jpg`. [Source](https://commons.wikimedia.org/wiki/File:Mohib_Ali_Assistant_Train_Driver_Pakistan_Railways.jpg), Syed.mazahirhaider, 22 March 2023, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The source identifies the subject as a Pakistan Railways assistant driver. Used as temporary editorial staff photography; no invented quote, profile or endorsement was added. Credit appears beside the photo and on the credits page.

Files remain unchanged; layout applies responsive CSS cropping to cover/staff photos. `peopleAssets` stores replacement notes and object-position settings. Update those entries and the credits when replacing photos. No required image slot is missing; an approved wide crew cover and sharper State Minister portrait are optional improvements.

## Breadcrumb architecture

`src/lib/site-routes.ts` contains the shared informational page titles and explicit breadcrumb definitions. `src/components/footer-breadcrumb.tsx` is the only new client boundary and uses App Router `usePathname`. The existing shared footer renders it immediately before the footer element, once per page.

Our people renders linked Pakistan Railways → linked About us → plain current Our people (`aria-current="page"`), inside `nav[aria-label="Breadcrumb"]` and an ordered list. Other existing information and booking routes use their own deliberate metadata. Home omits the strip consistently. Unknown paths and the unimplemented local Careers route do not inherit a misleading trail. To support Careers later, implement its page and add its title/label/parent metadata; do not change the existing external Careers links until then.

## Footer assets and exact destinations

`src/lib/footer-content.ts` holds both supplied store URLs and all four social destinations. The shared footer uses accessible external link names, new-tab descriptions, and `rel="noopener noreferrer"`. Social targets are 44 × 44px with 22px decorative SVGs; badges retain their original aspect ratio and include clear space. They wrap at narrow widths. There are no feeds, trackers, account connections, device redirects or installation actions.

| Link        | Exact destination                                                    |
| ----------- | -------------------------------------------------------------------- |
| App Store   | https://apps.apple.com/pk/app/rabta/id6446243993                     |
| Google Play | https://play.google.com/store/apps/details?id=com.easyway.ticket.app |
| Facebook    | https://www.facebook.com/pakrail.gov.pk/                             |
| X           | https://x.com/PakrailPK                                              |
| LinkedIn    | https://pk.linkedin.com/company/pakistan-railways                    |
| Instagram   | https://www.instagram.com/pakistanrailwaysofficial/?hl=en            |

Unmodified official badge sources:

- [Apple badge](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg), stored as `public/images/footer/app-store.svg`. Followed the [Apple guidance](https://developer.apple.com/app-store/marketing/guidelines/): preferred black badge first, 44px high, with 11px clear space.
- [Google Play badge](https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png), stored as `public/images/footer/google-play.png`. Original transparent clear space retained; visible badge approximately 44px high. Reviewed the [Partner Marketing Hub guidance](https://partnermarketinghub.withgoogle.com/brands/google-play/google-play/lockups-icons-badges/?folder=86642); its full page timed out during retrieval.
- Facebook, X and Instagram SVGs: [Simple Icons](https://github.com/simple-icons/simple-icons), CC0, with original license bundled. LinkedIn SVG: [Bootstrap Icons](https://icons.getbootstrap.com/icons/linkedin/), MIT, with original license bundled. No new icon package was installed. Store trademark credits appear on the existing credits page.

Both store URLs resolve to RABTA listings. LinkedIn resolves to a Pakistan Railways page. Facebook returned an access block, X returned 403 and Instagram could not be fetched; their exact supplied URLs and rendered link behavior were checked, but ownership/verification status is not asserted.

## Validation

- `npm test`: 28 passing checks (the existing 26 booking/state checks and two breadcrumb routing checks).
- `npm run typecheck`, `npm run lint` and `npm run format:check`: pass without diagnostics. `npm run build`: production compilation, type checking and generation of all 19 pages pass. Git whitespace check passes.
- Inspected all four supplied screenshots and all three original portraits as pixels before implementation. Verified the page in the browser, including cover/staff framing, all three loaded portraits, supplied name/title order and five fully expanded biography paragraphs. One H1; no search form on the informational page; no nested biography scrollbar.
- Checked desktop 1440px, tablet 768px, mobile 390px and narrow 320px. Same-origin frames provided actual CSS viewport widths because the connected browser's viewport override was ineffective in the earlier task. Three/two/one leadership columns, stacked staff content, wrapping titles/breadcrumbs and wrapping store badges fit without horizontal application overflow. Temporary responsive harness removed.
- Direct navigation, reload, browser back/forward and the breadcrumb's About us link produce the correct trail. Exactly one strip sits immediately before the shared footer, with no visual gap. Home omits it. Verified linked ancestors and plain current-page semantics.
- Keyboard-activated mobile navigation, Escape closure and focus restoration pass. Read biography reaches the expanded section. App links show the gold focus outline; social links use 44px touch targets. Existing global reduced-motion rules still apply; no new animation library or effects were introduced and no OS-level motion setting was changed.
- All six supplied external destinations match rendered href values, have accessible labels and safe new-tab attributes; both badge assets and all four SVGs decode. Store pages resolve to RABTA; social access limits are recorded above. Current official account ownership is not inferred.
- Navbar booking action reaches the homepage form, focuses departure and preserves the existing Lahore–Karachi draft, 28 October date and one-traveller count. The homepage circular Our people link opens the real local page. Both store links and all four social links also appear in the homepage footer. Booking domain and interface source are unchanged; their existing one-way/return, allocation, pricing, voucher, persistence and confirmation tests pass.
- No local Careers page, deployment, extra dependencies, tester UI or new tracking integration was added. The existing development server was reused. Screenshots are in `docs/evidence/` with `our-people-` and `people-` filenames.

These engineering checks do not establish formal accessibility conformance or replace the team's HCI assessment.
