"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Armchair,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Info,
  LockKeyhole,
  MapPin,
  Plus,
  Printer,
  ShieldCheck,
  TrainFront,
  Trash2,
  Users,
  X,
} from "lucide-react";
import SearchForm from "./search-form";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { draftRequest, DraftRequestError } from "@/lib/draft-client";
import TicketPrint, { printTicketDocument } from "./ticket-print";
import VerifiedSeatSelection, { CoachClassChoices } from "./coach-booking";
import {
  customerDraft,
  destinationDraft,
  editedSearchDraft,
} from "@/lib/home-selection";
import {
  allocationIsTogether,
  availableSeats,
  Booking,
  changeLeg,
  chooseSeat,
  className,
  seatLabel,
  seatDescription,
  earliestStep,
  fare,
  freshBooking,
  Gender,
  genderOptions,
  Leg,
  money,
  Passenger,
  passengerErrors,
  prettyDate,
  pricing,
  recommend,
  restore,
  returnValid,
  Search,
  seatKey,
  Seat,
  seatsComplete,
  station,
  stations,
  trains,
  Train,
  unavailable,
  updatePassengers,
} from "@/lib/booking";
const steps = [
  "search",
  "trains",
  "classes",
  "passengers",
  "seats",
  "review",
  "payment",
  "confirmation",
];
const labels = [
  "Search",
  "Trains",
  "Class",
  "Passengers",
  "Seats",
  "Review",
  "Payment",
  "Confirmed",
];
const href = (n: number) => (n === 0 ? "/" : `/booking/${steps[n]}`);
const key = "designify-draft-v1";
export default function BookingApp({
  step,
  initialBooking,
}: {
  step: string;
  initialBooking?: Booking;
}) {
  const router = useRouter();
  const { data: accountSession } = authClient.useSession();
  const index = steps.indexOf(step);
  const [b, setB] = useState<Booking | null>(null);
  const [notice, setNotice] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [holdRemaining, setHoldRemaining] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [legId, setLegId] = useState<"outbound" | "return">("outbound");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("departure");
  const [selected, setSelected] = useState<Train | null>(null);
  const [details, setDetails] = useState("");
  const [activePid, setActivePid] = useState("");
  const [coach, setCoach] = useState("A");
  const [seatView, setSeatView] = useState("map");
  const [candidate, setCandidate] = useState<Seat | null>(null);
  const [voucher, setVoucher] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [undo, setUndo] = useState<Booking | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const paymentRef = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const seatTrigger = useRef<HTMLButtonElement | null>(null);
  const guardedStep = useRef("");
  const hydratedStep = useRef("");
  useEffect(() => {
    if (hydratedStep.current === step) return;
    hydratedStep.current = step;
    let next = freshBooking();
    let message = "";
    try {
      message = sessionStorage.getItem("designify-recovery") ?? "";
      sessionStorage.removeItem("designify-recovery");
      const raw = sessionStorage.getItem(key);
      if (raw) next = restore(raw);
      if (initialBooking) next = initialBooking;
      next = customerDraft(next);
      if (next.recoveryNotice) message = next.recoveryNotice;
      if (
        next.status === "draft" &&
        next.legs.some((l) => l.classId && !l.offer)
      ) {
        const staleLegs = next.legs
          .filter((l) => l.classId && !l.offer)
          .map((l) => l.id);
        next = {
          ...next,
          legs: next.legs.map((l) =>
            staleLegs.includes(l.id) ? { ...l, classId: "" } : l,
          ),
          assignments: Object.fromEntries(
            Object.entries(next.assignments).filter(
              ([k]) =>
                !staleLegs.includes(k.split(":")[0] as "outbound" | "return"),
            ),
          ),
          suggested: Object.fromEntries(
            Object.entries(next.suggested).filter(
              ([k]) =>
                !staleLegs.includes(k.split(":")[0] as "outbound" | "return"),
            ),
          ),
        };
        message =
          "Your earlier draft used a legacy seat layout. Choose a class and places again for the updated coach maps. Your trains, travellers and contact details are saved.";
      }
      if (step === "search") {
        const destination = new URLSearchParams(window.location.search).get(
          "destination",
        );
        if (destination && stations.some((s) => s.id === destination)) {
          next = destinationDraft(next, destination);
          message = `${station(destination)} selected as your destination. Choose your departure and check your travel dates.`;
        }
      }
    } catch {
      message =
        "Your saved draft could not be restored. Please start a new booking.";
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* Storage can be unavailable in private browser policies. */
      }
    }
    if (
      step === "seats" &&
      earliestStep(next) >= 4 &&
      !next.conflictHandled &&
      !next.legs.some((l) => l.offer)
    )
      next = recommend(next);
    queueMicrotask(() => {
      setB(next);
      setNotice(message);
      setActivePid(next.passengers[0]?.id ?? "");
      setVoucher(next.voucher);
    });
  }, [step, initialBooking]);
  useEffect(() => {
    if (b) {
      try {
        sessionStorage.setItem(key, JSON.stringify(b));
      } catch {
        queueMicrotask(() =>
          setNotice(
            "Your browser cannot save this draft. Keep this tab open while booking.",
          ),
        );
      }
    }
  }, [b]);
  useEffect(() => {
    if (!b || b.status !== "draft" || index === 6) return;
    const timer = setTimeout(() => {
      void draftRequest("save", { snapshot: b }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [b, index]);
  useEffect(() => {
    if (index !== 6) return;
    let active = true;
    const check = async () => {
      try {
        const row = await draftRequest("checkout");
        if (active && row) setHoldExpiresAt(row.holdExpiresAt);
      } catch (e) {
        if (active) {
          setCheckoutError(
            e instanceof Error ? e.message : "Your places need checking again.",
          );
          router.replace(
            e instanceof DraftRequestError && e.status === 401
              ? "/login?returnTo=/booking/payment"
              : "/booking/review?checkout=review",
          );
        }
      }
    };
    void check();
    const focus = () => void check();
    window.addEventListener("focus", focus);
    const interval = setInterval(focus, 30000);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", focus);
    };
  }, [index, router]);
  useEffect(() => {
    if (!holdExpiresAt) return;
    const tick = () =>
      setHoldRemaining(
        Math.max(
          0,
          Math.ceil((new Date(holdExpiresAt).getTime() - Date.now()) / 1000),
        ),
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [holdExpiresAt]);
  useEffect(() => {
    if (index === 7 && b?.accountBookingId)
      router.replace(`/account/bookings/${b.accountBookingId}`);
  }, [index, b?.accountBookingId, router]);
  useEffect(() => {
    if (!b || guardedStep.current === step) return;
    guardedStep.current = step;
    if (b.status === "paid" && index > 0 && index < 7) {
      router.replace(href(7));
      return;
    }
    const earliest = earliestStep(b);
    const max = b.status === "paid" ? 7 : earliest;
    if (index > max && !(index === 5 && max >= 5)) {
      try {
        sessionStorage.setItem(
          "designify-recovery",
          `Complete ${labels[max].toLowerCase()} before continuing. Your valid details are saved.`,
        );
      } catch {
        /* The recovery destination is still usable without storage. */
      }
      router.replace(href(max));
      return;
    }
    if (index === 7 && b.status !== "paid") {
      router.replace(href(earliest));
      return;
    }
    document.title = `${labels[index]} | Pakistan Railways`;
  }, [b, index, router, step]);
  useEffect(() => {
    if (candidate) {
      dialog.current?.showModal();
    } else if (dialog.current?.open) {
      dialog.current.close();
      seatTrigger.current?.focus();
    }
  }, [candidate]);
  const ready = !!b;
  const focusedBookingHash = useRef(false);
  useEffect(() => {
    if (
      step === "search" &&
      ready &&
      !focusedBookingHash.current &&
      window.location.hash === "#booking"
    ) {
      focusedBookingHash.current = true;
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLButtonElement>('#booking [data-field="from"]')
          ?.focus({ preventScroll: true }),
      );
    }
  }, [ready, step]);
  useEffect(() => {
    if (ready) heading.current?.focus();
  }, [ready, step]);
  const save = (next: Booking) => {
    setB(next);
    try {
      sessionStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* The persistence effect explains this to the traveller. */
    }
  };
  const go = (n: number) => {
    setError("");
    if (b) save(b);
    router.push(href(n));
  };
  const updateSearch = (search: Search) => {
    if (!b) return;
    save(editedSearchDraft(b, search));
    setSelected(null);
  };
  const search = async () => {
    if (!b || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const countsChanged =
      b.search.adults !==
        b.passengers.filter((p) => p.type === "adult").length ||
      b.search.children !==
        b.passengers.filter((p) => p.type === "child").length;
    let next: Booking = {
      ...b,
      legs: [] as Leg[],
      assignments: {},
      suggested: {},
      conflict: undefined,
      voucher: "",
      status: "draft" as const,
      reference: "",
      conflictHandled: false,
    };
    if (countsChanged) {
      const ps: Passenger[] = [];
      for (const type of ["adult", "child"] as const) {
        const existing = b.passengers.filter((p) => p.type === type);
        const count = type === "adult" ? b.search.adults : b.search.children;
        for (let i = 0; i < count; i++)
          ps.push(
            existing[i] ?? {
              id: `p-${type}-${i}-${Date.now()}`,
              name: "",
              type,
            },
          );
      }
      next = updatePassengers(next, ps);
    }
    // Searching starts a separate draft capability; completed or other-account
    // drafts remain stored and are never overwritten or attached by email.
    await draftRequest("detach").catch(() => {});
    delete next.accountBookingId;
    save(next);
    await new Promise((r) => setTimeout(r, 650));
    setBusy(false);
    busyRef.current = false;
    if (step === "trains") {
      setSelected(null);
      setLegId("outbound");
      setNotice(
        "Search updated. Choose your trains again; traveller details are saved.",
      );
    } else router.push(href(1));
  };
  const selectTrain = () => {
    if (!b || !selected) return;
    const existing = b.legs.find((l) => l.id === legId);
    const sameTrain =
      existing?.train.id === selected.id &&
      existing.train.date === selected.date &&
      existing.train.from === selected.from &&
      existing.train.to === selected.to;
    let next = changeLeg(b, {
      id: legId,
      train: selected,
      classId: sameTrain ? existing!.classId : "",
      ...(sameTrain && existing?.offer ? { offer: existing.offer } : {}),
    });
    if (legId === "outbound") {
      const r = next.legs.find((l) => l.id === "return");
      if (r && !returnValid(selected, r.train))
        next = {
          ...next,
          legs: next.legs.filter((l) => l.id !== "return"),
          assignments: Object.fromEntries(
            Object.entries(next.assignments).filter(
              ([k]) => !k.startsWith("return:"),
            ),
          ),
          suggested: Object.fromEntries(
            Object.entries(next.suggested).filter(
              ([k]) => !k.startsWith("return:"),
            ),
          ),
        };
    }
    save(next);
    setSelected(null);
    if (b.search.trip === "return" && legId === "outbound") {
      setLegId("return");
      setNotice("Outbound train saved. Now choose your return train.");
    } else goWith(next, 2);
  };
  const goWith = (next: Booking, n: number) => {
    save(next);
    router.push(href(n));
  };
  const requirePassengers = () => {
    if (!b) return;
    const errors = passengerErrors(b);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError("Check the highlighted traveller and contact details.");
      setTimeout(
        () => document.getElementById(Object.keys(errors)[0])?.focus(),
        0,
      );
      return;
    }
    goWith(recommend(b), 4);
  };
  const validateSeats = () => {
    if (!b) return;
    if (b.scenario === "seat-conflict" && !b.conflictHandled) {
      const assignments = { ...b.assignments };
      const pid = b.passengers[0].id;
      const lost = assignments[seatKey("outbound", pid)];
      delete assignments[seatKey("outbound", pid)];
      save({
        ...b,
        assignments,
        conflictHandled: true,
        conflict: lost ? { legId: "outbound", seat: lost } : undefined,
      });
      setLegId("outbound");
      setActivePid(pid);
      setError(
        `${b.passengers[0].name}’s outbound seat just became unavailable. Choose a replacement; your group’s other seats are retained.`,
      );
      return;
    }
    if (!seatsComplete(b)) {
      setError(
        "Choose a seat for every traveller on both legs before continuing.",
      );
      return;
    }
    go(5);
  };
  const beginCheckout = async (
    renew = false,
    authMode: "login" | "signup" = "login",
  ) => {
    if (!b || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setCheckoutError("");
    try {
      await draftRequest("save", { snapshot: b });
      const prepared = await draftRequest("prepare", { renew });
      setHoldExpiresAt(prepared?.holdExpiresAt ?? null);
      const { data: session } = await authClient.getSession();
      if (!session) {
        router.push(`/${authMode}?returnTo=/booking/payment`);
        return;
      }
      await draftRequest("claim");
      await draftRequest("checkout");
      go(6);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your saved booking service is unavailable.",
      );
      setCheckoutError(e instanceof DraftRequestError ? e.code : "");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const pay = async () => {
    if (!b || paymentRef.current) return;
    paymentRef.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await draftRequest("complete-simulation");
      if (!result) throw Error("Your booking could not be completed.");
      save(result.snapshot);
      router.push(`/account/bookings/${result.id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Test completion failed. No money was charged.",
      );
      if (e instanceof DraftRequestError && e.status === 401)
        router.push("/login?returnTo=/booking/payment");
    } finally {
      paymentRef.current = false;
      setBusy(false);
    }
  };
  const reset = () => {
    if (
      window.confirm(
        "Start a new booking? This will clear the current booking.",
      )
    ) {
      void draftRequest("detach").catch(() => {});
      save(freshBooking());
      router.push("/");
    }
  };
  useEffect(() => {
    if (step !== "search") return;
    const selectDestination = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (!stations.some((station) => station.id === id)) return;
      setB((current) => (current ? destinationDraft(current, id) : current));
      setNotice(
        `${station(id)} selected as your destination. Your dates and passenger counts are unchanged.`,
      );
      if (b?.search.from === id)
        setError(
          "Your departure matches this destination. Choose a different departure station.",
        );
      else setError("");
    };
    window.addEventListener("railway:destination", selectDestination);
    return () =>
      window.removeEventListener("railway:destination", selectDestination);
  }, [step, b?.search.from]);
  if (index === 0)
    return (
      <div className="home-booking-widget">
        {notice && (
          <p className="destination-notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        {b ? (
          <SearchForm
            value={b.search}
            onChange={updateSearch}
            onSearch={search}
            busy={busy}
          />
        ) : (
          <div className="booking-loading" role="status">
            Getting your journey ready…
          </div>
        )}
      </div>
    );
  if (!b || (index === 7 && b.accountBookingId))
    return (
      <div className="loading-shell">
        <TrainFront size={36} />
        <p>Getting your journey ready…</p>
      </div>
    );
  const totals = pricing(b);
  const leg = b.legs.find((l) => l.id === legId) ?? b.legs[0];
  const active =
    b.passengers.find((p) => p.id === activePid) ?? b.passengers[0];
  const count = b.passengers.length;
  let options = trains(b.search, legId).filter(
    (t) =>
      filter === "all" ||
      (filter === "morning"
        ? Number(t.departure.slice(0, 2)) < 12
        : filter === "afternoon"
          ? Number(t.departure.slice(0, 2)) >= 12 &&
            Number(t.departure.slice(0, 2)) < 18
          : Number(t.departure.slice(0, 2)) >= 18),
  );
  const outbound = b.legs.find((l) => l.id === "outbound");
  if (legId === "return" && outbound)
    options = options.filter((t) => returnValid(outbound.train, t));
  options.sort((a, c) =>
    sort === "price"
      ? a.price - c.price
      : a.departure.localeCompare(c.departure),
  );
  if (b.scenario === "empty") options = [];
  return (
    <>
      {index > 0 && (
        <div className="progress-wrap">
          <ol className="progress" aria-label="Booking progress">
            {labels.map((name, i) => (
              <li
                key={name}
                className={`${i === index ? "current" : ""} ${i < index ? "completed" : ""}`}
                aria-current={i === index ? "step" : undefined}
              >
                <button
                  disabled={b.status === "paid" || i > index || i === 7}
                  onClick={() => go(i)}
                >
                  <span>
                    {i < index ? (
                      <Check size={13} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <b>{name}</b>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
      <main id="main-content" className={`main ${index === 0 ? "home" : ""}`}>
        {notice && (
          <div className="alert info" role="status">
            <Info size={18} />
            <span>{notice}</span>
            <button
              className="icon-button"
              aria-label="Dismiss notice"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {error && (
          <div className="alert error" role="alert" tabIndex={-1}>
            <Info size={18} />
            <span>{error}</span>
          </div>
        )}
        {index > 0 && index < 7 && (
          <div className="page-heading">
            <div>
              <span className="eyebrow">YOUR JOURNEY, ONE STEP AT A TIME</span>
              <h1 ref={heading} tabIndex={-1}>
                {
                  [
                    "",
                    "Find your train",
                    "A little comfort goes a long way.",
                    "Who’s coming along?",
                    "A place for everyone.",
                    "Everything, just as you planned.",
                    "One last stop before you go.",
                  ][index]
                }
              </h1>
              <p>
                {
                  [
                    "",
                    "Choose a departure that works for you. Sample schedules and fares are shown.",
                    "Compare the available options for your journey.",
                    "Keep your group’s details together in one booking.",
                    "Review suggested places, including berth types and tiers. You can change or remove them.",
                    "Take a moment to check your journey and traveller details.",
                    "Test payment — no charge will be made.",
                  ][index]
                }
              </p>
            </div>
            <button className="text-button" onClick={() => go(index - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        )}
        {index === 1 && (
          <>
            <SearchForm
              compact
              value={b.search}
              onChange={updateSearch}
              onSearch={search}
              busy={busy}
            />
            <div className="content-grid">
              <section>
                {b.search.trip === "return" && (
                  <div className="tabs">
                    <button
                      className={legId === "outbound" ? "active" : ""}
                      onClick={() => {
                        setLegId("outbound");
                        setSelected(null);
                      }}
                    >
                      1. Outbound {outbound && <Check size={14} />}
                    </button>
                    <button
                      className={legId === "return" ? "active" : ""}
                      disabled={!outbound}
                      onClick={() => {
                        setLegId("return");
                        setSelected(null);
                      }}
                    >
                      2. Return
                    </button>
                  </div>
                )}
                {legId === "return" && outbound && (
                  <div className="alert info">
                    <Check size={17} /> Outbound saved: {outbound.train.name},{" "}
                    {outbound.train.departure} ·{" "}
                    {prettyDate(outbound.train.date)}
                  </div>
                )}
                <p className="subtle" role="note">
                  Prototype timetable, fares and seats. Station catalogue
                  results do not confirm a bookable railway service.
                </p>
                <div className="results-tools">
                  <span role="status">
                    <b>{options.length} trains</b> ·{" "}
                    {prettyDate(
                      legId === "outbound"
                        ? b.search.date
                        : b.search.returnDate,
                    )}
                  </span>
                  <label>
                    Departure{" "}
                    <select
                      aria-label="Departure time filter"
                      value={filter}
                      onChange={(e) => {
                        setFilter(e.target.value);
                        setSelected(null);
                      }}
                    >
                      <option value="all">Any time</option>
                      <option value="morning">Morning · before 12</option>
                      <option value="afternoon">Afternoon · 12–18</option>
                      <option value="evening">Evening · after 18</option>
                    </select>
                  </label>
                  <label>
                    Sort{" "}
                    <select
                      aria-label="Sort trains"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="departure">Departure</option>
                      <option value="price">Lowest fare</option>
                    </select>
                  </label>
                </div>
                {busy ? (
                  <div className="empty-state" role="status">
                    Finding your trains…
                  </div>
                ) : b.scenario === "search-error" ? (
                  <div className="empty-state">
                    <TrainFront />
                    <h2>We couldn’t load the trains.</h2>
                    <p>Your search is saved. Give it another try.</p>
                    <button
                      className="button primary"
                      onClick={() => {
                        save({ ...b, scenario: "normal" });
                        setNotice(
                          "Search restored. Available trains are shown below.",
                        );
                      }}
                    >
                      Retry search
                    </button>
                  </div>
                ) : !options.length ? (
                  <div className="empty-state">
                    <TrainFront size={32} />
                    <h2>No trains for this search.</h2>
                    <p>Try another date or clear the departure-time filter.</p>
                    <button
                      className="button secondary"
                      onClick={() => {
                        setFilter("all");
                        save({ ...b, scenario: "normal" });
                      }}
                    >
                      Clear filters and retry
                    </button>
                    <button className="text-button" onClick={() => go(0)}>
                      Change journey
                    </button>
                  </div>
                ) : (
                  <div
                    className="train-list"
                    role="radiogroup"
                    aria-label={`Choose ${legId} train`}
                  >
                    {options.map((t) => (
                      <article
                        key={t.id}
                        className={`train-card ${selected?.id === t.id ? "selected" : ""}`}
                      >
                        <div className="train-card-top">
                          <span>
                            <TrainFront size={17} /> <b>{t.name}</b>
                            <small>
                              SAMPLE SERVICE · {t.id.slice(-1).padStart(2, "0")}
                            </small>
                          </span>
                          <span className="service-tag">Direct journey</span>
                        </div>
                        <label className="train-radio">
                          <input
                            type="radio"
                            name="train"
                            aria-label={`Select ${t.name}, ${t.departure}, ${money(t.price)} per person`}
                            checked={selected?.id === t.id}
                            onChange={() => setSelected(t)}
                          />
                          <span className="journey-line">
                            <span>
                              <b>{t.departure}</b>
                              <small>{station(t.from, b.search)}</small>
                            </span>
                            <span className="duration">
                              <small>
                                {Math.floor(t.duration / 60)}h {t.duration % 60}
                                m
                              </small>
                              <span />
                              <small>Direct</small>
                            </span>
                            <span>
                              <b>
                                {t.arrival}
                                {t.arrivalDay > 0 && <sup>+{t.arrivalDay}</sup>}
                              </b>
                              <small>{station(t.to, b.search)}</small>
                            </span>
                          </span>
                          <span className="fare">
                            <b>{money(t.price)}</b>
                            <small>per person · Economy Class</small>
                          </span>
                        </label>
                        <div className="train-card-bottom">
                          <button
                            className="text-button"
                            aria-expanded={details === t.id}
                            onClick={() =>
                              setDetails(details === t.id ? "" : t.id)
                            }
                          >
                            Journey details <ChevronDown size={14} />
                          </button>
                          <span>
                            {count} traveller{count > 1 ? "s" : ""} ·{" "}
                            {legId === "outbound" ? "Outbound" : "Return"}{" "}
                            <span
                              className={`selection-dot ${selected?.id === t.id ? "checked" : ""}`}
                            >
                              {selected?.id === t.id && <Check size={12} />}
                            </span>
                          </span>
                        </div>
                        {details === t.id && (
                          <p className="details-copy">
                            Illustrative direct service. Arrives{" "}
                            {prettyDate(
                              t.arrivalDay
                                ? new Date(
                                    new Date(`${t.date}T12:00:00Z`).getTime() +
                                      t.arrivalDay * 86400000,
                                  )
                                    .toISOString()
                                    .slice(0, 10)
                                : t.date,
                            )}
                            . Class amenities, capacity and timetable are sample
                            fixtures.
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
                {selected && (
                  <div className="selection-bar">
                    <span>
                      <small>YOUR {legId.toUpperCase()} TRAIN</small>
                      <b>
                        {selected.name} · {selected.departure}
                      </b>
                    </span>
                    <button className="button primary" onClick={selectTrain}>
                      Book this train <ArrowRight size={17} />
                    </button>
                  </div>
                )}
              </section>
              <aside>
                <RoutePreview
                  search={b.search}
                  from={legId === "outbound" ? b.search.from : b.search.to}
                  to={legId === "outbound" ? b.search.to : b.search.from}
                />
                <div className="side-note">
                  <ShieldCheck size={23} />
                  <h3>Room for the whole group.</h3>
                  <p>
                    Your passenger count carries through your booking. Choose
                    your class next, then we’ll help you find seats together.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
        {index === 2 && (
          <>
            <LegTabs b={b} current={legId} onChange={setLegId} />
            {leg && (
              <>
                <div className="context-line">
                  <TrainFront size={18} />
                  <b>{leg.train.name}</b>
                  <span>
                    {station(leg.train.from, b.search)} →{" "}
                    {station(leg.train.to, b.search)}
                  </span>
                  <span>
                    {prettyDate(leg.train.date)} · {count} traveller
                    {count > 1 ? "s" : ""}
                  </span>
                </div>
                <CoachClassChoices
                  key={`${leg.id}-${leg.train.id}-${leg.train.date}`}
                  booking={b}
                  leg={leg}
                  onChange={save}
                  onNotice={setNotice}
                />
                <div className="action-row">
                  <button className="text-button" onClick={() => go(1)}>
                    Change train
                  </button>
                  <button
                    className="button primary"
                    disabled={!b.legs.every((l) => l.classId)}
                    onClick={() => go(3)}
                  >
                    Continue to passengers <ArrowRight size={17} />
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {index === 3 && (
          <div className="content-grid">
            <section className="passenger-form">
              <div className="section-label">
                <h2>
                  Your travellers <span>{count}</span>
                </h2>
                <span>1 seat per traveller</span>
              </div>
              {b.passengers.map((p, i) => (
                <article className="panel passenger-card" key={p.id}>
                  <div className="panel-heading">
                    <h3>
                      <span className="number-badge">{i + 1}</span> Traveller{" "}
                      {i + 1}
                    </h3>
                    <button
                      className="text-button"
                      disabled={p.type === "adult" && b.search.adults === 1}
                      aria-label={`Remove traveller ${i + 1}`}
                      onClick={() => {
                        setUndo(b);
                        save(
                          updatePassengers(
                            b,
                            b.passengers.filter((v) => v.id !== p.id),
                          ),
                        );
                        setNotice(
                          "Traveller removed and their seats released. Use Undo below to restore.",
                        );
                      }}
                    >
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>
                  <div className="form-row">
                    <label>
                      Full name
                      <input
                        id={p.id}
                        className={`input ${fieldErrors[p.id] ? "invalid" : ""}`}
                        value={p.name}
                        aria-invalid={!!fieldErrors[p.id]}
                        aria-describedby={
                          fieldErrors[p.id] ? `${p.id}-error` : undefined
                        }
                        placeholder="Traveller’s full name"
                        autoComplete="off"
                        onChange={(e) =>
                          save(
                            updatePassengers(
                              b,
                              b.passengers.map((v) =>
                                v.id === p.id
                                  ? { ...v, name: e.target.value }
                                  : v,
                              ),
                            ),
                          )
                        }
                      />
                      {fieldErrors[p.id] && (
                        <small id={`${p.id}-error`} className="error-text">
                          {fieldErrors[p.id]}
                        </small>
                      )}
                    </label>
                    <label>
                      Traveller type
                      <select
                        className="input"
                        aria-label={`Traveller ${i + 1} type`}
                        value={p.type}
                        onChange={(e) => {
                          if (p.type === "adult" && b.search.adults === 1) {
                            setError(
                              "At least one adult must remain in your group.",
                            );
                            return;
                          }
                          save(
                            updatePassengers(
                              b,
                              b.passengers.map((v) =>
                                v.id === p.id
                                  ? {
                                      ...v,
                                      type: e.target.value as "adult" | "child",
                                    }
                                  : v,
                              ),
                            ),
                          );
                        }}
                      >
                        <option value="adult">Adult</option>
                        <option value="child">Child</option>
                      </select>
                    </label>
                    <label htmlFor={`${p.id}-gender`}>
                      Gender
                      <select
                        id={`${p.id}-gender`}
                        className={`input ${fieldErrors[`${p.id}-gender`] ? "invalid" : ""}`}
                        aria-label={`Passenger ${i + 1} gender`}
                        aria-invalid={!!fieldErrors[`${p.id}-gender`]}
                        aria-describedby={
                          fieldErrors[`${p.id}-gender`]
                            ? `${p.id}-gender-error`
                            : undefined
                        }
                        value={p.gender ?? ""}
                        required
                        onChange={(e) =>
                          save(
                            updatePassengers(
                              b,
                              b.passengers.map((v) =>
                                v.id === p.id
                                  ? { ...v, gender: e.target.value as Gender }
                                  : v,
                              ),
                            ),
                          )
                        }
                      >
                        <option value="" disabled>
                          Select gender
                        </option>
                        {genderOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors[`${p.id}-gender`] && (
                        <small
                          id={`${p.id}-gender-error`}
                          className="error-text"
                        >
                          {fieldErrors[`${p.id}-gender`]}
                        </small>
                      )}
                    </label>
                  </div>
                </article>
              ))}
              {undo && (
                <button
                  className="button secondary"
                  onClick={() => {
                    save(undo);
                    setUndo(null);
                    setNotice("Traveller and seat assignments restored.");
                  }}
                >
                  Undo traveller removal
                </button>
              )}
              <div className="add-traveller">
                <span>Add someone to the journey</span>
                {(["adult", "child"] as const).map((type) => (
                  <button
                    key={type}
                    disabled={count >= 6}
                    className="button secondary"
                    onClick={() =>
                      save(
                        updatePassengers(b, [
                          ...b.passengers,
                          { id: crypto.randomUUID(), name: "", type },
                        ]),
                      )
                    }
                  >
                    <Plus size={16} /> Add {type}
                  </button>
                ))}
              </div>
              <article className="panel">
                <h2>Booking contact</h2>
                <p className="subtle">
                  Add a contact for your booking summary. No email will be sent.
                </p>
                <div className="form-row">
                  {(["name", "email"] as const).map((k) => (
                    <label key={k}>
                      {k === "name" ? "Contact name" : "Email address"}
                      <input
                        id={k === "name" ? "contactName" : "contactEmail"}
                        className="input"
                        type={k === "email" ? "email" : "text"}
                        aria-invalid={
                          !!fieldErrors[
                            k === "name" ? "contactName" : "contactEmail"
                          ]
                        }
                        aria-describedby={
                          fieldErrors[
                            k === "name" ? "contactName" : "contactEmail"
                          ]
                            ? `contact-${k}-error`
                            : undefined
                        }
                        autoComplete="off"
                        placeholder={
                          k === "name"
                            ? "e.g. Ayesha Khan"
                            : "e.g. ayesha@example.com"
                        }
                        value={b.contact[k]}
                        onChange={(e) =>
                          save({
                            ...b,
                            contact: { ...b.contact, [k]: e.target.value },
                          })
                        }
                      />
                      {fieldErrors[
                        k === "name" ? "contactName" : "contactEmail"
                      ] && (
                        <small id={`contact-${k}-error`} className="error-text">
                          {
                            fieldErrors[
                              k === "name" ? "contactName" : "contactEmail"
                            ]
                          }
                        </small>
                      )}
                    </label>
                  ))}
                </div>
                <button
                  className="text-button"
                  disabled={!b.contact.name.trim()}
                  onClick={() =>
                    save(
                      updatePassengers(
                        b,
                        b.passengers.map((p, i) =>
                          i === 0 ? { ...p, name: b.contact.name } : p,
                        ),
                      ),
                    )
                  }
                >
                  Use contact name for Traveller 1
                </button>
              </article>
              <div className="action-row">
                <span className="fineprint">
                  <LockKeyhole size={14} /> For this booking summary
                </span>
                <button className="button primary" onClick={requirePassengers}>
                  Continue to seats <ArrowRight size={17} />
                </button>
              </div>
            </section>
            <aside>
              <Summary b={b} />
            </aside>
          </div>
        )}
        {index === 4 && (
          <>
            <LegTabs
              b={b}
              current={legId}
              onChange={(v) => {
                setLegId(v);
                setCoach("A");
              }}
            />
            {leg && (
              <>
                <div className="context-line">
                  <TrainFront size={18} />
                  <b>{leg.train.name}</b>
                  <span>
                    {className(leg)} · {prettyDate(leg.train.date)}
                  </span>
                  <span>
                    {station(leg.train.from, b.search)} →{" "}
                    {station(leg.train.to, b.search)}
                  </span>
                </div>
                {leg.offer ? (
                  <VerifiedSeatSelection
                    key={leg.id}
                    booking={b}
                    leg={leg}
                    onChange={save}
                    onNotice={setNotice}
                  />
                ) : (
                  <div className="seat-layout">
                    <section className="panel traveller-seats">
                      <span className="eyebrow">YOUR GROUP</span>
                      <h2>Who’s sitting where?</h2>
                      <p className="subtle">
                        Choose a traveller to change their seat.
                      </p>
                      {b.passengers.map((p, i) => {
                        const s = b.assignments[seatKey(leg.id, p.id)];
                        return (
                          <button
                            key={p.id}
                            className={`passenger-seat ${active.id === p.id ? "active" : ""}`}
                            aria-pressed={active.id === p.id}
                            onClick={() => setActivePid(p.id)}
                          >
                            <span className="number-badge">{i + 1}</span>
                            <span>
                              <b>{p.name}</b>
                              <small>
                                {p.type === "adult" ? "Adult" : "Child"} ·{" "}
                                {s
                                  ? `Coach ${s.coach}, seat ${s.number}`
                                  : "Choose a replacement seat"}
                              </small>
                            </span>
                            {s ? <Check size={17} /> : <Info size={17} />}
                          </button>
                        );
                      })}
                      <div className="assignment-count" role="status">
                        <CheckCheck size={17} />
                        {
                          b.passengers.filter(
                            (p) => b.assignments[seatKey(leg.id, p.id)],
                          ).length
                        }{" "}
                        of {count} seats selected for this leg
                      </div>
                      <div className="recommend-note">
                        <Info size={17} />
                        <p>
                          {b.passengers.every(
                            (p) => b.assignments[seatKey(leg.id, p.id)],
                          )
                            ? "Suggested seats are selected and editable. "
                            : "Choose a replacement for the unassigned traveller. "}
                          {!allocationIsTogether(b, leg.id) && seatsComplete(b)
                            ? "Seats together were unavailable in one row or coach; review your group’s assignments."
                            : "You’re free to make yourself comfortable elsewhere."}
                        </p>
                      </div>
                    </section>
                    <section className="panel coach-panel">
                      <div className="panel-heading">
                        <div>
                          <span className="eyebrow">CHOOSE YOUR PLACE</span>
                          <h2>Coach {coach}</h2>
                        </div>
                        <label>
                          Coach{" "}
                          <select
                            aria-label="Choose coach"
                            value={coach}
                            onChange={(e) => setCoach(e.target.value)}
                          >
                            <option>A</option>
                            <option>B</option>
                          </select>
                        </label>
                      </div>
                      <div className="seat-legend">
                        <span>
                          <i className="legend-free" /> Free
                        </span>
                        <span>
                          <i className="legend-selected">✓</i> Selected
                        </span>
                        <span>
                          <i className="legend-sold">×</i> Sold
                        </span>
                        <span>☆ Suggested</span>
                      </div>
                      <div className="view-tabs">
                        <button
                          className={seatView === "map" ? "active" : ""}
                          onClick={() => setSeatView("map")}
                        >
                          Seat map
                        </button>
                        <button
                          className={seatView === "list" ? "active" : ""}
                          onClick={() => setSeatView("list")}
                        >
                          Text selection
                        </button>
                      </div>
                      <p className="fineprint">
                        Selecting for <b>{active.name}</b> · {money(fare(leg))}{" "}
                        / seat · no extra seat fee
                      </p>
                      {seatView === "map" ? (
                        <div
                          className="coach-scroll"
                          role="region"
                          aria-label="Schematic coach seat map"
                          tabIndex={0}
                        >
                          <div className="coach">
                            <div className="coach-top">
                              <span>WC</span>
                              <span>FRONT OF COACH ↑</span>
                              <span>DOOR</span>
                            </div>
                            <div className="seat-grid">
                              {Array.from({ length: 16 }, (_, i) => {
                                const n = i + 1;
                                const owner = b.passengers.find((p) => {
                                  const v =
                                    b.assignments[seatKey(leg.id, p.id)];
                                  return v?.coach === coach && v.number === n;
                                });
                                const taken = unavailable(b, leg, {
                                  coach,
                                  number: n,
                                });
                                const suggested =
                                  owner &&
                                  b.suggested[seatKey(leg.id, owner.id)]
                                    ?.coach === coach &&
                                  b.suggested[seatKey(leg.id, owner.id)]
                                    ?.number === n;
                                return (
                                  <button
                                    key={n}
                                    className={`seat ${owner ? "assigned" : ""} ${taken ? "sold" : ""} ${i % 4 === 1 ? "before-aisle" : ""}`}
                                    disabled={
                                      taken ||
                                      (!!owner && owner.id !== active.id)
                                    }
                                    aria-label={`Coach ${coach}, seat ${n}, ${taken ? "Sold" : owner ? `selected for ${owner.name}` : "Free"}, ${money(fare(leg))}${suggested ? ", recommended" : ""}`}
                                    onClick={(e) => {
                                      seatTrigger.current = e.currentTarget;
                                      setCandidate({ coach, number: n });
                                    }}
                                  >
                                    <span className="seat-shape">
                                      <Armchair size={32} />
                                      {owner && (
                                        <b>{b.passengers.indexOf(owner) + 1}</b>
                                      )}
                                      {taken && <span>×</span>}
                                    </span>
                                    <b>{n}</b>
                                    <small>
                                      {taken
                                        ? "Sold"
                                        : owner
                                          ? "✓ Selected"
                                          : "Free"}
                                    </small>
                                    {suggested && <em>☆ Suggested</em>}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="coach-bottom">
                              SCHEMATIC SEAT LAYOUT
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="seat-list">
                          {availableSeats(leg.classId)
                            .filter(
                              (s) =>
                                s.coach === coach && !unavailable(b, leg, s),
                            )
                            .map((s) => {
                              const owner = b.passengers.find((p) => {
                                const v = b.assignments[seatKey(leg.id, p.id)];
                                return (
                                  v?.coach === s.coach && v.number === s.number
                                );
                              });
                              return (
                                <button
                                  className="button secondary"
                                  key={s.number}
                                  disabled={!!owner && owner.id !== active.id}
                                  onClick={(e) => {
                                    seatTrigger.current = e.currentTarget;
                                    setCandidate(s);
                                  }}
                                >
                                  Coach {s.coach} · Seat {s.number} ·{" "}
                                  {owner ? owner.name : "Free"} ·{" "}
                                  {money(fare(leg))}
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </section>
                    <aside>
                      <Summary b={b} />
                    </aside>
                  </div>
                )}
                <div className="action-row">
                  <span className="fineprint">
                    <ShieldCheck size={15} /> Suggested seats are editable, with
                    no additional fee.
                  </span>
                  <button className="button primary" onClick={validateSeats}>
                    Review booking <ArrowRight size={17} />
                  </button>
                </div>
              </>
            )}
            <dialog
              ref={dialog}
              className="seat-dialog"
              aria-labelledby="seat-dialog-title"
              onCancel={(e) => {
                e.preventDefault();
                setCandidate(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  const controls =
                    dialog.current?.querySelectorAll<HTMLButtonElement>(
                      "button",
                    );
                  if (controls) {
                    const first = controls[0],
                      last = controls[controls.length - 1];
                    if (e.shiftKey && document.activeElement === first) {
                      e.preventDefault();
                      last.focus();
                    } else if (!e.shiftKey && document.activeElement === last) {
                      e.preventDefault();
                      first.focus();
                    }
                  }
                }
              }}
            >
              {candidate && leg && (
                <>
                  <div className="panel-heading">
                    <span className="eyebrow">MAKE IT YOURS</span>
                    <button
                      className="icon-button"
                      aria-label="Close seat details"
                      onClick={() => setCandidate(null)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <span className="dialog-seat">
                    <Armchair size={48} />
                  </span>
                  <h2 id="seat-dialog-title">
                    Coach {candidate.coach}, seat {candidate.number}
                  </h2>
                  <p>
                    For {active.name}.{" "}
                    {(candidate.number - 1) % 4 === 0 ||
                    candidate.number % 4 === 0
                      ? "Window-side"
                      : "Aisle-side"}{" "}
                    seat in this schematic layout.
                  </p>
                  <div className="dialog-fare">
                    <span>Fare per traveller</span>
                    <b>{money(fare(leg))}</b>
                  </div>
                  <p className="fineprint">
                    Included in your class fare. Your previous seat stays
                    selected until you confirm.
                  </p>
                  <div className="action-row">
                    <button
                      className="button secondary"
                      onClick={() => setCandidate(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="button primary"
                      onClick={() => {
                        save(chooseSeat(b, leg.id, active.id, candidate));
                        setCandidate(null);
                        setNotice(
                          `Seat ${candidate.coach}${candidate.number} assigned to ${active.name}.`,
                        );
                      }}
                    >
                      Confirm seat <Check size={17} />
                    </button>
                  </div>
                </>
              )}
            </dialog>
          </>
        )}
        {(index === 5 || index === 6) && (
          <div className="content-grid">
            <section>
              {b.legs.map((l) => (
                <article className="panel review-journey" key={l.id}>
                  <div className="panel-heading">
                    <span className="eyebrow">
                      {l.id === "outbound"
                        ? "OUTBOUND JOURNEY"
                        : "RETURN JOURNEY"}
                    </span>
                    <button className="text-button" onClick={() => go(1)}>
                      Edit train
                    </button>
                  </div>
                  <h2>
                    {station(l.train.from, b.search)} <ArrowRight size={19} />{" "}
                    {station(l.train.to, b.search)}
                  </h2>
                  <div className="review-meta">
                    <span>
                      <CalendarIcon /> {prettyDate(l.train.date)}
                    </span>
                    <span>
                      <Clock size={16} />
                      {l.train.departure} – {l.train.arrival}
                      {l.train.arrivalDay
                        ? ` (+${l.train.arrivalDay} day)`
                        : ""}
                    </span>
                  </div>
                  <p>
                    <TrainFront size={17} />
                    {l.train.name} <span className="pill">{className(l)}</span>
                    <button className="text-button" onClick={() => go(2)}>
                      Edit class
                    </button>
                  </p>
                  <div className="traveller-table">
                    {b.passengers.map((p) => {
                      const s = b.assignments[seatKey(l.id, p.id)];
                      return (
                        <div key={p.id}>
                          <span>
                            <Users size={15} />
                            <b>{p.name}</b>
                            <small>{p.type}</small>
                          </span>
                          <span>
                            Coach {s?.coach} · Place {s ? seatLabel(s) : "—"} ·{" "}
                            {s && seatDescription(s)}
                          </span>
                          <b>{money(fare(l))}</b>
                        </div>
                      );
                    })}
                  </div>
                  <div className="review-edits">
                    <button className="text-button" onClick={() => go(3)}>
                      Edit travellers
                    </button>
                    <button className="text-button" onClick={() => go(4)}>
                      Change seats
                    </button>
                  </div>
                </article>
              ))}
              <article className="panel">
                <div className="panel-heading">
                  <h2>Booking contact</h2>
                  <button className="text-button" onClick={() => go(3)}>
                    Edit
                  </button>
                </div>
                <p>
                  {b.contact.name} · {b.contact.email}
                </p>
                <small className="subtle">
                  No confirmation email will be sent.
                </small>
              </article>
              {index === 5 ? (
                <article className="panel">
                  <h3>Have a voucher?</h3>
                  <p className="subtle">
                    Enter your voucher code to check for a discount.
                  </p>
                  <div className="voucher-row">
                    <input
                      className="input"
                      aria-label="Voucher code"
                      value={voucher}
                      onChange={(e) => setVoucher(e.target.value)}
                      placeholder="Enter code"
                    />
                    <button
                      className="button secondary"
                      onClick={() => {
                        if (voucher.trim().toUpperCase() === "DEMO10") {
                          save({ ...b, voucher: "DEMO10" });
                          setError("");
                          setNotice("Voucher applied: 10% off your base fare.");
                        } else
                          setError(
                            "That voucher is not available. Check the code or continue at full price.",
                          );
                      }}
                    >
                      Apply
                    </button>
                    {b.voucher && (
                      <button
                        className="text-button"
                        onClick={() => {
                          save({ ...b, voucher: "" });
                          setVoucher("");
                          setNotice("Voucher removed. Full fare restored.");
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </article>
              ) : (
                <article className="panel payment-panel">
                  <span className="payment-icon">
                    <LockKeyhole size={25} />
                  </span>
                  <h2>Test payment</h2>
                  <p role="status">
                    Place hold: {Math.floor(holdRemaining / 60)}:
                    {String(holdRemaining % 60).padStart(2, "0")} remaining.
                    Signing in does not extend it.
                  </p>
                  {holdExpiresAt && holdRemaining === 0 && (
                    <p className="error-text">
                      Your hold expired. Return to review to check your places
                      again.
                    </p>
                  )}
                  <p>
                    No money will be charged. No card or bank details are
                    needed.
                  </p>
                  <div className="mock-method">
                    <span>
                      <Check size={18} /> Simulated payment method
                    </span>
                    <ShieldCheck size={21} />
                  </div>
                  <small>
                    Test payment confirmation for your booking summary.
                  </small>
                </article>
              )}
              {index === 5 && (
                <div className="checkout-notice">
                  <p>
                    {accountSession
                      ? "You are signed in. Your saved journey will be checked before payment."
                      : "Log in or create an account before payment. Your journey and traveller details stay saved."}{" "}
                    Places are held for ten minutes when you continue.
                  </p>
                  <p>
                    <Link
                      href="/login?returnTo=/booking/payment"
                      onClick={(e) => {
                        e.preventDefault();
                        void beginCheckout();
                      }}
                    >
                      Log in
                    </Link>{" "}
                    ·{" "}
                    <Link
                      href="/signup?returnTo=/booking/payment"
                      onClick={(e) => {
                        e.preventDefault();
                        void beginCheckout(false, "signup");
                      }}
                    >
                      Create account
                    </Link>
                  </p>
                  {checkoutError === "HOLD_EXPIRED" && (
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => void beginCheckout(true)}
                    >
                      Check my places again
                    </button>
                  )}
                  <Link href="/booking/seats">Review or change places</Link>
                </div>
              )}
              <div className="action-row">
                <button className="text-button" onClick={() => go(index - 1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={
                    index === 5
                      ? () => {
                          if (earliestStep(b) < 6) {
                            go(earliestStep(b));
                            return;
                          }
                          void beginCheckout();
                        }
                      : pay
                  }
                >
                  {index === 5 ? (
                    <>
                      Proceed to payment <ArrowRight size={17} />
                    </>
                  ) : busy ? (
                    "Processing test payment…"
                  ) : (
                    `${error ? "Retry payment" : "Pay"} ${money(totals.total)} — test`
                  )}
                </button>
              </div>
              <p className="fineprint" role="status">
                {busy
                  ? "Please keep this page open while the test payment is processed."
                  : ""}
              </p>
            </section>
            <aside>
              <Summary b={b} />
              <div className="side-note">
                <ShieldCheck size={23} />
                <h3>Everything in one place.</h3>
                <p>
                  Your train, class, group and seats are saved as you move
                  through your booking.
                </p>
              </div>
            </aside>
          </div>
        )}
        {index === 7 && b.status === "paid" && (
          <>
            <TicketPrint booking={b} />
            <section className="confirmation-heading">
              <span className="confirmation-check">
                <Check size={32} />
              </span>
              <span className="eyebrow">YOUR JOURNEY DETAILS</span>
              <h1 ref={heading} tabIndex={-1}>
                Your booking summary.
              </h1>
              <p>
                Good journeys begin with good company. Here are all your
                details.
              </p>
              <span className="reference">
                BOOKING REFERENCE <b>{b.reference}</b>
              </span>
            </section>
            <div className="content-grid">
              <section>
                {b.legs.map((l) => (
                  <article className="confirmation-ticket" key={l.id}>
                    <div className="ticket-header">
                      <span>
                        <TrainFront size={19} /> Pakistan Railways
                      </span>
                      <span>{l.id.toUpperCase()} · JOURNEY SUMMARY</span>
                    </div>
                    <div className="ticket-body">
                      <span className="eyebrow">
                        {l.train.name} · {className(l)}
                      </span>
                      <h2>
                        {station(l.train.from, b.search)}{" "}
                        <ArrowRight size={20} /> {station(l.train.to, b.search)}
                      </h2>
                      <p>
                        {prettyDate(l.train.date)} · {l.train.departure} →{" "}
                        {l.train.arrival}
                        {l.train.arrivalDay
                          ? ` (+${l.train.arrivalDay} day)`
                          : ""}
                      </p>
                      {b.passengers.map((p) => {
                        const s = b.assignments[seatKey(l.id, p.id)];
                        return (
                          <div className="confirmation-traveller" key={p.id}>
                            <span>
                              <b>{p.name}</b>
                              <small>{p.type} · 1 ticket</small>
                            </span>
                            <span>
                              Coach <b>{s?.coach}</b>
                            </span>
                            <span>
                              Place <b>{s ? seatLabel(s) : "—"}</b>
                              <small>
                                {s && seatDescription(s)} · {money(fare(l))}
                              </small>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="ticket-footer">
                      <span>TEST PAYMENT COMPLETED</span>
                      <b>Not valid for travel</b>
                    </div>
                  </article>
                ))}
                <div className="panel">
                  <h3>Booking contact</h3>
                  <p>
                    {b.contact.name} · {b.contact.email}
                  </p>
                  <small>
                    No email has been sent. Print or save this summary for your
                    records.
                  </small>
                </div>
                <div className="action-row no-print">
                  <button
                    className="button secondary"
                    onClick={async () => {
                      if (busyRef.current) return;
                      busyRef.current = true;
                      try {
                        await printTicketDocument();
                      } catch {
                        setError(
                          "Your ticket could not be prepared. Check the logo has loaded and try again.",
                        );
                      } finally {
                        busyRef.current = false;
                      }
                    }}
                  >
                    <Printer size={17} /> Print ticket
                  </button>
                  <button className="button primary" onClick={reset}>
                    Start new booking <ArrowRight size={17} />
                  </button>
                </div>
              </section>
              <aside>
                <Summary b={b} />
              </aside>
            </div>
          </>
        )}
      </main>
    </>
  );
}
function CalendarIcon() {
  return <Clock size={16} />;
}
function RoutePreview({
  from,
  to,
  search,
}: {
  from: string;
  to: string;
  search: Search;
}) {
  return (
    <div className="panel route-preview">
      <span className="eyebrow">YOUR JOURNEY AT A GLANCE</span>
      <h2>Route summary</h2>
      <div className="route-placeholder">
        <div className="route-stations">
          <span>
            <i />
            {station(from, search)}
          </span>
          <span>
            <i />
            {station(to, search)}
          </span>
        </div>
        <MapPin size={58} strokeWidth={1} />
      </div>
      <p>Your origin and destination, together in one view.</p>
    </div>
  );
}
function LegTabs({
  b,
  current,
  onChange,
}: {
  b: Booking;
  current: string;
  onChange: (v: "outbound" | "return") => void;
}) {
  if (b.search.trip !== "return") return null;
  return (
    <div className="tabs" aria-label="Journey leg">
      {b.legs.map((l) => (
        <button
          key={l.id}
          className={current === l.id ? "active" : ""}
          aria-pressed={current === l.id}
          onClick={() => onChange(l.id)}
        >
          {l.id === "outbound" ? "Outbound" : "Return"} ·{" "}
          {prettyDate(l.train.date)}
          {l.classId && <Check size={15} />}
        </button>
      ))}
    </div>
  );
}
function Summary({ b }: { b: Booking }) {
  const p = pricing(b);
  return (
    <div className="panel booking-summary">
      <span className="eyebrow">ALL THE LITTLE DETAILS</span>
      <h2>Your journey</h2>
      {b.legs.map((l) => (
        <div className="summary-leg" key={l.id}>
          <span className="summary-leg-type">
            {l.id === "outbound" ? "OUTBOUND" : "RETURN"}
          </span>
          <h3>
            {station(l.train.from, b.search)}
            <ArrowRight size={16} />
            {station(l.train.to, b.search)}
          </h3>
          <p>
            {prettyDate(l.train.date)} · {l.train.departure}
          </p>
          <small>
            {l.train.name} · {className(l)}
          </small>
        </div>
      ))}
      <div className="summary-count">
        <Users size={17} />
        {b.passengers.length} traveller{b.passengers.length > 1 ? "s" : ""} ·{" "}
        {b.search.adults} adult{b.search.adults > 1 ? "s" : ""}
        {b.search.children
          ? `, ${b.search.children} child${b.search.children > 1 ? "ren" : ""}`
          : ""}
      </div>
      <div className="price-lines">
        <span>
          Base fare <b>{money(p.base)}</b>
        </span>
        <span>
          Seat selection <b>Included</b>
        </span>
        {p.discount > 0 && (
          <span className="discount">
            Voucher · 10% off <b>− {money(p.discount)}</b>
          </span>
        )}
      </div>
      <div className="summary-total">
        <span>
          Total{" "}
          <small>
            All travellers{b.search.trip === "return" ? " · both legs" : ""}
          </small>
        </span>
        <b>{money(p.total)}</b>
      </div>
      <div className="summary-foot">
        <ShieldCheck size={15} /> Clear fare. No extra seat fees.
      </div>
    </div>
  );
}
