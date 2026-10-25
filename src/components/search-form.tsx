"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  CalendarDays,
  TrainFront,
  Check,
  ChevronDown,
  MapPin,
  Minus,
  Plus,
  Users,
  X,
} from "lucide-react";
import {
  prettyDate,
  searchErrors,
  Search,
  station,
  stations,
} from "@/lib/booking";
import TravelCalendar from "./travel-calendar";
import { selectCalendarDate } from "@/lib/calendar-range";
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
  const [calendarSession, setCalendarSession] = useState(0);
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
        ?.querySelector<HTMLHeadingElement>("[data-calendar-heading]")
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
      const target = e.target as Element;
      const calendarOutside =
        (open === "depart" || open === "return") &&
        !target.closest(".date-fields, .calendar-pop");
      if (root.current && (!root.current.contains(target) || calendarOutside)) {
        setOpen("");
        setGuided(false);
      }
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open]);
  const show = (name: string, el: HTMLButtonElement) => {
    origin.current = el;
    setQuery("");
    setActive(0);
    if (name === "depart" || name === "return") {
      setCalendarSession((v) => v + 1);
      setOpen(name);
      if (name === "return") patch({ trip: "return" });
    } else setOpen(open === name ? "" : name);
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
          ?.querySelector<HTMLHeadingElement>("[data-calendar-heading]")
          ?.focus(),
      );
    } else close();
  };
  const chooseDate = (date: string) => {
    const next = selectCalendarDate(
      s,
      open === "depart" ? "depart" : "return",
      date,
    );
    if (!next) return;
    patch(next);
    if (open === "depart") {
      if (s.trip !== "oneway") setOpen("return");
      else close();
    }
    setGuided(false);
  };
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
            <TrainFront size={21} /> Book train tickets
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
        <TravelCalendar
          key={calendarSession}
          value={s}
          field={open}
          month={month}
          onMonth={setMonth}
          onSelect={chooseDate}
          onRange={(range) => {
            patch({ ...range, trip: "return" });
            setOpen("return");
            setGuided(false);
          }}
          onEditReturn={() => setOpen("return")}
          onClose={close}
          onOneWay={() => {
            patch({ trip: "oneway", returnDate: "" });
            close();
          }}
        />
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
          <small className="subtle">Up to 6 travellers per booking.</small>
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
