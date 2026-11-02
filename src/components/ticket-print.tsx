"use client";
import Image from "next/image";
import { createPortal } from "react-dom";
import { money, prettyDate, type Booking } from "@/lib/booking";
import { ticketDocument } from "@/lib/ticket-document";

/** A body-level sibling avoids inherited grids, sticky panels and blank print gaps. */
export default function TicketPrint({ booking }: { booking: Booking }) {
  const ticket = ticketDocument(booking);
  if (!ticket) return null;
  return createPortal(<TicketDocumentView ticket={ticket} />, document.body);
}

export function TicketDocumentView({
  ticket,
}: {
  ticket: NonNullable<ReturnType<typeof ticketDocument>>;
}) {
  return (
    <section id="ticket-print-root" aria-label="Printable test ticket">
      <header className="print-ticket-brand">
        <Image
          src="/logo.png"
          alt="Pakistan Railways"
          width={52}
          height={52}
          unoptimized
        />
        <div>
          <h1>Pakistan Railways</h1>
          <p>E-ticket · Project demonstration</p>
        </div>
      </header>
      <p className="print-ticket-status">{ticket.status} · No money charged.</p>
      <p className="print-ticket-reference">
        Internal booking reference <strong>{ticket.reference}</strong>
      </p>
      {ticket.legs.map((leg) => (
        <section className="print-ticket-leg" key={leg.id}>
          <header className="print-ticket-route">
            <span>
              {leg.id === "outbound" ? "Outbound journey" : "Return journey"}
            </span>
            <h2>
              {leg.from} → {leg.to}
            </h2>
            <p>
              {prettyDate(leg.date)} · {leg.train} · {leg.className}
            </p>
            <p>
              Departure {leg.departure} · Arrival {leg.arrival}
              {leg.arrivalDay ? ` (+${leg.arrivalDay} day)` : ""} · Sample
              timetable
            </p>
          </header>
          {leg.passengers.map((passenger, i) => (
            <article className="print-ticket-passenger" key={i}>
              <h3>
                {passenger.name} <small>{passenger.type}</small>
              </h3>
              <dl>
                <div>
                  <dt>Coach</dt>
                  <dd>{passenger.coach}</dd>
                </div>
                <div>
                  <dt>Place</dt>
                  <dd>{passenger.place}</dd>
                </div>
                <div>
                  <dt>Class fare</dt>
                  <dd>{money(passenger.fare)}</dd>
                </div>
              </dl>
              <p>{passenger.accommodation}</p>
            </article>
          ))}
        </section>
      ))}
      <section className="print-ticket-totals">
        <h2>
          Fare summary · all travellers
          {ticket.legs.length > 1 ? " · both journeys" : ""}
        </h2>
        <dl>
          <div>
            <dt>Base fare</dt>
            <dd>{money(ticket.totals.base)}</dd>
          </div>
          {ticket.totals.discount > 0 && (
            <div>
              <dt>Voucher discount</dt>
              <dd>− {money(ticket.totals.discount)}</dd>
            </div>
          )}
          <div>
            <dt>Seat selection</dt>
            <dd>Included</dd>
          </div>
          <div>
            <dt>Total simulated payment</dt>
            <dd>{money(ticket.totals.total)}</dd>
          </div>
          <div>
            <dt>Actual amount charged</dt>
            <dd>PKR 0</dd>
          </div>
        </dl>
      </section>
      <footer className="print-ticket-note">
        Keep the internal booking reference for your project records. This
        document cannot be used for boarding or railway verification.
      </footer>
    </section>
  );
}

export async function printTicketDocument() {
  await document.fonts.ready;
  const root = document.getElementById("ticket-print-root");
  if (!root) throw new Error("No completed test ticket is available to print.");
  await Promise.all(
    Array.from(root.querySelectorAll("img")).map(async (img) => {
      await img.decode();
      if (!img.naturalWidth)
        throw new Error("The ticket logo could not be loaded. Please retry.");
    }),
  );
  if (!root.isConnected)
    throw new Error("The booking changed. Open your ticket again.");
  window.print();
}
