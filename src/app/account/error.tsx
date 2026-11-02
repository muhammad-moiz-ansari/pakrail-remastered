"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="account-main">
      <section className="panel">
        <h1>Account service unavailable</h1>
        <p>Please try again. Your browser draft is retained.</p>
        <button className="button primary" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
