# Careers import and page

The local `/careers` page uses the existing Atlas connection and `careerNotices` collection. It shares the Our people cover component, fonts, colors, header and footer. Homepage, footer and sitemap Careers links now use the local route. Breadcrumb metadata supports direct loads and back/forward navigation.

## Completed import

On 2 November 2026 (Asia/Karachi), all 20 pagination pages discovered from https://www.pakrail.gov.pk/Career.aspx were processed: 296 source rows, 295 distinct valid notices, one identical duplicate skipped, zero invalid rows and zero failed pages. Actual Atlas persistence confirmed 295 inserted records. A second actual import reported 295 unchanged and zero inserts or failures. Two existing notices were subsequently updated to distinguish their genuine external application links from PDF advertisements; no new records were created. Final dry-run: 295 unchanged, zero inserts or updates.

The verification report confirms 295 stored unique source keys and 295 content hashes matching the corrected extraction. Five representative stored rows were compared field-by-field with captured source rows. Both application links were separately checked in the rendered page. Four representative advertisement URLs returned HTTP 200 and application/pdf. Other PDF files were not individually downloaded or mirrored. Source descriptions, combined department/location text, raw and normalized dates, source URLs and advertisement links are retained. Native Node TLS could not complete the source certificate chain on this host; the Windows HTTPS client succeeded with normal certificate validation enabled.

As of this check, status counts are 5 within deadline, 287 closed, 3 without a deadline and 0 withdrawn. Status is computed at query time; date-only deadlines remain eligible through their Asia/Karachi calendar day. No notice is labelled new because of its import date. Future deadlines do not guarantee an external portal is accepting applications.

## Commands

Run from the repository root with the existing ignored environment configuration:

```powershell
npm run careers:import
node --import tsx scripts/careers.ts --apply
node --import tsx scripts/careers.ts --snapshot .local/careers/crawl.json --dry-run
node --import tsx scripts/careers-verify.ts
npm run dev
```

Default import mode is dry-run. `--apply` explicitly enables upserts. `--max-pages 100` sets a safety limit; reaching it reports incomplete coverage. Snapshots and captured HTML are ignored under `.local/careers/`. Snapshot import reuses captured data rather than claiming a fresh source fetch. Windows certificate-chain fallback requires `pwsh`; neither transport disables TLS validation. Crawling is sequential, paced, bounded by timeouts and three attempts, and follows actual official Careers links. Missing/repeated pages are reported. Partial failures never delete existing notices. Source keys include document URLs, heading, organization and posted-date text; ambiguous identity conflicts are reported rather than merged by title. Changed source identity attributes require review.

## Verification

66 tests passed, including parser preservation, duplicate headings, unsafe links, invalid dates, pagination loops/limits, partial fetch/write preservation, repeat upserts, application-link classification and Karachi deadline boundaries. Typecheck, lint and formatting passed. Browser checks covered search/status combinations, accurate totals, pagination, out-of-range redirects, full disclosures, keyboard controls, homepage/footer links and breadcrumb back/forward behavior. Layouts at 320px, 390px and 768px had no horizontal overflow. Empty collection was checked using a separate read-only namespace; database error and Retry were checked with invalid process-local configuration. The real collection was never cleared. No application submission, deployment or scheduled scraping was added.

Machine-readable source coverage, persistence counts, samples and link checks are in `careers-import-report.json`. A final extra read-only verification retry was blocked by the approval-review usage limit; it did not execute or change data. Previously completed verification results remain recorded.
