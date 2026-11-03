# Phase 4 — Photo gallery

Phase 3's actual hosted checkout/payment-card flow was explicitly deferred by the user on 3 November 2026. No successful checkout transaction is claimed. Phase 5 (route map) has not been started.

## Implementation and data choice

`/gallery` uses the shared site shell, local navigation/footer/sitemap links and the route-aware `Pakistan Railways > Gallery` breadcrumb. Six genuine railway photographs cover five nonempty categories. No generated images or illustrative foreign train interiors are included.

`src/lib/gallery.ts` is the single curated metadata source, following the existing `home-content.ts` pattern. For six bundled, noneditable editorial photographs, this avoids a new database dependency, seeds and synchronization with the static asset bundle. The handoff explicitly permits this pattern. No database writes were made or required for this phase. Stable IDs, publication flags, ordering, dimensions, focal points, original URLs, credit, licence and permission notes are retained. Unpublished records are filtered out; missing images have a descriptive placeholder rather than an unrelated substitute.

Original files for four new photographs are bundled under `public/images/gallery/`; two existing home assets are reused in place. Next Image serves responsive compressed versions, with lazy grid loading, reserved aspect ratios and a larger rendition requested only when the viewer opens. The reused Khyber asset is 1280 × 864, not the Commons original's 3000 × 2024. New original files remain unchanged; display derivatives retain the original CC licence. No download runs on normal page requests. Metadata and asset hashes are checked for duplication.

Native modal dialog supplies browser focus containment. Close, Escape and backdrop dismissal restore focus and the prior body overflow. Previous/next and left/right arrows stay within the active category, with disabled boundary buttons. Controls are at least 44px. No swipe gesture or autoplay is required or added.

## Primary official source inspection / permission limitation

Inspected on 3 November 2026 using the rendered browser because the text-fetch service timed out. The official index lists 12 albums on one index page. Relevant rendered albums inspected:

- [Trains](https://pakrail.gov.pk/Gallery/Trains-49.aspx): Khyber Steam Safari (caption: 1995), Bolan Khojak, Jaffer Express, Royal Train. Full-image links are provided separately from 300 × 200 thumbnails. Example candidate: https://pakrail.gov.pk/images/gallery/Large_KhyberSteamSafari1995.jpg . Do not conflate this with the licensed 1993 Commons photograph used here.
- [Railway stations](https://pakrail.gov.pk/Gallery/RAILWAY-STATIONS-45.aspx): Lahore (caption: 1886), Landi Kotal (1975), Karachi/Bander Road (1933), Rawalpindi.
- [Railway bridges](https://pakrail.gov.pk/Gallery/Railway-Bridges-51.aspx): Attock, Baot, Lansdowne, Sukkur. Example candidate: https://pakrail.gov.pk/images/gallery/Large_Attockbridgeoverriverindus.jpg .

The pages state “All Rights Reserved”. The linked [Terms and Conditions](https://pakrail.gov.pk/TermsAndConditions.aspx) were inspected in the browser and concern booking/refunds; they do not grant photo reuse. No photographer permission or reusable image licence was found. These official candidates remain **permission-review/replacement pending**, are not downloaded, hotlinked or published in our grid, and their full-resolution dimensions are not claimed as verified. Obtain permission (including credit and derivative/cropping rights) or identify a licensed identical original before adding one. This is a rights limitation, not a claim that the official gallery was inaccessible. The page links to the official gallery for further viewing.

## Published photo sources

| ID | Source / creator | Licence | Local dimensions | Notes |
| --- | --- | --- | --- | --- |
| khyber-1993 | [KhyberRailway 01](https://commons.wikimedia.org/wiki/File:KhyberRailway_01.jpg), MaltaGC | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | 1280 × 864 | Existing asset. December 1993 charter, explicitly historical. |
| rawalpindi-station-2016 | [Rawalpindi station](https://commons.wikimedia.org/wiki/File:Rawalpindi_Railway_Station_-_01.jpg), Rana Usman Shakoor | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | 1200 × 800 | Existing asset. 2 October 2016. |
| pakistan-train-2008 | [Pakistan Railway Train](https://commons.wikimedia.org/wiki/File:Pakistan_Railway_Train.jpg), Farhan / Fantaz | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | 2592 × 1944 | Commons confirms reviewed Flickr licence. 5 April 2008; service not guessed. |
| hangu-bridge-2003 | [Railway bridge, Hangu](https://commons.wikimedia.org/wiki/File:Railway_bridge,_Hangu,_Pakistan.jpg), franek2 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | 2816 × 2120 | Commons confirms reviewed Panoramio licence; source dates it 3 January 2003. |
| lahore-station-2015 | [Lahore railway station](https://commons.wikimedia.org/wiki/File:Lahore-railway-station.jpg), Joe mon bkk | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | 3264 × 1840 | 9 February 2015. |
| lahore-preserved-engine-2012 | [Pakistan Railways headquarters 2](https://commons.wikimedia.org/wiki/File:Pakistan_Railways_headquarters_2.jpg), Khalid Mahmood | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | 4608 × 3072 | Preserved former Kalabagh–Bannu Railway engine, 27 December 2012. |

Each source page's creator, description, date and licence were read, then the downloaded/local image subject and dimensions inspected. Responsive cropping/compression is disclosed in the viewer. Historical photographs do not promise present-day operations or facilities. All reference files remain unchanged.

## Verification

- `npm test`: 108 passed, including asset existence/hash uniqueness, source/permission metadata, hidden-record/category filtering, empty filter results and exact Gallery breadcrumb checks. Existing booking, passenger, coach, ticket and payment tests remain passing.
- `npm run typecheck`, `npm run lint`, `npm run format:check`, `git diff --check`: passed.
- Production `next build`: passed; `/gallery` is prerendered. Build-only Mongo environment values were deliberately disabled to avoid database access during build; local credentials were not changed.
- Real browser checks: all six local image subjects inspected; images render through Next Image. Stations gives two photos; Bridges/Heritage each give one. First/last controls disable correctly, navigation stays within the active filter, arrow keys work, internal controls keep the viewer open, Escape/close/backdrop dismiss, body scrolling returns and focus returns to the opening photo. Tab/Shift+Tab wrap between viewer controls.
- Layout measured at 320, 390, 768 and 1024px, plus normal desktop width: one/two/three grid columns as appropriate, no horizontal page overflow, compact desktop header has no overlapping controls. At 320px the viewer fits the screen and its close/previous/next buttons are all 44px high. Narrow-screen screenshots inspected for caption and credit readability.
- Gallery navigation/footer/breadcrumb and sitemap links verified in rendered output; photo source and licence URLs match the source pages inspected above.
- No actual checkout transaction, physical touch-device test or forced broken-image browser test was performed. Touch-sized buttons were checked with pointer interaction at mobile dimensions; swipe is intentionally absent. Missing-image handling is implemented but its failure path was not induced in the browser. The pure empty-filter case is covered by tests.

Suggested commit: `feat(gallery): add credited railway photos and accessible viewer`
