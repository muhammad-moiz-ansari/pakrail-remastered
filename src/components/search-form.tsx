"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Minus,
  Plus,
  Users,
  X,
} from "lucide-react";
import {
  addDays,
  prettyDate,
  searchErrors,
  Search,
  station,
  stations,
  today,
} from "@/lib/booking";
type Props = {
  value: Search;
  onChange: (s: Search) => void;
  onSearch: () => void;
  busy: boolean;
  compact?: boolean;
};
export default function SearchForm({
  value: s,
  onChange,
  onSearch,
  busy,
  compact = false,
}: Props) {
  const [open, setOpen] = useState("");
  const [query, setQuery] = useState("");
  const [guided, setGuided] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [month, setMonth] = useState(s.date.slice(0, 7));
  const [preview, setPreview] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLFormElement>(null);
  const origin = useRef<HTMLButtonElement | null>(null);
  const stationInput = useRef<HTMLInputElement>(null);
  const patch = (v: Partial<Search>) => {
    const next = { ...s, ...v };
    onChange(next);
    if (Object.keys(errors).length) setErrors(searchErrors(next));
  };
  const close = () => {
    setOpen("");
    setGuided(false);
    origin.current?.focus();
  };
  useEffect(() => {
    if (open === "from" || open === "to") stationInput.current?.focus();
    else if (open === "depart" || open === "return")
      root.current
        ?.querySelector<HTMLButtonElement>("[data-day]:not(:disabled)")
        ?.focus();
    else if (open === "passengers")
      root.current
        ?.querySelector<HTMLButtonElement>(
          ".passengers-pop .counter:not(:disabled)",
        )
        ?.focus();
  }, [open]);
  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen("");
        setGuided(false);
      }
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, []);
  const show = (name: string, el: HTMLButtonElement) => {
    origin.current = el;
    setQuery("");
    setActive(0);
    setOpen(open === name ? "" : name);
    setGuided(name === "from" && !s.from);
  };
  const options = stations.filter((v) =>
    `${v.name} ${v.city} ${v.code}`.toLowerCase().includes(query.toLowerCase()),
  );
  const selectStation = (id: string) => {
    const name = open;
    patch({ [name]: id });
    if (guided && name === "from") {
      setOpen("to");
      setQuery("");
      setActive(0);
    } else if (guided && name === "to") {
      setOpen("depart");
      setMonth(s.date.slice(0, 7));
      queueMicrotask(() =>
        root.current
          ?.querySelector<HTMLButtonElement>("[data-day]:not(:disabled)")
          ?.focus(),
      );
    } else close();
  };
  const chooseDate = (date: string) => {
    if (open === "depart") {
      const invalidReturn = s.trip === "return" && s.returnDate < date;
      const needsReturnChoice =
        guided || s.trip === "undecided" || invalidReturn;
      patch({
        date,
        returnDate: invalidReturn ? "" : s.returnDate,
        trip: invalidReturn ? "undecided" : s.trip,
      });
      if (needsReturnChoice) setOpen("return");
      else close();
      setPreview("");
    } else {
      patch({ returnDate: date, trip: "return" });
      if (guided) setOpen("passengers");
      else close();
      setGuided(false);
    }
  };
  const dateKey = (e: React.KeyboardEvent<HTMLButtonElement>, date: string) => {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -(new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7,
      End: 6 - ((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7),
    };
    if (e.key in offsets) {
      e.preventDefault();
      const next = addDays(date, offsets[e.key]);
      if (next < today() || (open === "return" && next < s.date)) return;
      const el = root.current?.querySelector<HTMLButtonElement>(
        `[data-day="${next}"]`,
      );
      if (el && !el.disabled && el.getClientRects().length > 0) el.focus();
      else {
        setMonth(next.slice(0, 7));
        setTimeout(
          () =>
            root.current
              ?.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)
              ?.focus(),
          0,
        );
      }
    }
  };
  const months = [0, 1].map((offset) => {
    const d = new Date(`${month}-01T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + offset);
    return d;
  });
  return (
    <form
      ref={root}
      className={`search-box ${compact ? "compact" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close();
        }
      }}
      onSubmit={(e) => {
        e.preventDefault();
        const err = searchErrors(s);
        setErrors(err);
        if (Object.keys(err).length) {
          root.current
            ?.querySelector<HTMLButtonElement>(
              `[data-field="${Object.keys(err)[0]}"]`,
            )
            ?.focus();
          return;
        }
        setOpen("");
        onSearch();
      }}
      noValidate
    >
      {!compact && (
        <div className="search-title">
          <span>
            <span className="tiny-train">▰</span> Book a train
          </span>
          <span className="subtle">Your next journey starts here</span>
        </div>
      )}
      <div className="search-fields">
        {(["from", "to"] as const).map((field, i) => (
          <div className="field-wrap" key={field}>
            <button
              data-field={field}
              type="button"
              className={`search-field ${errors[field] ? "invalid" : ""}`}
              aria-haspopup="listbox"
              aria-expanded={open === field}
              aria-describedby={errors[field] ? `${field}-error` : undefined}
              onClick={(e) => show(field, e.currentTarget)}
            >
              <MapPin size={19} />
              <span>
                <small>
                  {i === 0 ? "Departure station" : "Arrival station"}
                </small>
                <strong className={!s[field] ? "placeholder" : ""}>
                  {s[field]
                    ? station(s[field])
                    : i === 0
                      ? "Where from?"
                      : "Where to?"}
                </strong>
              </span>
              <ChevronDown size={15} />
            </button>
            {i === 0 && (
              <button
                type="button"
                className="swap"
                aria-label="Swap departure and arrival"
                onClick={() => patch({ from: s.to, to: s.from })}
              >
                <ArrowRightLeft size={16} />
              </button>
            )}
          </div>
        ))}
        <div className="date-fields">
          <button
            data-field="date"
            type="button"
            className={`search-field ${errors.date ? "invalid" : ""}`}
            aria-expanded={open === "depart" || open === "return"}
            onClick={(e) => show("depart", e.currentTarget)}
          >
            <CalendarDays size={19} />
            <span>
              <small>Departing</small>
              <strong>{prettyDate(s.date).replace(/ 20\d\d/, "")}</strong>
            </span>
          </button>
          <button
            type="button"
            className="return-field"
            onClick={(e) => show("return", e.currentTarget)}
          >
            <small>Returning</small>
            <strong className={!s.returnDate ? "placeholder" : ""}>
              {s.returnDate ? (
                prettyDate(s.returnDate).replace(/ 20\d\d/, "")
              ) : (
                <>
                  <Plus size={14} /> Add return
                </>
              )}
            </strong>
          </button>
        </div>
        <button
          data-field="passengers"
          type="button"
          className="search-field passenger-trigger"
          aria-expanded={open === "passengers"}
          onClick={(e) => show("passengers", e.currentTarget)}
        >
          <Users size={19} />
          <span>
            <small>Passengers</small>
            <strong>
              {s.adults + s.children} traveller
              {s.adults + s.children > 1 ? "s" : ""}
            </strong>
          </span>
          <ChevronDown size={15} />
        </button>
        <button className="button primary search-submit" disabled={busy}>
          {busy ? (
            "Finding trains…"
          ) : (
            <>
              Search trains <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
      {Object.keys(errors).length > 0 && (
        <div className="field-errors" role="alert">
          {Object.entries(errors).map(([k, v]) => (
            <p id={`${k}-error`} key={k}>
              {v}
            </p>
          ))}
        </div>
      )}
      {(open === "from" || open === "to") && (
        <div
          className={`popover station-pop ${open === "to" ? "destination" : ""}`}
        >
          <div className="popover-heading">
            <b>
              {open === "from"
                ? "Where are you travelling from?"
                : "Where would you like to go?"}
            </b>
            <button
              className="icon-button"
              type="button"
              aria-label="Close station choices"
              onClick={close}
            >
              <X size={17} />
            </button>
          </div>
          <input
            ref={stationInput}
            className="input"
            role="combobox"
            aria-label="Find a station"
            aria-autocomplete="list"
            aria-controls="station-list"
            aria-expanded="true"
            aria-activedescendant={
              options[active] ? `station-${options[active].id}` : undefined
            }
            placeholder="Search city or station"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setActive(
                  (v) =>
                    (v + (e.key === "ArrowDown" ? 1 : options.length - 1)) %
                    Math.max(1, options.length),
                );
              }
              if (e.key === "Enter" && options[active]) {
                e.preventDefault();
                selectStation(options[active].id);
              }
            }}
          />
          <ul id="station-list" role="listbox" aria-label="Stations">
            {options.map((v, i) => (
              <li
                id={`station-${v.id}`}
                key={v.id}
                role="option"
                aria-selected={active === i}
                onPointerMove={() => setActive(i)}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => selectStation(v.id)}
                >
                  <MapPin size={17} />
                  <span>
                    <b>{v.name}</b>
                    <small>{v.city}, Pakistan</small>
                  </span>
                  <span className="station-code">{v.code}</span>
                </button>
              </li>
            ))}
            {!options.length && (
              <li className="empty-option" role="status">
                No stations found. Try a city such as Lahore.
              </li>
            )}
          </ul>
        </div>
      )}
      {(open === "depart" || open === "return") && (
        <div
          className="popover calendar-pop"
          aria-label={
            open === "depart" ? "Choose departure date" : "Choose return date"
          }
        >
          <div className="popover-heading">
            <div>
              <small className="eyebrow">PLAN YOUR JOURNEY</small>
              <h3>
                {open === "depart"
                  ? "Choose your departure date"
                  : "When would you like to return?"}
              </h3>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                patch({ trip: "oneway", returnDate: "" });
                if (guided) setOpen("passengers");
                else close();
                setGuided(false);
              }}
            >
              <Check size={16} /> One Way
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Close calendar"
              onClick={close}
            >
              <X size={18} />
            </button>
          </div>
          <div className="calendar-context">
            {station(s.from)} <ArrowRight size={14} /> {station(s.to)}{" "}
            <span>
              {prettyDate(s.date)}
              {s.returnDate ? ` – ${prettyDate(s.returnDate)}` : ""}
            </span>
          </div>
          <div className="month-nav">
            <button
              type="button"
              className="icon-button"
              aria-label="Previous month"
              disabled={month <= today().slice(0, 7)}
              onClick={() => {
                const d = new Date(`${month}-01T12:00:00Z`);
                d.setUTCMonth(d.getUTCMonth() - 1);
                setMonth(d.toISOString().slice(0, 7));
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Next month"
              onClick={() => {
                const d = new Date(`${month}-01T12:00:00Z`);
                d.setUTCMonth(d.getUTCMonth() + 1);
                setMonth(d.toISOString().slice(0, 7));
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="months">
            {months.map((d, mi) => {
              const y = d.getUTCFullYear(),
                m = d.getUTCMonth();
              const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(),
                offset = (d.getUTCDay() + 6) % 7;
              return (
                <section className={`month month-${mi}`} key={mi}>
                  <h4>
                    {d.toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </h4>
                  <div className="days">
                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((v) => (
                      <small key={v}>{v}</small>
                    ))}
                    {Array.from({ length: offset }, (_, i) => (
                      <span key={`blank${i}`} />
                    ))}
                    {Array.from({ length: days }, (_, i) => {
                      const date = `${y}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                      const disabled =
                        date < today() || (open === "return" && date < s.date);
                      const end = preview || s.returnDate;
                      return (
                        <button
                          type="button"
                          data-day={date}
                          key={date}
                          disabled={disabled}
                          aria-label={`${prettyDate(date)}${date === s.date ? ", departure selected" : ""}${date === s.returnDate ? ", return selected" : ""}`}
                          aria-pressed={
                            date === s.date || date === s.returnDate
                          }
                          className={`day ${date === s.date ? "range-start endpoint" : ""} ${date === s.returnDate ? "range-end endpoint" : ""} ${end && date > s.date && date < end ? "in-range" : ""}`}
                          onMouseEnter={() => {
                            if (open === "return" && !disabled)
                              setPreview(date);
                          }}
                          onMouseLeave={() => setPreview("")}
                          onFocus={() => {
                            if (open === "return" && !disabled)
                              setPreview(date);
                          }}
                          onBlur={() => setPreview("")}
                          onKeyDown={(e) => dateKey(e, date)}
                          onClick={() => chooseDate(date)}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
          <div className="calendar-foot">
            {open === "depart"
              ? "Select a date to continue to return selection."
              : "Select a return date, or choose One Way above."}
          </div>
        </div>
      )}
      {open === "passengers" && (
        <div className="popover passengers-pop">
          <div className="popover-heading">
            <h3>Who’s coming along?</h3>
            <button
              type="button"
              className="icon-button"
              aria-label="Close passengers"
              onClick={close}
            >
              <X size={18} />
            </button>
          </div>
          {(["adults", "children"] as const).map((k) => (
            <div className="counter-row" key={k}>
              <button
                type="button"
                className="counter"
                aria-label={`Remove ${k === "adults" ? "adult" : "child"}`}
                disabled={s[k] <= (k === "adults" ? 1 : 0)}
                onClick={() => patch({ [k]: s[k] - 1 })}
              >
                <Minus size={18} />
              </button>
              <div>
                <b>
                  {s[k]}{" "}
                  {k === "adults"
                    ? s[k] === 1
                      ? "Adult"
                      : "Adults"
                    : s[k] === 1
                      ? "Child"
                      : "Children"}
                </b>
                <small>
                  {k === "adults"
                    ? "At least one adult"
                    : "Each child has their own seat"}
                </small>
              </div>
              <button
                type="button"
                className="counter"
                aria-label={`Add ${k === "adults" ? "adult" : "child"}`}
                disabled={s.adults + s.children >= 6}
                onClick={() => patch({ [k]: s[k] + 1 })}
              >
                <Plus size={18} />
              </button>
            </div>
          ))}
          <small className="subtle">Up to 6 travellers in this demo.</small>
          <button
            type="button"
            className="button primary full"
            onClick={() => {
              setGuided(false);
              close();
            }}
          >
            Done <Check size={17} />
          </button>
        </div>
      )}
    </form>
  );
}
