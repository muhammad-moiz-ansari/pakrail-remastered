import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CAREERS_SOURCE,
  canonicalCareerPage,
  careerHref,
  careerIdentity,
  careerQuery,
  careerStatus,
  parseCareerDate,
  safePublicUrl,
} from "../src/lib/careers";
import { parseCareersPage } from "../src/lib/careers-parser";
import { crawlCareers } from "../src/lib/careers-crawl";
import { applyCareerImport } from "../src/server/careers-store";
import type { Db } from "mongodb";

const fixture = readFileSync("tests/fixtures/careers-source-rows.html", "utf8");
test("actual listing sample preserves repeated headings as distinct notices and full instructions", () => {
  const page = parseCareersPage(fixture, CAREERS_SOURCE);
  assert.equal(page.rawRows, 3);
  assert.equal(page.notices.length, 3);
  assert.equal(page.issues.length, 0);
  assert.equal(new Set(page.notices.map((n) => n.title)).size, 1);
  assert.equal(new Set(page.notices.map((n) => n.sourceKey)).size, 3);
  assert.match(page.notices[0].description, /National Job Portal/);
  assert.equal(
    page.notices[0].departmentLocationRaw,
    "Divisional Superintendent Office Quetta",
  );
  assert.equal(page.notices[0].closingDate, "2026-11-11");
  assert.equal(
    page.notices[0].advertisements[0].url,
    "https://www.pakrail.gov.pk/images/careers/QuettaPakistanRailwayAdvertisement.pdf",
  );
  assert.deepEqual(page.pagination, [`${CAREERS_SOURCE}?pno=2`]);
});
test("raw invalid dates remain available and safe URLs exclude executable destinations", () => {
  assert.equal(parseCareerDate("31 February, 2026"), null);
  assert.equal(parseCareerDate("Not provided"), null);
  assert.equal(parseCareerDate("6 November, 2026"), "2026-11-06");
  assert.equal(parseCareerDate("01/02/2026"), null);
  const page = parseCareersPage(
    fixture
      .replaceAll("11 November, 2026", "Date to be announced")
      .replaceAll('href="images/careers/', 'href="javascript:'),
    CAREERS_SOURCE,
  );
  assert.equal(page.notices[0].closingDate, null);
  assert.equal(page.notices[0].closingDateRaw, "Date to be announced");
  assert.equal(page.notices[0].advertisements.length, 0);
  assert.ok(page.issues.length > 0);
  assert.equal(safePublicUrl("data:text/html,hello"), null);
  assert.equal(safePublicUrl("https://user:secret@example.com/a"), null);
});
test("date-only deadlines last through their Karachi calendar day, with explicit times respected", () => {
  const notice = {
    withdrawn: false,
    closingDate: "2026-11-02",
    explicitClosingInstant: null,
  };
  assert.equal(
    careerStatus(notice, new Date("2026-11-02T18:59:59Z")),
    "within-deadline",
  );
  assert.equal(
    careerStatus(notice, new Date("2026-11-02T19:00:00Z")),
    "closed",
  );
  assert.equal(careerStatus({ ...notice, closingDate: null }), "unknown");
  assert.equal(careerStatus({ ...notice, withdrawn: true }), "withdrawn");
  assert.equal(
    careerStatus(
      { ...notice, explicitClosingInstant: "2026-11-02T12:00:00+05:00" },
      new Date("2026-11-02T07:00:01Z"),
    ),
    "closed",
  );
});
test("careers search parameters are bounded, single valued, and pagination retains filters", () => {
  assert.deepEqual(careerQuery({}), { q: "", status: "all", page: 1 });
  assert.throws(() => careerQuery({ q: ["one", "two"] }));
  assert.throws(() => careerQuery({ q: "x".repeat(121) }));
  assert.throws(() => careerQuery({ status: "open" }));
  assert.throws(() => careerQuery({ page: "0" }));
  assert.equal(
    careerHref("IT & HR", "closed", 2),
    "/careers?q=IT+%26+HR&status=closed&page=2",
  );
});
test("pager canonicalization follows only official careers links and prevents aliases/loops", () => {
  assert.equal(
    canonicalCareerPage("http://pakrail.gov.pk/Career.aspx?pno=2"),
    `${CAREERS_SOURCE}?pno=2`,
  );
  assert.equal(canonicalCareerPage("/Career.aspx?pno=1"), CAREERS_SOURCE);
  assert.equal(
    canonicalCareerPage("https://other.example/Career.aspx?pno=2"),
    null,
  );
  assert.equal(canonicalCareerPage("/Career.aspx?pno=2&pno=3"), null);
});
test("repeated page content is reported as incomplete instead of counted as more genuine notices", async () => {
  const result = await crawlCareers(async () => fixture, {
    pause: async () => undefined,
  });
  assert.equal(result.report.complete, false);
  assert.equal(result.notices.length, 3);
  assert.equal(result.report.pagesSucceeded, 2);
  assert.equal(result.report.duplicates, 3);
  assert.match(result.report.pagesFailed[0].reason, /Repeated listing/);
});
test("failed later page preserves the earlier genuine notices and reports bounded retries", async () => {
  let attempts = 0;
  const result = await crawlCareers(
    async (url) => {
      if (url.includes("pno=2")) {
        attempts++;
        throw Error("Network unavailable");
      }
      return fixture;
    },
    { pause: async () => undefined },
  );
  assert.equal(attempts, 3);
  assert.equal(result.notices.length, 3);
  assert.equal(result.report.complete, false);
  assert.equal(result.report.pagesFailed.length, 1);
});
test("safety limit is an explicit incomplete crawl", async () => {
  const result = await crawlCareers(async () => fixture, {
    pause: async () => undefined,
    maxPages: 1,
  });
  assert.equal(result.report.safetyLimitReached, true);
  assert.equal(result.report.complete, false);
});
test("identical duplicate rows are skipped; distinct re-advertisements remain distinct", async () => {
  const sourceRow = fixture.match(/<tr>[\s\S]*?<\/tr>/g)![1];
  const duplicate = fixture.replace("</tbody>", `${sourceRow}</tbody>`);
  // Page 2 carries a new posted date: same headline is a separate advertisement.
  const page2 = fixture
    .replaceAll("27 October, 2026", "28 October, 2026")
    .replaceAll("pno=2", "pno=1");
  const result = await crawlCareers(
    async (url) => (url.includes("pno=2") ? page2 : duplicate),
    { pause: async () => undefined },
  );
  assert.equal(result.report.complete, true);
  assert.equal(result.notices.length, 6);
  assert.equal(result.report.duplicates, 1);
});
test("idempotent upserts and failed partial imports never delete existing notices", async () => {
  const notices = parseCareersPage(fixture, CAREERS_SOURCE).notices;
  const records = new Map<string, Record<string, unknown>>();
  let shouldFail = false;
  const collection = {
    createIndexes: async () => [],
    find: () => ({ toArray: async () => [...records.values()] }),
    countDocuments: async () => records.size,
    updateOne: async (
      filter: { sourceKey: string },
      update: {
        $set: Record<string, unknown>;
        $setOnInsert?: Record<string, unknown>;
      },
    ) => {
      if (shouldFail && filter.sourceKey === notices[1].sourceKey)
        throw Error("Simulated write failure");
      const before = records.get(filter.sourceKey);
      records.set(filter.sourceKey, {
        ...(!before ? update.$setOnInsert : {}),
        ...before,
        ...update.$set,
      });
      return { upsertedCount: before ? 0 : 1 };
    },
  };
  const db = { collection: () => collection } as unknown as Db;
  const first = await applyCareerImport(db, notices);
  assert.equal(first.counts.inserted, 3);
  const second = await applyCareerImport(db, notices);
  assert.equal(second.counts.unchanged, 3);
  assert.equal(records.size, 3);
  shouldFail = true;
  const partial = await applyCareerImport(db, notices);
  assert.equal(partial.counts.failed, 1);
  assert.equal(records.size, 3);
});

test("source application links are labelled separately without changing legacy notice identity", () => {
  const html = fixture.replace(
    "</p>",
    '<a href="https://njp.gov.pk/login.php">Click here to apply online</a></p>',
  );
  const notice = parseCareersPage(html, CAREERS_SOURCE).notices[0];
  assert.equal(notice.advertisements.length, 1);
  assert.equal(
    notice.applicationLinks?.[0].url,
    "https://njp.gov.pk/login.php",
  );
  const legacyIdentity = careerIdentity({
    ...notice,
    advertisements: [...notice.advertisements, ...notice.applicationLinks!],
  });
  assert.equal(notice.sourceKey, legacyIdentity);
  assert.equal(safePublicUrl(""), null);
});
