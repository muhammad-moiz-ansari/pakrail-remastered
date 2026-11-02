import { loadEnvConfig } from "@next/env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { database, closeDatabase } from "../src/server/db/mongodb";
import { crawlCareers } from "../src/lib/careers-crawl";
import { canonicalCareerPage, careerNoticeSchema } from "../src/lib/careers";
import {
  applyCareerImport,
  careerImportPlan,
} from "../src/server/careers-store";

loadEnvConfig(process.cwd());
const exec = promisify(execFile);
const args = process.argv.slice(2),
  apply = args.includes("--apply");
async function fetchPage(url: string) {
  if (!canonicalCareerPage(url)) throw Error("Unsupported careers URL.");
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(25000),
      headers: { "User-Agent": "PakistanRailwaysRemastered-CareersImport/1.0" },
    });
    if (!response.ok) throw Error("Public page unavailable.");
    if (!canonicalCareerPage(response.url)) throw Error("Unexpected redirect.");
    return await response.text();
  } catch (error) {
    const code = (error as { cause?: { code?: string } })?.cause?.code;
    // Windows HTTPS can retrieve intermediate certificates through the system
    // chain engine. Neither transport disables TLS/certificate validation.
    if (
      process.platform !== "win32" ||
      ![
        "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
        "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
      ].includes(code ?? "")
    )
      throw error;
    const script =
      "$ProgressPreference='SilentlyContinue'; [Console]::OutputEncoding=[Text.UTF8Encoding]::new(); $r=Invoke-WebRequest -Uri $env:CAREERS_FETCH_URL -UseBasicParsing -TimeoutSec 25; $u=$r.BaseResponse.RequestMessage.RequestUri.AbsoluteUri; @{url=$u;html=$r.Content}|ConvertTo-Json -Compress -Depth 3";
    const { stdout } = await exec(
      "pwsh",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      {
        env: { ...process.env, CAREERS_FETCH_URL: url },
        timeout: 30000,
        maxBuffer: 5_000_000,
        windowsHide: true,
      },
    );
    const result = JSON.parse(stdout);
    if (!canonicalCareerPage(result.url))
      throw Error("Unexpected HTTPS redirect.");
    return result.html as string;
  }
}
async function main() {
  const allowed = ["--apply", "--dry-run", "--snapshot", "--max-pages"];
  if (args.some((a) => a.startsWith("--") && !allowed.includes(a)))
    throw Error("Unknown flag.");
  if (apply && args.includes("--dry-run"))
    throw Error("Choose dry-run or apply.");
  const maxIndex = args.indexOf("--max-pages"),
    maxPages = maxIndex < 0 ? 100 : Number(args[maxIndex + 1]);
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 200)
    throw Error("max-pages must be 1–200.");
  const folder = resolve(".local/careers");
  await mkdir(`${folder}/pages`, { recursive: true });
  const snapshotIndex = args.indexOf("--snapshot");
  const crawl =
    snapshotIndex >= 0
      ? JSON.parse(await readFile(resolve(args[snapshotIndex + 1]), "utf8"))
      : await crawlCareers(fetchPage, {
          maxPages,
          onPage: async (url, html) => {
            const n = new URL(url).searchParams.get("pno") ?? "1";
            await writeFile(`${folder}/pages/page-${n}.html`, html);
          },
        });
  const notices = (crawl.notices as unknown[]).map((n) =>
    careerNoticeSchema.parse(n),
  );
  if (new Set(notices.map((n) => n.sourceKey)).size !== notices.length)
    throw Error("Snapshot contains duplicate notice identities.");
  await writeFile(`${folder}/crawl.json`, JSON.stringify(crawl, null, 2));
  const db = await database(),
    plan = await careerImportPlan(db, notices);
  const expected = {
    inserted: plan.filter((p) => p.action === "inserted").length,
    updated: plan.filter((p) => p.action === "updated").length,
    unchanged: plan.filter((p) => p.action === "unchanged").length,
  };
  const result = {
    mode: apply ? "apply" : "dry-run",
    crawl: crawl.report,
    validUniqueNotices: notices.length,
    expected,
    ...(apply ? { persistence: await applyCareerImport(db, notices) } : {}),
  };
  const reportPath = `${folder}/${apply ? "import" : "dry-run"}-report.json`;
  await writeFile(reportPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (!crawl.report.complete || (apply && result.persistence!.counts.failed))
    process.exitCode = 2;
}
main()
  .catch(() => {
    console.error(
      "Careers import failed. Check HTTPS access, source structure, snapshot validation and MongoDB configuration. Credentials have not been logged.",
    );
    process.exitCode = 1;
  })
  .finally(() => closeDatabase().catch(() => undefined));
