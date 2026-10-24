# Pakistan Railways UI refresh

## Scope and precedence

Implemented the General UI Addendum before the Homepage Handoff and original Website Features/UI Brief. The user's direct authorization selected this checkout, superseding the older document's restriction on editing it. The first implementation change removed public Wireframe/demo presentation, followed by the homepage redesign. Academic source files were preserved offline.

The public brand is Pakistan Railways. Package identifiers and storage keys are unchanged to avoid breaking the existing application. Saved tester scenarios no longer reactivate tester views; booking state and references are retained. Dedicated old presentation URLs redirect home.

## Design and interaction

- Deep green header: 94px desktop, 74px phone, supplied mark with readable HTML wordmark, gold underline and outlined booking action. Tablet/phone navigation uses a native modal dialog with Escape and focus restoration.
- Bodoni Moda marketing headings and italic hero line; Manrope interface/body. Both are local variable fonts with included SIL licenses and swap/fallback behavior.
- Main colors: green `#146B4A`, hover `#0F553A`, deep green `#12392C`, soft green `#E6EFE8`, ivory `#F5F2EB`, sand `#ECE6DA`, surface `#FFFDFA`, gold `#C79C52`, text `#1E2C25`, muted `#59645C`. Footer `#172A24` with ivory text.
- Photographic hero, directional contrast overlay, exact two-line headline and a working Plan your journey action. It focuses departure without changing the booking. The guided search overlaps the hero by 68px desktop and 20px phone.
- Six destination cards map to station IDs already in this application. They preserve origin, dates and group size; identical origin/destination receives feedback. Station-directory links support the same destination-only selection after navigation.
- The class mosaic adapts to the three actual classes rather than introducing unsupported classes. Each opens a details dialog. Its booking action focuses the search; class selection still follows train selection in the working flow.
- About links use circular photographic crops. Our people opens local editorial information; Careers opens the official site with an external indicator. A four-column footer links to meaningful local guidance, directory, sitemap and image credits.
- Static homepage content stays server-rendered. Only navigation, dialogs, image fallback and the existing booking widget need client behavior. Images use Next Image and centralized focal points.
- Hover/underline/image transitions use CSS. Reduced-motion preferences disable transitions and smooth scrolling. No autoplay, background animation or scroll interception was added.

## Resources actually used

Reviewed current official resources: [Anime.js](https://animejs.com/documentation/), [React Bits](https://reactbits.dev/) and [shadcn/ui Sheet](https://ui.shadcn.com/docs/components/sheet). Existing native dialogs, CSS and Lucide icons met this design's needs; no animation/component library was installed or represented as integrated.

Read the installed Next.js guides for fonts, images, navigation and metadata before implementation. Consulted the supplied search/calendar screenshots and the official Emirates homepage for the requested visual direction.

Footer external source: [Pakistan Railways careers](https://pakrail.gov.pk/Career.aspx), verified through current primary-source search results. Direct requests to other official railway pages timed out; no guessed Ministry/contact/policy/social links were added. Local help explains the implemented booking behavior, not official railway policy.

## Photography

All photographs are temporary, locally bundled and credited on `/information/credits` and in `references/home-asset-downloads.json`. Wikimedia photos use the listed Creative Commons licenses; Pexels photos use the Pexels license. Responsive CSS cropping is applied; downloaded files otherwise remain unchanged.

The hero is a heritage photograph of Khyber railway travel in 1993 and is labelled as heritage. It does not assert that this route or vehicle is a current bookable service. Class interiors and the workplace photo are illustrative foreign railway photographs; both the homepage and credits disclose that they are not verified Pakistan Railways facilities/employees.

Replace `public/images/home/train-hero.jpg` with the user's final hero, or change `homeAssets.hero` in `src/lib/home-content.ts`. Set its `position` to the desired CSS object-position. The experience tile has a separate asset entry even though it currently shares this photograph. Update alt text, credits and the manifest with each replacement. Ideally replace the illustrative workplace image with approved Pakistan Railways staff photography.

## Verification

Automated domain checks cover booking validation, allocation, manual seat changes, capacity, return timing, pricing, vouchers, persistence and confirmation. Added focused checks for destination-only updates, unsupported station IDs, same-origin validation and retirement of tester scenarios without data loss.

Final automated outcomes: 26 tests pass; TypeScript and ESLint pass without diagnostics; production build generates all 19 pages successfully. Formatting and Git whitespace checks pass.

Browser checks completed:

- Layouts at 1440, 768, 390 and 320px; no horizontal application overflow. The browser viewport override did not resize the connected surface, so these sizes were tested in same-origin frames with real CSS viewports. The temporary frame harness was removed after verification. Evidence images are in `docs/evidence/`.
- Mobile navigation opens, closes, navigates to sections and restores focus on Escape. Class dialogs open and restore focus on Escape. Hero and header booking actions reach and focus the existing form.
- Guided station selection, phone calendar and passenger controls remain usable. Desktop one-way and phone return searches complete. Destination cards and station-directory links retain origin, dates and passenger counts, including an adult/child return group. Same-origin destinations show feedback.
- One-way booking with two adults: train, AC Standard, fictional names/contact, manual seat change, voucher total PKR 6,912, test payment and confirmation. Confirmation/reference survives refresh.
- Return booking at 320px: one adult/one child, outbound Economy, return AC Standard, suggested seats on both legs, total PKR 13,760, test payment and two journey summaries.
- A further one-way run verified changing destination after confirmation and refreshing retains the edited destination, origin and date. Added a regression check that the resulting editable draft also retains passenger/contact data, seats, legs and reference; it no longer fails restoration because of its former paid status.
- All 11 photo assets decode in the browser. Credits are linked from the footer. Local fonts render correctly. Key solid-color contrast pairs measure 5.52:1 or higher (body muted text, green controls/links, gold text variant and footer text); photographic overlays were visually checked.
- Retired `/demo` redirects home. The offline academic wireframe has the same Git blob hash as its original public file. No public control restores the retired views. Reduced-motion CSS and the explicit booking-scroll preference were inspected; no separate OS-level reduced-motion browser emulation was available.

These engineering checks do not establish a formal accessibility conformance claim or replace the team's HCI research and assessment.
