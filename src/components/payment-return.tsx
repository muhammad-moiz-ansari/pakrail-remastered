"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function PaymentReturn({ id }: { id: string }) {
  const [state, setState] = useState("Waiting for provider confirmation"),
    [booking, setBooking] = useState("");
  useEffect(() => {
    let active = true,
      count = 0;
    const check = async () => {
      try {
        const r = await fetch(`/api/payments/${id}`, { cache: "no-store" });
        if (!r.ok) throw Error();
        const d = await r.json();
        if (active) {
          setState(
            d.state === "pending" && d.expired
              ? "Hold expired; awaiting provider status"
              : d.state,
          );
          setBooking(d.bookingId ?? "");
        }
      } catch {
        if (active)
          setState(
            "Status unavailable. Log in and check again; this return URL does not prove payment.",
          );
      }
    };
    void check();
    const t = setInterval(() => {
      if (++count >= 20) clearInterval(t);
      else void check();
    }, 3000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [id]);
  return (
    <section className="panel">
      <h1>Sandbox payment status</h1>
      <p role="status">{state}</p>
      <p>
        Confirmation comes from the provider, independently of returning or
        cancelling this page.
      </p>
      {booking ? (
        <Link className="button primary" href={`/account/bookings/${booking}`}>
          View booking
        </Link>
      ) : (
        <Link href="/booking/review">Return to review</Link>
      )}
    </section>
  );
}
