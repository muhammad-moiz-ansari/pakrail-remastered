"use client";
import Link from "next/link";
export default function BookingError({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="account-main">
      <section className="panel">
        <h1>Booking service unavailable</h1>
        <p>
          Your browser draft is retained. Please retry before continuing to
          payment.
        </p>
        <button className="button primary" onClick={reset}>
          Try again
        </button>
        <Link href="/booking/review">Back to review</Link>
      </section>
    </main>
  );
}
