import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sessionFor, developmentMailEnabled } from "@/server/auth";
import { draftStore } from "@/server/booking-drafts";
import { prettyDate, money, pricing } from "@/lib/booking";
import AccountVerification from "@/components/account-verification";
export const dynamic = "force-dynamic";
export const metadata = { title: "My bookings | Pakistan Railways" };
export default async function Page() {
  const session = await sessionFor(await headers());
  if (!session) redirect("/login?returnTo=/account");
  const rows = await (await draftStore()).list(session.user.id);
  return (
    <main id="main-content" className="account-main">
      <section className="panel">
        <span className="eyebrow">YOUR ACCOUNT</span>
        <h1>My bookings</h1>
        <p>Welcome, {session.user.name}.</p>
        <AccountVerification
          verified={session.user.emailVerified}
          email={session.user.email}
          mailEnabled={developmentMailEnabled()}
        />
        <p>
          Completed project bookings saved to this account appear here. Earlier
          browser-only summaries are not automatically imported.
        </p>
        {rows.length ? (
          <div className="account-bookings">
            {rows.map((row) => (
              <article key={row._id}>
                <h2>{row.snapshot.reference}</h2>
                <p>
                  {row.snapshot.legs
                    .map((l) => `${l.id}: ${prettyDate(l.train.date)}`)
                    .join(" · ")}
                </p>
                <p>
                  {row.snapshot.passengers.length} traveller(s) ·{" "}
                  {money(pricing(row.snapshot).total)} simulated
                </p>
                <Link
                  className="button secondary"
                  href={`/account/bookings/${row._id}`}
                >
                  View ticket
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p>No completed bookings yet.</p>
        )}
        <Link className="button primary" href="/">
          Plan a journey
        </Link>
      </section>
    </main>
  );
}
