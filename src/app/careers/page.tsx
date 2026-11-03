import Link from "next/link";
import { redirect } from "next/navigation";
import AboutCover from "@/components/about-cover";
import CareersRetry from "@/components/careers-retry";
import {
  CAREER_PAGE_SIZE,
  careerFilters,
  careerHref,
  careerLabels,
  careerQuery,
} from "@/lib/careers";
import { queryCareers } from "@/server/careers-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Careers | Pakistan Railways",
  description:
    "Explore career notices and opportunities with Pakistan Railways.",
};
const displayDate = (date: string | null, raw: string) =>
  date
    ? new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : raw || "Not provided";
export default async function CareersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let query: ReturnType<typeof careerQuery>;
  try {
    query = careerQuery(await searchParams);
  } catch {
    return (
      <main id="main-content" className="people-page careers-page">
        <AboutCover
          title="Careers"
          description="Explore career notices and opportunities with Pakistan Railways."
          id="careers-title"
        />
        <section className="rail-container careers-content">
          <div className="careers-message" role="alert">
            <h2>Check your search</h2>
            <p>
              Use a search of up to 120 characters, a listed status and a valid
              page number.
            </p>
            <Link href="/careers">Reset filters</Link>
          </div>
        </section>
      </main>
    );
  }
  let data: Awaited<ReturnType<typeof queryCareers>> | null = null;
  try {
    data = await queryCareers(query);
  } catch {
    console.error("Careers catalogue query unavailable.");
  }
  if (data && query.page > data.pages)
    redirect(careerHref(query.q, query.status, data.pages));
  const pages = data
    ? Array.from(
        new Set([1, data.pages, query.page - 1, query.page, query.page + 1]),
      )
        .filter((p) => p >= 1 && p <= data.pages)
        .sort((a, b) => a - b)
    : [];
  return (
    <main id="main-content" className="people-page careers-page">
      <AboutCover
        title="Careers"
        description="Explore career notices and opportunities with Pakistan Railways."
        id="careers-title"
      />
      <section
        className="rail-container careers-content"
        aria-labelledby="career-notices-title"
      >
        <div className="careers-intro">
          <span className="eyebrow">OPPORTUNITIES & ARCHIVE</span>
          <h2 id="career-notices-title">Career notices</h2>
          <span className="gold-rule" />
          <p>
            Read current deadlines and browse past advertisements. See each
            advertisement for application instructions; applications are not
            accepted on this website.
          </p>
        </div>
        <form
          className="careers-search"
          action="/careers"
          method="get"
          aria-label="Search career notices"
        >
          <label htmlFor="career-query">
            Search notices
            <input
              className="input"
              id="career-query"
              name="q"
              maxLength={120}
              defaultValue={query.q}
              placeholder="Title, description or department"
              type="search"
            />
          </label>
          <label htmlFor="career-status">
            Status
            <select
              className="input"
              id="career-status"
              name="status"
              defaultValue={query.status}
            >
              {careerFilters.map((filter) => (
                <option key={filter} value={filter}>
                  {careerLabels[filter]}
                </option>
              ))}
            </select>
          </label>
          <button className="button primary">Search notices</button>
          <Link href="/careers">Reset filters</Link>
        </form>
        {!data ? (
          <div className="careers-message" role="alert">
            <h2>Career notices are temporarily unavailable</h2>
            <p>Please try again shortly.</p>
            <CareersRetry />
          </div>
        ) : (
          <>
            <div className="careers-result-note" role="status">
              <strong>
                {data.total} {data.total === 1 ? "notice" : "notices"}
              </strong>
              <span>
                {data.total
                  ? `Showing ${(query.page - 1) * CAREER_PAGE_SIZE + 1}–${Math.min(query.page * CAREER_PAGE_SIZE, data.total)} · Page ${query.page} of ${data.pages}`
                  : ""}
              </span>
            </div>
            {!data.items.length ? (
              <div className="careers-message">
                <h2>
                  {data.collectionTotal
                    ? "No notices match your search"
                    : "No career notices have been published here yet"}
                </h2>
                <p>
                  {data.collectionTotal
                    ? "Try another phrase or select All notices."
                    : "Please check the official careers source for available information."}
                </p>
                <Link href="/careers">Reset filters</Link>
              </div>
            ) : (
              <div className="careers-list">
                {data.items.map((notice) => (
                  <article className="career-notice" key={notice.sourceKey}>
                    <div className="career-notice-top">
                      <span
                        className={`career-status status-${notice.displayStatus}`}
                      >
                        {careerLabels[notice.displayStatus]}
                      </span>
                      <span className="career-posted">
                        Posted{" "}
                        {displayDate(notice.postedDate, notice.postedDateRaw)}
                      </span>
                    </div>
                    <h3>{notice.title}</h3>
                    {notice.departmentLocationRaw && (
                      <p className="career-department">
                        {notice.departmentLocationRaw}
                      </p>
                    )}
                    <p className="career-excerpt">
                      {notice.description.length > 260
                        ? `${notice.description.slice(0, 260)}…`
                        : notice.description}
                    </p>
                    <p className="career-deadline">
                      <strong>Last date to apply:</strong>{" "}
                      {displayDate(notice.closingDate, notice.closingDateRaw)}
                      {notice.explicitClosingInstant
                        ? ` · ${new Date(notice.explicitClosingInstant).toLocaleString("en-GB", { timeZone: "Asia/Karachi" })} PKT`
                        : ""}
                    </p>
                    <details className="career-details">
                      <summary>Read full notice</summary>
                      <div className="career-full-description">
                        {notice.description ||
                          "See the advertisement for the full notice."}
                      </div>
                      <p>
                        Department / location:{" "}
                        {notice.departmentLocationRaw || "Not provided"}
                      </p>
                      <p>
                        Posted: {notice.postedDateRaw || "Not provided"} ·
                        Closing: {notice.closingDateRaw || "Not provided"}
                      </p>
                    </details>
                    <div className="career-advertisements">
                      {notice.advertisements.length ? (
                        notice.advertisements.map((advert, i) => (
                          <a
                            key={advert.url}
                            href={advert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View advertisement
                            {notice.advertisements.length > 1
                              ? ` ${i + 1}`
                              : ""}
                            <span className="sr-only">
                              {" "}
                              — {advert.label} (opens a new tab)
                            </span>
                          </a>
                        ))
                      ) : (
                        <span>Advertisement link not provided.</span>
                      )}
                    </div>
                    {(notice.applicationLinks ?? []).map((link) => (
                      <p className="career-status-help" key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {notice.displayStatus === "within-deadline"
                            ? "External application portal"
                            : "Original application link (archived notice)"}
                          <span className="sr-only"> (opens a new tab)</span>
                        </a>
                      </p>
                    ))}
                    {notice.displayStatus === "within-deadline" && (
                      <p className="career-status-help">
                        Within the listed deadline; confirm current instructions
                        with Pakistan Railways.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
            {data.pages > 1 && (
              <nav
                className="careers-pagination"
                aria-label="Career notices pagination"
              >
                {query.page > 1 && (
                  <Link
                    href={careerHref(query.q, query.status, query.page - 1)}
                  >
                    Previous
                  </Link>
                )}
                {pages.map((page, i) => (
                  <span key={page}>
                    {i > 0 && page - pages[i - 1] > 1 && (
                      <span className="pagination-gap" aria-hidden="true">
                        …
                      </span>
                    )}
                    {page === query.page ? (
                      <span className="current-page" aria-current="page">
                        {page}
                      </span>
                    ) : (
                      <Link
                        aria-label={`Page ${page}`}
                        href={careerHref(query.q, query.status, page)}
                      >
                        {page}
                      </Link>
                    )}
                  </span>
                ))}
                {query.page < data.pages && (
                  <Link
                    href={careerHref(query.q, query.status, query.page + 1)}
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
            <p className="careers-source">
              Source: Pakistan Railways .{" "}
              {data.lastSyncedAt
                ? `Last synced ${new Date(data.lastSyncedAt).toLocaleString("en-GB", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })} PKT. `
                : ""}
              This imported view is not a live recruitment feed. Advertisement
              files are hosted by the source.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
