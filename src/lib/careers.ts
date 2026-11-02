import { z } from "zod";
import { createHash } from "node:crypto";

export const CAREERS_SOURCE = "https://www.pakrail.gov.pk/Career.aspx";
export const CAREER_PAGE_SIZE = 10;
export const careerFilters = [
  "all",
  "within-deadline",
  "closed",
  "unknown",
  "withdrawn",
] as const;
export type CareerFilter = (typeof careerFilters)[number];
export const careerLabels: Record<CareerFilter, string> = {
  all: "All notices",
  "within-deadline": "Within deadline",
  closed: "Closed",
  unknown: "Deadline not provided",
  withdrawn: "Withdrawn / cancelled",
};
export function safePublicUrl(raw: string, base = CAREERS_SOURCE) {
  if (!raw.trim()) return null;
  try {
    const u = new URL(raw, base);
    return ["http:", "https:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export function canonicalCareerPage(raw: string, base = CAREERS_SOURCE) {
  const safe = safePublicUrl(raw, base);
  if (!safe) return null;
  const u = new URL(safe);
  if (
    !["pakrail.gov.pk", "www.pakrail.gov.pk"].includes(
      u.hostname.toLowerCase(),
    ) ||
    u.pathname.toLowerCase() !== "/career.aspx"
  )
    return null;
  if ([...u.searchParams.keys()].some((k) => k !== "pno")) return null;
  const pno = u.searchParams.get("pno");
  if (
    u.searchParams.getAll("pno").length > 1 ||
    (pno && !/^[1-9]\d{0,3}$/.test(pno))
  )
    return null;
  // Same official listing over HTTPS; the live source emits HTTP pager links.
  return `${CAREERS_SOURCE}${pno && pno !== "1" ? `?pno=${Number(pno)}` : ""}`;
}
const months: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};
export function parseCareerDate(raw: string): string | null {
  const v = raw.trim();
  let iso = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
  const words = /^(\d{1,2})\s+([a-z]+),?\s+(\d{4})$/i.exec(v);
  if (words && months[words[2].toLowerCase()])
    iso = `${words[3]}-${String(months[words[2].toLowerCase()]).padStart(2, "0")}-${words[1].padStart(2, "0")}`;
  if (!iso || Number.isNaN(Date.parse(`${iso}T12:00:00Z`))) return null;
  return new Date(`${iso}T12:00:00Z`).toISOString().slice(0, 10) === iso
    ? iso
    : null;
}
const httpUrl = z
  .string()
  .refine((v) => safePublicUrl(v) === v, "Expected a safe HTTP(S) URL.");
const careerLinkSchema = z.strictObject({
  label: z.string().max(1000),
  url: httpUrl,
  rawHref: z.string().max(4000),
});
export const careerNoticeSchema = z.strictObject({
  sourceKey: z.string().regex(/^pr-career-[a-f0-9]{64}$/),
  title: z.string().min(1).max(4000),
  description: z.string().max(100000),
  departmentLocationRaw: z.string().max(10000),
  postedDateRaw: z.string().max(1000),
  closingDateRaw: z.string().max(1000),
  postedDate: z.iso.date().nullable(),
  closingDate: z.iso.date().nullable(),
  explicitClosingInstant: z.iso.datetime({ offset: true }).nullable(),
  sourceStatusRaw: z.string().max(4000).nullable(),
  withdrawn: z.boolean(),
  advertisements: z.array(careerLinkSchema).max(30),
  applicationLinks: z.array(careerLinkSchema).max(10).optional(),
  sourceUrl: httpUrl,
  sourceDetailUrl: httpUrl.nullable(),
  sourceId: z.string().nullable(),
  sourcePages: z.array(httpUrl).min(1),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
});
export type CareerNotice = z.infer<typeof careerNoticeSchema>;
export type StoredCareerNotice = CareerNotice & {
  firstSeenAt: string;
  lastSeenAt: string;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
};
export const hashCareer = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function careerIdentity(
  notice: Pick<
    CareerNotice,
    | "advertisements"
    | "title"
    | "departmentLocationRaw"
    | "postedDateRaw"
    | "sourceDetailUrl"
    | "sourceId"
  >,
) {
  return `pr-career-${hashCareer({ id: notice.sourceId, detail: notice.sourceDetailUrl, advertisements: notice.advertisements.map((a) => a.url.replace(/^http:/, "https:").replace("://pakrail.gov.pk/", "://www.pakrail.gov.pk/")).sort(), title: notice.title, department: notice.departmentLocationRaw, posted: notice.postedDateRaw })}`;
}
export function careerStatus(
  n: Pick<CareerNotice, "withdrawn" | "closingDate" | "explicitClosingInstant">,
  now = new Date(),
): Exclude<CareerFilter, "all"> {
  if (n.withdrawn) return "withdrawn";
  if (n.explicitClosingInstant)
    return now.getTime() <= Date.parse(n.explicitClosingInstant)
      ? "within-deadline"
      : "closed";
  if (!n.closingDate) return "unknown";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const day = `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}-${parts.find((p) => p.type === "day")!.value}`;
  return n.closingDate >= day ? "within-deadline" : "closed";
}
export function careerQuery(
  params: Record<string, string | string[] | undefined>,
) {
  if ([params.q, params.status, params.page].some((v) => Array.isArray(v)))
    throw Error("Use one value for each search field.");
  const q = (params.q ?? "") as string,
    status = (params.status ?? "all") as CareerFilter,
    rawPage = (params.page ?? "1") as string;
  if (q.length > 120 || /[\x00-\x1f\x7f]/.test(q))
    throw Error(
      "Search must be at most 120 characters without control characters.",
    );
  if (!careerFilters.includes(status) || !/^[1-9]\d{0,3}$/.test(rawPage))
    throw Error("Choose a valid status and page number (1–9999).");
  return { q: q.trim(), status, page: Number(rawPage) };
}
export function careerHref(q: string, status: CareerFilter, page = 1) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status !== "all") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  return `/careers${params.size ? `?${params}` : ""}`;
}
