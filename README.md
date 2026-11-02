# Pakistan Railways

A responsive train-booking interface built with Next.js App Router, React and TypeScript. The redesigned homepage uses the supplied Pakistan Railways identity, locally served Bodoni Moda and Manrope, licensed photography, destination shortcuts and an overlapping guided booking form.

## Run locally

Requires Node.js 22.13+ and npm. Station search uses MongoDB Atlas by default; see [backend setup](docs/backend/setup.md) for server-only environment variables and the review-first import workflow. Explicit `STATION_DATA_PROVIDER=demo` enables labelled development fixtures without MongoDB.

```powershell
npm ci
npm run dev
```

Open [Pakistan Railways](http://localhost:3000). Keep one hostname: localhost and 127.0.0.1 have separate browser draft storage. Another port: `npm run dev -- --port 3001`.

```powershell
npm run typecheck
npm run lint
npm test
npm run format:check
npm run build
npm start
```

Build before running `npm start`; stop the development server first if it uses the same port. Fonts and photographs are bundled locally, so rendering does not depend on an external font or image service.

## Booking flow

1. Choose different departure and arrival stations, a departure date, and either One Way or a return date.
2. Confirm up to six travellers and search. Compare times and fares, then select a train for each leg.
3. Choose Economy, AC Standard or Business for each leg. Add fictional traveller names and a contact such as `sample@example.com`.
4. Suggested seats arrive selected. Select a traveller, a Free seat and Confirm seat to change one. Cancel preserves the previous seat. Coach switches and the text selection view preserve assignments. Return journeys need seats on both legs.
5. Review and edit the journey, group, seats and total. The existing fixture voucher `DEMO10` still applies a 10% discount, rounded once; the public interface no longer advertises tester codes.
6. Complete the clearly labelled test payment to view a printable booking summary. No money is charged, no credentials are collected, no email is sent and the summary is not valid for travel.

Station selectors now use the shared `/api/stations` catalogue endpoint. The six editorial shortcuts and existing sample services, class fixtures, pricing, allocation and return-leg validation are retained as prototype functionality. There is no live timetable, railway inventory, account service, payment integration or ticket issuance. Class amenities, capacity and photographs are illustrative. Destination shortcuts change only the arrival station and retain the origin, dates and passenger counts; choosing the origin as a destination shows validation feedback.

Drafts remain in this tab's versioned `sessionStorage`. Existing storage keys and passenger data are preserved. Retired tester scenarios are normalized to ordinary booking state when restored. `/demo` and `/part-a/index.html` redirect to the homepage. The separately preserved academic wireframe remains at `academic/part-a/index.html` and can be opened offline; it is not linked or served as a customer mode.

## Maintain the homepage

- Replace the temporary hero at `public/images/home/train-hero.jpg`, or update its path and focal point in `src/lib/home-content.ts`. The same image is currently used in the rail-experience tile, whose path can be changed independently.
- All destination and class photo paths, alternative text and focal points are centralized in `src/lib/home-content.ts`. Update the credits page and `references/home-asset-downloads.json` when replacing a photograph.
- The supplied `public/logo.png` is used without alteration. `public/logo-full.png` is also preserved. Typography uses local files in `public/fonts/`, with their SIL Open Font Licenses included.
- Homepage components live in `src/components/homepage.tsx`, `home-experience.tsx`, `site-header.tsx` and `site-footer.tsx`. Shared styling is in `src/app/marketing.css`; existing booking layouts remain in `src/app/globals.css`.
- Informational links open implemented local pages. Careers opens our local database-backed notices page. Unverified contact details, social accounts and railway policy text have not been invented.

See `docs/ui-refresh.md` for implementation choices, validation and image replacement notes. Image attribution is also accessible from the website footer.

The Our people page and shared footer additions are documented in `docs/our-people-footer.md`, including exact portrait mappings, temporary photography, breadcrumb route metadata, RABTA links and social icon sources.

Backend model, imports and booking boundaries: [setup guide](docs/backend/setup.md). Public source observations: [reference inspection](docs/backend/reference-inspection.md). The first six public station records were imported into Atlas after explicit approval; catalogue indexes and live station API checks are verified.

Careers is implemented at `/careers`, backed by 295 imported official notices. See [Careers setup and verification](docs/backend/careers.md) for commands, source coverage and limitations.
