"use client";
import { useState } from "react";
import TicketPrint, { printTicketDocument } from "./ticket-print";
import {
  type Booking,
  station,
  prettyDate,
  className,
  seatKey,
  seatLabel,
  seatDescription,
  pricing,
  money,
} from "@/lib/booking";
export default function AccountTicket({ booking: b }: { booking: Booking }) {
  const [error, setError] = useState("");
  return (
    <>
      <TicketPrint booking={b} />
      <section className="panel">
        <h1>Your booking</h1>
        <p>
          Internal reference <b>{b.reference}</b>
        </p>
        <p>
          Project demonstration · Simulated payment completed. No money charged.
        </p>
        {b.legs.map((l) => (
          <article className="account-leg" key={l.id}>
            <span className="eyebrow">
              {l.id === "outbound" ? "OUTBOUND" : "RETURN"}
            </span>
            <h2>
              {station(l.train.from, b.search)} →{" "}
              {station(l.train.to, b.search)}
            </h2>
            <p>
              {prettyDate(l.train.date)} · {l.train.name} · {className(l)}
            </p>
            <p>
              {l.train.departure} → {l.train.arrival}
              {l.train.arrivalDay ? ` (+${l.train.arrivalDay} day)` : ""}
            </p>
            {b.passengers.map((p) => {
              const s = b.assignments[seatKey(l.id, p.id)];
              return (
                <p key={p.id}>
                  <b>{p.name}</b> · {p.type} · Coach {s.coach} · Place{" "}
                  {seatLabel(s)} · {seatDescription(s)}
                </p>
              );
            })}
          </article>
        ))}
        <p>
          Total simulated payment <strong>{money(pricing(b).total)}</strong>
        </p>
        {error && <p role="alert">{error}</p>}
        <button
          className="button secondary"
          onClick={async () => {
            try {
              await printTicketDocument();
            } catch {
              setError("The ticket could not be prepared. Please try again.");
            }
          }}
        >
          Print ticket
        </button>
      </section>
    </>
  );
}
