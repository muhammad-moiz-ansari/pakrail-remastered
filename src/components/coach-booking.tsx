"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Info } from "lucide-react";
import {
  coachLayouts,
  getLayout,
  layoutTitle,
  type CoachOffer,
  type CoachPlace,
} from "@/lib/coach-layouts";
import {
  changeLeg,
  chooseSeat,
  classes,
  fare,
  money,
  recommend,
  removeSeat,
  seatDescription,
  seatForPlace,
  seatKey,
  seatLabel,
  unavailable,
  allocationIsTogether,
  type Booking,
  type Leg,
} from "@/lib/booking";
import CoachMap, { AccommodationIcon } from "./coach-map";

export function ReferenceLayoutBrowser() {
  const [id, setId] = useState(coachLayouts[0].id);
  const layout = getLayout(id)!;
  return (
    <details className="reference-layout-browser">
      <summary>Explore coach layouts</summary>
      <p className="fineprint">
        Compare reference arrangements. Available coaches depend on your chosen
        service.
      </p>
      <label>
        Coach layout
        <select
          aria-label="Coach layout"
          className="input"
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          {coachLayouts.map((l) => (
            <option key={l.id} value={l.id}>
              {layoutTitle(l)}
            </option>
          ))}
        </select>
      </label>
      <CoachMap key={id} layout={layout} />
    </details>
  );
}
export function CoachClassChoices({
  booking,
  leg,
  onChange,
  onNotice,
}: {
  booking: Booking;
  leg: Leg;
  onChange: (b: Booking) => void;
  onNotice: (message: string) => void;
}) {
  const [result, setResult] = useState<{
      source: string;
      notice?: string;
      offers: CoachOffer[];
    } | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const service = `sample-${leg.train.id.split("-").at(-1)}`;
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({
      service,
      from: leg.train.from,
      to: leg.train.to,
      date: leg.train.date,
    });
    fetch(`/api/coaches?${query}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok)
          throw Error("Coach configuration could not be loaded. Please retry.");
        return response.json();
      })
      .then((data) => {
        setResult(data);
        setError("");
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "Could not load coach configuration.",
          );
      });
    return () => controller.abort();
  }, [service, leg.train.from, leg.train.to, leg.train.date, retry]);
  const offers = result?.offers.filter(
    (o) =>
      o.serviceId === service &&
      o.from === leg.train.from &&
      o.to === leg.train.to &&
      o.date === leg.train.date,
  );
  return (
    <>
      {error ? (
        <div className="alert error" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => setRetry((v) => v + 1)}
          >
            Retry
          </button>
        </div>
      ) : !offers?.length ? (
        <p role="status">Loading coach configuration…</p>
      ) : null}
      {result?.notice && <p className="coach-evidence-note">{result.notice}</p>}
      <div className="class-grid">
        {offers?.map((offer) => {
          const c = classes.find((v) => v.id === offer.classId)!;
          const capacity = offer.coaches.reduce(
            (n, coach) =>
              n +
              (getLayout(coach.layoutId, coach.layoutVersion)?.places.length ??
                0),
            0,
          );
          const active =
            leg.offer?.classId === offer.classId &&
            leg.offer?.mode === offer.mode;
          const disabled = !offer.quote || capacity < booking.passengers.length;
          return (
            <article
              className={`class-card ${active ? "selected" : ""}`}
              key={`${offer.classId}-${offer.mode}`}
            >
              <span className="class-icon">
                <AccommodationIcon type={offer.mode} />
              </span>
              <h2>{c.name}</h2>
              <p>{c.description}</p>
              <ul>
                {c.benefits.map((v) => (
                  <li key={v}>
                    <Check size={17} />
                    {v}
                  </li>
                ))}
              </ul>
              <p>
                <b>
                  {offer.mode === "berth"
                    ? "Berth configuration"
                    : "Seated configuration"}
                </b>
              </p>
              <p className="fineprint">
                {offer.coaches
                  .map((coach) => `Coach ${coach.number}`)
                  .join(", ")}{" "}
                · {capacity} positions in this arrangement. Sample availability
                is shown when choosing a place.
              </p>
              <div className="class-price">
                <b>
                  {offer.quote ? money(offer.quote.amount) : "Fare unavailable"}
                </b>
                <small>
                  {offer.quote ? "sample fare per person" : "Preview only"}
                </small>
                {offer.quote && (
                  <span>
                    {money(offer.quote.amount * booking.passengers.length)} for
                    your group
                  </span>
                )}
              </div>
              <button
                className={`button full ${active ? "primary" : "secondary"}`}
                disabled={disabled}
                aria-pressed={active}
                onClick={() => {
                  onChange(
                    changeLeg(booking, { ...leg, classId: c.id, offer }),
                  );
                  onNotice(
                    "Class saved. Your previous places on this leg are released when you change class; your other leg and traveller details are retained.",
                  );
                }}
              >
                {active ? (
                  <>
                    <Check size={16} />
                    Selected
                  </>
                ) : (
                  `Select ${c.name}`
                )}
              </button>
            </article>
          );
        })}
      </div>
      <p className="fineprint">
        <Info size={14} /> Layouts follow railway references. Services, fares
        and availability shown here are samples; payment remains a test.
      </p>
      <ReferenceLayoutBrowser />
    </>
  );
}
export default function VerifiedSeatSelection({
  booking,
  leg,
  onChange,
  onNotice,
}: {
  booking: Booking;
  leg: Leg;
  onChange: (b: Booking) => void;
  onNotice: (message: string) => void;
}) {
  const offer = leg.offer!;
  const [coachNumber, setCoachNumber] = useState(offer.coaches[0].number),
    [pid, setPid] = useState(booking.passengers[0].id);
  const coach =
    offer.consist.find((c) => c.number === coachNumber) ?? offer.coaches[0];
  const selectedClass = offer.coaches.some((c) => c.id === coach.id);
  const layout = getLayout(coach.layoutId, coach.layoutVersion)!;
  const active =
    booking.passengers.find((p) => p.id === pid) ?? booking.passengers[0];
  const owner = (p: CoachPlace) =>
    booking.passengers.find((person) => {
      const s = booking.assignments[seatKey(leg.id, person.id)];
      return s?.coach === coach.number && s.place?.physicalId === p.physicalId;
    });
  return (
    <div className="verified-booking-layout">
      <section className="panel verified-group">
        <span className="eyebrow">YOUR GROUP</span>
        <h2>A place for everyone</h2>
        <p className="subtle">
          Choose a traveller, then a place. Your green selection can be removed
          by activating it again.
        </p>
        {booking.passengers.map((p, i) => {
          const s = booking.assignments[seatKey(leg.id, p.id)];
          return (
            <button
              key={p.id}
              className={`passenger-seat ${active.id === p.id ? "active" : ""}`}
              aria-pressed={active.id === p.id}
              onClick={() => setPid(p.id)}
            >
              <span className="number-badge">{i + 1}</span>
              <span>
                <b>{p.name}</b>
                <small>
                  {s
                    ? `Coach ${s.coach} · ${seatLabel(s)} · ${seatDescription(s)} · ${money(fare(leg))}`
                    : "Choose a place"}
                </small>
              </span>
              {s && <Check size={17} />}
            </button>
          );
        })}
        <p className="assignment-count" role="status">
          {
            booking.passengers.filter(
              (p) => booking.assignments[seatKey(leg.id, p.id)],
            ).length
          }{" "}
          of {booking.passengers.length} places selected · {leg.id}
        </p>
        <button
          className="button secondary full"
          onClick={() => {
            onChange(recommend(booking));
            onNotice(
              "Places suggested for the remaining travellers, grouped by coach section where possible. Berth tiers may differ; review each assignment.",
            );
          }}
        >
          Suggest remaining places
        </button>
        <p className="fineprint">
          {allocationIsTogether(booking, leg.id)
            ? "Your group is in one coach section; check each berth’s tier."
            : "Your group may span bays. Review the type and tier for each traveller."}
        </p>
      </section>
      <section className="panel verified-coach-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">YOUR COACH</span>
            <h2>Coach {coach.number}</h2>
          </div>
          <span>{classes.find((c) => c.id === coach.classId)?.name}</span>
        </div>
        <nav
          className="train-overview"
          aria-label="Sample train coach overview"
        >
          {[...offer.consist]
            .sort((a, b) => a.order - b.order)
            .map((c) => (
              <button
                key={c.id}
                className={c.id === coach.id ? "active" : ""}
                aria-pressed={c.id === coach.id}
                onClick={() => setCoachNumber(c.number)}
              >
                <span>Coach {c.number}</span>
                <b>{classes.find((v) => v.id === c.classId)?.name}</b>
              </button>
            ))}
        </nav>
        <p className="fineprint">
          Configured sample train overview. Select a coach to inspect its
          interior. No real train consist or live inventory is asserted.
        </p>
        {!selectedClass && (
          <p className="coach-evidence-note">
            Viewing another class; your existing choices are retained.{" "}
            <Link href="/booking/classes">Change class to book this coach</Link>
            .
          </p>
        )}
        <h3 className="coach-layout-name">{layoutTitle(layout)}</h3>
        <CoachMap
          key={`${leg.id}-${coach.id}`}
          layout={layout}
          coach={coach.number}
          amount={selectedClass ? (offer.quote?.amount ?? null) : null}
          selectingFor={selectedClass ? active.name : undefined}
          state={(p) => {
            if (!selectedClass) return { state: "unknown" };
            const seat = seatForPlace(leg, coach.number, p.id),
              person = owner(p);
            return {
              state:
                !seat || unavailable(booking, leg, seat)
                  ? "occupied"
                  : "available",
              gender: "unspecified",
              owner: person?.name,
              mine: person?.id === active.id,
            };
          }}
          onSelect={
            selectedClass
              ? (p) => {
                  const seat = seatForPlace(leg, coach.number, p.id);
                  if (seat) {
                    onChange(chooseSeat(booking, leg.id, active.id, seat));
                    onNotice(
                      `${p.label} · ${seatDescription(seat)} assigned to ${active.name} on the ${leg.id} leg.`,
                    );
                  }
                }
              : undefined
          }
          onRemove={
            selectedClass
              ? () => {
                  onChange(removeSeat(booking, leg.id, active.id));
                  onNotice(
                    `${active.name}’s ${leg.id} place removed. Choose another place when ready.`,
                  );
                }
              : undefined
          }
        />
      </section>
      <div className="coach-selection-help">
        <Info size={18} />
        <p>
          Availability is simulated and occupied places have unspecified gender.
          Your passenger’s gender is retained with their details; it is never
          used to guess another occupant’s gender.
        </p>
      </div>
    </div>
  );
}
