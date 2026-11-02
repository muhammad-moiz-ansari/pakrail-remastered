import { CAREERS_SOURCE, canonicalCareerPage, CareerNotice } from "./careers";
import { parseCareersPage } from "./careers-parser";

export async function crawlCareers(
  fetchPage: (url: string, attempt: number) => Promise<string>,
  options: {
    maxPages?: number;
    pause?: (ms: number) => Promise<void>;
    onPage?: (url: string, html: string) => Promise<void>;
  } = {},
) {
  const queue = [CAREERS_SOURCE],
    visited = new Set<string>(),
    signatures = new Set<string>();
  const records = new Map<string, CareerNotice>();
  const report = {
    startedAt: new Date().toISOString(),
    finishedAt: "",
    pagesAttempted: 0,
    pagesSucceeded: 0,
    pagesFailed: [] as { url: string; reason: string }[],
    pages: [] as { url: string; rawRows: number; validRows: number }[],
    rawRows: 0,
    duplicates: 0,
    invalid: 0,
    issues: [] as { url: string; row: number; message: string }[],
    complete: true,
    safetyLimitReached: false,
  };
  const pause =
    options.pause ??
    ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  while (queue.length) {
    if (visited.size >= (options.maxPages ?? 100)) {
      report.complete = false;
      report.safetyLimitReached = true;
      break;
    }
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);
    report.pagesAttempted++;
    let html: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (report.pagesAttempted > 1 || attempt)
        await pause(attempt ? 1000 * (attempt + 1) : 600);
      try {
        html = await fetchPage(url, attempt);
        break;
      } catch {
        if (attempt === 2) {
          report.complete = false;
          report.pagesFailed.push({
            url,
            reason: "HTTPS fetch failed after 3 bounded attempts.",
          });
        }
      }
    }
    if (html === undefined) continue;
    try {
      await options.onPage?.(url, html);
      const page = parseCareersPage(html, url);
      report.pagesSucceeded++;
      report.rawRows += page.rawRows;
      report.invalid += page.rawRows - page.notices.length;
      report.pages.push({
        url,
        rawRows: page.rawRows,
        validRows: page.notices.length,
      });
      report.issues.push(...page.issues.map((issue) => ({ url, ...issue })));
      if (!page.rawRows) {
        report.complete = false;
        report.pagesFailed.push({
          url,
          reason: "Listing returned no rows; coverage cannot be confirmed.",
        });
      }
      if (signatures.has(page.signature)) {
        report.complete = false;
        report.pagesFailed.push({
          url,
          reason:
            "Repeated listing content at a different page URL; pagination loop detected.",
        });
        report.duplicates += page.notices.length;
        continue;
      }
      signatures.add(page.signature);
      for (const notice of page.notices) {
        const existing = records.get(notice.sourceKey);
        if (!existing) records.set(notice.sourceKey, notice);
        else if (existing.contentHash === notice.contentHash) {
          report.duplicates++;
          existing.sourcePages = [...new Set([...existing.sourcePages, url])];
        } else {
          report.invalid++;
          report.issues.push({
            url,
            row: 0,
            message: `Conflicting content for notice identity ${notice.sourceKey}; first occurrence retained for review.`,
          });
        }
      }
      for (const link of page.pagination) {
        const canonical = canonicalCareerPage(link, url);
        if (canonical && !visited.has(canonical) && !queue.includes(canonical))
          queue.push(canonical);
      }
    } catch {
      report.complete = false;
      report.pagesFailed.push({
        url,
        reason:
          "Listing parse failed: unexpected source structure or invalid notice data.",
      });
    }
  }
  report.finishedAt = new Date().toISOString();
  return { report, notices: [...records.values()] };
}
