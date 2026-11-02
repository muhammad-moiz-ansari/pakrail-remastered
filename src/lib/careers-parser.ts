import { load } from "cheerio";
import {
  canonicalCareerPage,
  CareerNotice,
  careerIdentity,
  careerNoticeSchema,
  hashCareer,
  parseCareerDate,
  safePublicUrl,
} from "./careers";

export function parseCareersPage(html: string, pageUrl: string) {
  const $ = load(html);
  $("script,style,noscript").remove();
  const text = (value: string) =>
    value
      .replace(/\u00a0/g, " ")
      .replace(/\r/g, "")
      .split("\n")
      .map((v) => v.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n")
      .trim();
  const table = $("table")
    .filter((_, el) => {
      const headings = $(el)
        .find("th")
        .map((_, th) => $(th).text().replace(/\s+/g, " ").trim().toLowerCase())
        .get();
      return (
        headings.includes("description") &&
        headings.includes("date posted") &&
        headings.includes("last date to apply")
      );
    })
    .first();
  if (!table.length)
    throw Error(
      "Careers listing table was not found; source structure or access may have changed.",
    );
  const notices: CareerNotice[] = [],
    issues: { row: number; message: string }[] = [];
  let rawRows = 0;
  table.find("tr").each((_, row) => {
    const cells = $(row).children("td");
    if (!cells.length) return;
    rawRows++;
    if (cells.length !== 3) {
      issues.push({
        row: rawRows,
        message: "Unexpected listing column count.",
      });
      return;
    }
    const content = cells.eq(0).clone();
    content.find("br").replaceWith("\n");
    const title = text(content.find("h1,h2,h3,h4,h5,strong").first().text());
    const paragraphs = content
      .find("p")
      .map((_, el) => text($(el).text()))
      .get();
    const fullText = text(content.text());
    const description = paragraphs.length
      ? paragraphs.join("\n\n")
      : fullText
          .replace(title, "")
          .replace(/Download File\s*$/i, "")
          .trim();
    const department =
      /Department\s*\/\s*Location\s*:\s*([\s\S]*)/i
        .exec(description)?.[1]
        .trim() ?? "";
    const advertisements: CareerNotice["advertisements"] = [];
    const applicationLinks: CareerNotice["advertisements"] = [];
    const identityLinks: CareerNotice["advertisements"] = [];
    content.find("a[href]").each((_, el) => {
      const rawHref = $(el).attr("href")!,
        url = safePublicUrl(rawHref, pageUrl);
      if (url && !identityLinks.some((v) => v.url === url)) {
        const link = {
          url,
          rawHref,
          label: text($(el).text()) || "View advertisement",
        };
        identityLinks.push(link);
        if (/apply|application/i.test(link.label) && $(el).closest("p").length)
          applicationLinks.push(link);
        else advertisements.push(link);
      }
    });
    const postedDateRaw = text(cells.eq(1).text()),
      closingDateRaw = text(cells.eq(2).text());
    const postedDate = parseCareerDate(postedDateRaw),
      closingDate = parseCareerDate(closingDateRaw);
    // No inferred withdrawal/closing time: the inspected table exposes neither field.
    const fields = {
      title,
      description,
      departmentLocationRaw: department,
      postedDateRaw,
      closingDateRaw,
      postedDate,
      closingDate,
      explicitClosingInstant: null,
      sourceStatusRaw: null,
      withdrawn: false,
      advertisements,
      ...(applicationLinks.length ? { applicationLinks } : {}),
      sourceUrl: pageUrl,
      sourceDetailUrl: null,
      sourceId: $(row).attr("data-notice-id") ?? null,
      sourcePages: [pageUrl],
    };
    const sourceKey = careerIdentity({
        ...fields,
        advertisements: identityLinks,
      }),
      contentHash = hashCareer({
        title,
        description,
        department,
        postedDateRaw,
        closingDateRaw,
        ...(applicationLinks.length ? { applicationLinks } : {}),
        advertisements: advertisements.map((a) => ({
          label: a.label,
          url: a.url,
        })),
      });
    const parsed = careerNoticeSchema.safeParse({
      ...fields,
      sourceKey,
      contentHash,
    });
    if (!parsed.success) {
      issues.push({
        row: rawRows,
        message: "Notice failed field or URL validation.",
      });
      return;
    }
    if (!postedDate && postedDateRaw)
      issues.push({
        row: rawRows,
        message: "Unparseable posted date retained as raw text.",
      });
    if (!closingDate && closingDateRaw)
      issues.push({
        row: rawRows,
        message:
          "Unparseable deadline retained as raw text; displayed as deadline not provided.",
      });
    notices.push(parsed.data);
  });
  const pagination = new Set<string>();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href")!;
    const url = canonicalCareerPage(href, pageUrl);
    if (url && new URL(url).searchParams.has("pno")) pagination.add(url);
  });
  return {
    rawRows,
    notices,
    issues,
    pagination: [...pagination],
    signature: hashCareer(notices.map((n) => n.contentHash)),
  };
}
