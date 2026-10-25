"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { addDays, prettyDate, Search, station, today } from "@/lib/booking";
import {
  DateField,
  dragRange,
  rangeGestureIntent,
  TravelRange,
} from "@/lib/calendar-range";

type Gesture = {
  id: number;
  x: number;
  y: number;
  anchor: string;
  candidate: string;
  field: DateField;
  dragging: boolean;
  touch: boolean;
};

export default function TravelCalendar({
  value: s,
  field,
  month,
  onMonth,
  onSelect,
  onRange,
  onEditReturn,
  onClose,
  onOneWay,
}: {
  value: Search;
  field: DateField;
  month: string;
  onMonth: (month: string) => void;
  onSelect: (date: string) => void;
  onRange: (range: TravelRange) => void;
  onEditReturn: () => void;
  onClose: () => void;
  onOneWay: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const keyboard = useRef(false);
  const [preview, setPreview] = useState<TravelRange | null>(null);
  // A committed range stays still until the return trigger/endpoint is used again.
  const [reviewing, setReviewing] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const displayed = preview ?? { date: s.date, returnDate: s.returnDate };
  const cancel = () => {
    const g = gesture.current;
    gesture.current = null;
    if (g && root.current?.hasPointerCapture(g.id))
      root.current.releasePointerCapture(g.id);
    setPreview(null);
  };
  useEffect(() => {
    const el = root.current;
    return () => {
      const g = gesture.current;
      if (g && el?.hasPointerCapture(g.id)) el.releasePointerCapture(g.id);
      gesture.current = null;
    };
  }, []);
  const hit = (x: number, y: number) => {
    const el = document
      .elementFromPoint(x, y)
      ?.closest<HTMLButtonElement>("button[data-day]");
    return el && root.current?.contains(el) && !el.disabled
      ? (el.dataset.day ?? "")
      : "";
  };
  const candidate = (date: string) => {
    if (field === "return" && !reviewing && !gesture.current)
      setPreview(dragRange(s.date, date, "return", s.date));
  };
  const commitRange = (range: TravelRange) => {
    setPreview(null);
    setReviewing(true);
    onRange(range);
    setAnnouncement(
      `Departure ${prettyDate(range.date)}. Return ${prettyDate(range.returnDate)} selected.`,
    );
  };
  const choose = (date: string) => {
    if (field === "return" && reviewing) {
      if (date === s.returnDate) {
        setReviewing(false);
        onEditReturn();
      }
      return;
    }
    setPreview(null);
    onSelect(date);
    if (field === "return") {
      setReviewing(true);
      setAnnouncement(
        `Departure ${prettyDate(s.date)}. Return ${prettyDate(date)} selected.`,
      );
    } else {
      setReviewing(false);
      setAnnouncement(
        `Departure ${prettyDate(date)} selected. Choose your return date.`,
      );
    }
  };
  const dateKey = (e: React.KeyboardEvent<HTMLButtonElement>, date: string) => {
    const day = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -day,
      End: 6 - day,
    };
    if (!(e.key in offsets)) return;
    e.preventDefault();
    const next = addDays(date, offsets[e.key]);
    if (next < today() || (field === "return" && next < s.date)) {
      setAnnouncement("Choose an available date on or after departure.");
      return;
    }
    const focus = () =>
      root.current
        ?.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)
        ?.focus();
    const el = root.current?.querySelector<HTMLButtonElement>(
      `[data-day="${next}"]`,
    );
    if (el && el.getClientRects().length) focus();
    else {
      onMonth(next.slice(0, 7));
      setTimeout(focus, 0);
    }
  };
  const months = [0, 1].map((offset) => {
    const d = new Date(`${month}-01T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + offset);
    return d;
  });
  return (
    <div
      ref={root}
      className="popover calendar-pop"
      aria-label="Travel dates"
      onKeyDown={() => {
        keyboard.current = true;
      }}
      onPointerDown={(e) => {
        keyboard.current = false;
        if (!e.isPrimary || e.button !== 0) return;
        const date = hit(e.clientX, e.clientY);
        if (
          !date ||
          s.trip === "oneway" ||
          (field === "return" && reviewing && date !== s.returnDate)
        )
          return;
        suppressClick.current = false;
        gesture.current = {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          anchor: date,
          candidate: date,
          field,
          dragging: false,
          touch: e.pointerType === "touch",
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const g = gesture.current;
        if (!g || g.id !== e.pointerId) return;
        const dx = Math.abs(e.clientX - g.x),
          dy = Math.abs(e.clientY - g.y);
        const intent = rangeGestureIntent(dx, dy, g.touch);
        if (!g.dragging && intent === "scroll") {
          cancel();
          return;
        }
        if (!g.dragging && intent === "pending") return;
        g.dragging = true;
        g.candidate = hit(e.clientX, e.clientY);
        setPreview(
          g.candidate
            ? dragRange(g.anchor, g.candidate, g.field, s.date)
            : null,
        );
      }}
      onPointerUp={(e) => {
        const g = gesture.current;
        if (!g || g.id !== e.pointerId) return;
        const date = hit(e.clientX, e.clientY);
        const range = date ? dragRange(g.anchor, date, g.field, s.date) : null;
        cancel();
        // Captured pointer clicks target the calendar, so handle taps explicitly too.
        suppressClick.current = true;
        if (g.dragging) {
          if (range) commitRange(range);
          else
            setAnnouncement(
              "Selection cancelled. Your saved dates are unchanged.",
            );
        } else if (date === g.anchor) {
          suppressClick.current = false;
          choose(date);
          suppressClick.current = true;
        }
      }}
      onPointerCancel={() => {
        cancel();
        setAnnouncement("Selection cancelled. Your saved dates are unchanged.");
      }}
      onLostPointerCapture={() => {
        if (gesture.current) cancel();
      }}
      onPointerLeave={() => {
        if (!gesture.current) setPreview(null);
      }}
    >
      <div className="popover-heading">
        <div>
          <small className="eyebrow">PLAN YOUR JOURNEY</small>
          <h3 tabIndex={-1} data-calendar-heading>
            {field === "depart"
              ? "Choose your departure date"
              : reviewing
                ? "Your travel dates"
                : "Choose your return date"}
          </h3>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            cancel();
            onOneWay();
          }}
        >
          <Check size={16} /> One Way
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Close calendar"
          onClick={() => {
            cancel();
            onClose();
          }}
        >
          <X size={18} />
        </button>
      </div>
      <div className="calendar-context">
        {station(s.from)} <ArrowRight size={14} /> {station(s.to)}
        <span>
          Departure: {prettyDate(s.date)}
          {s.returnDate
            ? ` · Return: ${prettyDate(s.returnDate)}`
            : " · Choose your return date"}
        </span>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <div className="month-nav">
        {[-1, 1].map((offset) => (
          <button
            key={offset}
            type="button"
            className="icon-button"
            aria-label={offset === -1 ? "Previous month" : "Next month"}
            disabled={offset === -1 && month <= today().slice(0, 7)}
            onClick={() => {
              setPreview(null);
              const d = new Date(`${month}-01T12:00:00Z`);
              d.setUTCMonth(d.getUTCMonth() + offset);
              onMonth(d.toISOString().slice(0, 7));
            }}
          >
            {offset === -1 ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        ))}
      </div>
      <div className="months">
        {months.map((d, mi) => {
          const y = d.getUTCFullYear(),
            m = d.getUTCMonth();
          const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(),
            offset = (d.getUTCDay() + 6) % 7;
          return (
            <section className={`month month-${mi}`} key={d.toISOString()}>
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
                    date < today() || (field === "return" && date < s.date);
                  const start = date === displayed.date,
                    end = date === displayed.returnDate;
                  return (
                    <button
                      type="button"
                      data-day={date}
                      key={date}
                      disabled={disabled}
                      aria-label={`${prettyDate(date)}${start ? ", departure" : ""}${end ? (preview ? ", return preview" : ", return selected; activate to edit return") : ""}${date === today() ? ", today" : ""}`}
                      aria-current={date === today() ? "date" : undefined}
                      aria-pressed={date === s.date || date === s.returnDate}
                      className={`day ${start ? "range-start endpoint" : ""} ${end ? "range-end endpoint" : ""} ${start && end ? "same-day" : ""} ${!displayed.returnDate && start ? "single-start" : ""} ${displayed.returnDate && date > displayed.date && date < displayed.returnDate ? "in-range" : ""} ${end && preview ? "preview-end" : ""}`}
                      onPointerEnter={(e) => {
                        if (e.pointerType !== "touch" && !disabled)
                          candidate(date);
                      }}
                      onPointerLeave={() => {
                        if (!gesture.current) setPreview(null);
                      }}
                      onFocus={() => {
                        if (keyboard.current && !disabled) candidate(date);
                      }}
                      onBlur={() => {
                        if (!gesture.current) setPreview(null);
                      }}
                      onKeyDown={(e) => {
                        keyboard.current = true;
                        dateKey(e, date);
                      }}
                      onClick={(e) => {
                        if (e.detail > 0 && suppressClick.current) {
                          suppressClick.current = false;
                          return;
                        }
                        choose(date);
                      }}
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
        {field === "depart"
          ? "Choose a departure date. For a return journey, you can also drag a full range."
          : reviewing
            ? "Dates saved. Use Returning or the end marker to edit your return. Close when you’re ready."
            : "Choose your return date, drag to adjust it, or choose One Way above."}
      </div>
    </div>
  );
}
