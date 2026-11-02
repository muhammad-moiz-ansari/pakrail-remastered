import { loadEnvConfig } from "@next/env";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { database, closeDatabase } from "../src/server/db/mongodb";
import { careerStatus, StoredCareerNotice } from "../src/lib/careers";
import { parseCareersPage } from "../src/lib/careers-parser";
loadEnvConfig(process.cwd());
async function main() {
  const crawl = JSON.parse(await readFile(".local/careers/crawl.json", "utf8"));
  const db = await database();
  const rows = await db
    .collection<StoredCareerNotice>("careerNotices")
    .find({})
    .toArray();
  const keys = new Set(rows.map((n) => n.sourceKey));
  assert.equal(keys.size, rows.length);
  assert.ok(rows.length >= 20);
  const expectedHashes = new Map(
    crawl.notices.map((n: StoredCareerNotice) => [n.sourceKey, n.contentHash]),
  );
  const matched = rows.filter((n) => expectedHashes.has(n.sourceKey));
  assert.equal(matched.length, expectedHashes.size);
  assert.ok(
    matched.every((n) => n.contentHash === expectedHashes.get(n.sourceKey)),
  );
  const samples = [];
  for (const page of [1, 7, 20]) {
    const source = `https://www.pakrail.gov.pk/Career.aspx${page === 1 ? "" : `?pno=${page}`}`;
    const expected = parseCareersPage(
      await readFile(`.local/careers/pages/page-${page}.html`, "utf8"),
      source,
    ).notices;
    for (const notice of page === 1
      ? expected.slice(0, 3)
      : page === 7
        ? expected.filter((n) => n.applicationLinks?.length)
        : expected.slice(-1)) {
      const stored = rows.find((n) => n.sourceKey === notice.sourceKey);
      assert.ok(stored);
      for (const field of [
        "title",
        "description",
        "departmentLocationRaw",
        "postedDateRaw",
        "closingDateRaw",
        "postedDate",
        "closingDate",
        "advertisements",
        "applicationLinks",
        "contentHash",
      ] as const)
        assert.deepEqual(stored[field], notice[field]);
      samples.push({
        sourceKey: stored.sourceKey,
        title: stored.title,
        departmentLocationRaw: stored.departmentLocationRaw,
        postedDate: stored.postedDate,
        closingDate: stored.closingDate,
        advertisements: stored.advertisements,
        applicationLinks: stored.applicationLinks,
        sourceUrl: source,
        comparison: "matched captured source row",
      });
    }
  }
  const statusCounts = {
    "within-deadline": 0,
    closed: 0,
    unknown: 0,
    withdrawn: 0,
  };
  for (const row of rows) statusCounts[careerStatus(row)]++;
  const result = {
    checkedAt: new Date().toISOString(),
    sourceCapture: crawl.report,
    matchedCurrentSourceNotices: matched.length,
    actuallyStored: rows.length,
    uniqueSourceKeys: keys.size,
    statusCounts,
    samples,
  };
  await writeFile(
    ".local/careers/verification.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        matchedCurrentSourceNotices: matched.length,
        actuallyStored: rows.length,
        uniqueSourceKeys: keys.size,
        statusCounts,
        samplesChecked: samples.length,
      },
      null,
      2,
    ),
  );
}
main()
  .catch(() => {
    console.error(
      "Careers verification failed; check source snapshots and database access. No credentials logged.",
    );
    process.exitCode = 1;
  })
  .finally(() => closeDatabase().catch(() => undefined));
