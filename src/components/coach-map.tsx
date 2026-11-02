"use client";
import { useRef, useState } from "react";
import { Check, X } from "lucide-react";
import {
  accommodationNames,
  placeDescription,
  type CoachLayout,
  type CoachPlace,
  type Occupancy,
} from "@/lib/coach-layouts";
import { money } from "@/lib/booking";

export function AccommodationIcon({ type }: { type: CoachPlace["type"] }) {
  return (
    <svg
      className={`accommodation-icon icon-${type}`}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "berth" ? (
        <>
          <rect
            x="7"
            y="5"
            width="34"
            height="38"
            rx="5"
            fill="currentColor"
            fillOpacity=".08"
          />
          <rect x="12" y="9" width="24" height="9" rx="3" />
          <path d="M11 23h26M11 38h26" />
        </>
      ) : type === "recliner" ? (
        <>
          <path
            d="M13 7h22l3 21-5 7H14l-4-8z"
            fill="currentColor"
            fillOpacity=".08"
          />
          <path d="M16 10l-2 17h20L32 10M14 31h20l2 12H12zM6 18v16h5M42 18v16h-5" />
        </>
      ) : (
        <>
          <rect
            x="11"
            y="6"
            width="26"
            height="29"
            rx="6"
            fill="currentColor"
            fillOpacity=".08"
          />
          <path d="M12 26h24M12 34v8M36 34v8M6 20v15h5M42 20v15h-5" />
        </>
      )}
    </svg>
  );
}
export function OccupancyMark({ gender }: { gender?: Occupancy["gender"] }) {
  return (
    <span
      className={`occupancy-mark ${gender ?? "unspecified"}`}
      aria-hidden="true"
    >
      {gender === "male" ? "♂" : gender === "female" ? "♀" : "×"}
    </span>
  );
}
export function CoachLegends({ layout }: { layout: CoachLayout }) {
  return (
    <div className="coach-legends">
      <div>
        <b>Accommodation</b>
        <div className="legend-items">
          {[...new Set(layout.places.map((p) => p.type))].map((type) => (
            <span key={type}>
              <AccommodationIcon type={type} />
              {accommodationNames[type]}
            </span>
          ))}
        </div>
      </div>
      <div>
        <b>Availability</b>
        <div className="legend-items">
          <span>
            <i className="state-swatch" />
            Available
          </span>
          <span>
            <i className="state-swatch selected">
              <Check size={12} />
            </i>
            Selected by you · removable
          </span>
          <span>
            <i className="state-swatch male">♂</i>Occupied (male)
          </span>
          <span>
            <i className="state-swatch female">♀</i>Occupied (female)
          </span>
          <span>
            <i className="state-swatch occupied">×</i>Occupied (unspecified)
          </span>
          <span>
            <i className="state-swatch" />
            Not checked · preview
          </span>
        </div>
      </div>
    </div>
  );
}
type PlaceState = Occupancy & {
  owner?: string;
  mine?: boolean;
  suggested?: boolean;
};
export default function CoachMap({
  layout,
  coach = "Preview",
  amount = null,
  state = () => ({ state: "unknown" }),
  onSelect,
  onRemove,
  selectingFor,
}: {
  layout: CoachLayout;
  coach?: string;
  amount?: number | null;
  state?: (p: CoachPlace) => PlaceState;
  onSelect?: (p: CoachPlace) => void;
  onRemove?: (p: CoachPlace) => void;
  selectingFor?: string;
}) {
  const [view, setView] = useState("map");
  const [detail, setDetail] = useState<CoachPlace | null>(null);
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement | null>(null);
  const close = () => {
    dialog.current?.close();
    setDetail(null);
    trigger.current?.focus();
  };
  const show = (p: CoachPlace, button: HTMLButtonElement) => {
    trigger.current = button;
    setDetail(p);
    dialog.current?.showModal();
  };
  const canSelect = (p: CoachPlace) =>
    !!(
      onSelect &&
      amount !== null &&
      p.label &&
      state(p).state === "available" &&
      !state(p).owner
    );
  const status = (p: CoachPlace) => {
    const value = state(p);
    if (value.mine)
      return `Selected by you for ${value.owner}, activate to remove`;
    if (value.owner) return `Selected by your group for ${value.owner}`;
    if (value.state === "occupied")
      return `Occupied (${value.gender ?? "unspecified"})`;
    return value.state === "unknown"
      ? "Availability not supplied"
      : "Available in sample inventory";
  };
  const describe = (p: CoachPlace) =>
    `${p.label ?? "Number not supplied"}, ${placeDescription(p)}, ${p.bay}, coach ${coach}, ${status(p)}, ${amount === null ? "Fare unavailable" : `${money(amount)} full sample ticket fare, no extra seat fee`}`;
  const tile = (p: CoachPlace) => {
    const s = state(p),
      taken = s.state === "occupied";
    return (
      <button
        key={p.id}
        type="button"
        className={`place-tile ${p.type} ${taken ? `occupied ${s.gender ?? "unspecified"}` : ""} ${s.owner ? "selected" : ""} ${view === "list" ? "list-place" : ""}`}
        style={
          view === "map"
            ? { left: p.x, top: p.y, width: p.width, height: p.height }
            : undefined
        }
        data-place-id={p.id}
        data-side={p.x < 110 ? "left" : "right"}
        data-tooltip={`${placeDescription(p)} · ${s.state === "occupied" ? `Occupied (${s.gender ?? "unspecified"})` : s.mine ? "Selected by you · activate to remove" : s.state === "unknown" ? "Availability not supplied" : "Available (sample)"}`}
        aria-label={describe(p)}
        aria-pressed={!!s.owner}
        title={describe(p)}
        onClick={(e) => {
          if (s.mine && onRemove) onRemove(p);
          else show(p, e.currentTarget);
        }}
      >
        <b className="place-number">{p.label ?? "Unnumbered"}</b>
        <span className="place-art">
          <AccommodationIcon type={p.type} />
          {p.tier && <span className="place-tier">{p.tier}</span>}
          {taken && <OccupancyMark gender={s.gender} />}{" "}
          {!!s.owner && <Check className="place-check" size={17} />}
        </span>
        <small className="place-price">
          {amount === null ? "Fare unavailable" : money(amount)}
        </small>
        {view === "list" && (
          <span>
            {placeDescription(p)} · {p.bay} ·{" "}
            {taken
              ? `Occupied (${s.gender ?? "unspecified"})`
              : s.owner
                ? `Selected: ${s.owner}`
                : s.state === "unknown"
                  ? "Availability not supplied"
                  : "Available"}
          </span>
        )}
      </button>
    );
  };
  const tiers = layout.places.some((p) => p.tier);
  return (
    <div className="verified-coach-map">
      <CoachLegends layout={layout} />
      {layout.warning && (
        <p className="coach-evidence-note">
          <b>Reference note:</b> {layout.warning}
        </p>
      )}
      <p className="coach-explanation">
        {tiers
          ? "Tier inset: upper, middle and lower berths in each labelled stack share a footprint. They are separated here for selection; they are not side-by-side beds on one floor."
          : "Top-down schematic, not to scale. Printed labels and gaps follow the supplied reference."}
      </p>
      <div className="view-tabs" aria-label="Coach display">
        <button
          className={view === "map" ? "active" : ""}
          aria-pressed={view === "map"}
          onClick={() => setView("map")}
        >
          Coach map
        </button>
        <button
          className={view === "list" ? "active" : ""}
          aria-pressed={view === "list"}
          onClick={() => setView("list")}
        >
          Accessible place list
        </button>
      </div>
      <p className="fineprint">
        {selectingFor ? `Selecting for ${selectingFor}. ` : "Layout preview. "}
        Tap or focus a place for its type, tier and status.{" "}
        {amount !== null
          ? "Prices are full sample ticket fares; selection adds no surcharge."
          : "A valid quote is required before booking."}
      </p>
      {view === "map" ? (
        <div
          className="verified-map-scroll"
          tabIndex={0}
          role="region"
          aria-label="Scrollable top-down coach interior"
        >
          <div
            className="verified-coach-shell"
            style={{ width: layout.width + 28 }}
          >
            <div className="neutral-coach-end">Coach {coach} · A end</div>
            <div
              className="coach-floor"
              style={{ width: layout.width, height: layout.height }}
            >
              {layout.structures.map((s) => (
                <div
                  key={s.id}
                  className={`coach-structure structure-${s.type}`}
                  style={{
                    left: s.x,
                    top: s.y,
                    width: s.width,
                    height: s.height,
                  }}
                  title={s.label}
                  aria-label={s.label}
                >
                  {s.type !== "wall" && s.type !== "fixture" && (
                    <span>{s.label}</span>
                  )}
                </div>
              ))}
              {tiers &&
                [
                  ...new Map(
                    layout.places
                      .filter((p) => p.stack)
                      .map((p) => [p.stack, p]),
                  ).values(),
                ].map((p) => (
                  <span
                    key={p.stack}
                    className="tier-inset-label"
                    style={{
                      left: layout.id === "cabin-16" ? 10 : 116,
                      top: p.y + 30,
                      width: layout.id === "cabin-16" ? 90 : 110,
                    }}
                  >
                    {/^[0-9]+$/.test(p.bay) ? `Bay ${p.bay}` : p.bay}
                    <br />
                    Tier stack {p.stack}
                  </span>
                ))}
              {layout.places.map(tile)}
            </div>
            <div className="neutral-coach-end">Coach {coach} · B end</div>
          </div>
        </div>
      ) : (
        <div className="verified-place-list">{layout.places.map(tile)}</div>
      )}
      <p className="fineprint">
        {layout.places.length}{" "}
        {layout.verification === "numbered"
          ? "labelled places"
          : "unnumbered positions"}{" "}
        · schematic, not to scale.{" "}
        {layout.mode === "berth" && "Full tier words appear in place details."}
      </p>
      <dialog
        ref={dialog}
        className="seat-dialog verified-place-dialog"
        aria-labelledby="place-details-heading"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {detail && (
          <>
            <div className="panel-heading">
              <span className="eyebrow">ACCOMMODATION DETAILS</span>
              <button
                className="icon-button"
                onClick={close}
                aria-label="Close place details"
              >
                <X size={20} />
              </button>
            </div>
            <AccommodationIcon type={detail.type} />
            <h2 id="place-details-heading">
              {detail.label ?? "Number not supplied"}
            </h2>
            <p>{placeDescription(detail)}</p>
            <p>
              Coach {coach} · {detail.bay}
              {detail.stack ? ` · stack ${detail.stack}` : ""}
            </p>
            <p>
              {state(detail).state === "occupied"
                ? `Occupied (${state(detail).gender ?? "unspecified"})`
                : state(detail).owner
                  ? `Selected by your group for ${state(detail).owner}`
                  : state(detail).state === "unknown"
                    ? "Availability not supplied"
                    : "Available in sample inventory"}
            </p>
            <div className="dialog-fare">
              <span>Full ticket fare</span>
              <b>{amount === null ? "Fare unavailable" : money(amount)}</b>
            </div>
            <p className="fineprint">
              {tiers
                ? "Berths within a stack share a floor footprint and occupy different tiers. "
                : ""}
              {amount !== null
                ? "Sample fare, including place selection. No additional selection fee."
                : "This reference is available for preview. Booking is unavailable without a valid numbered place and fare."}
            </p>
            <div className="action-row">
              <button className="button secondary" onClick={close}>
                Close
              </button>
              {canSelect(detail) && (
                <button
                  className="button primary"
                  onClick={() => {
                    onSelect?.(detail);
                    close();
                  }}
                >
                  Confirm place <Check size={17} />
                </button>
              )}
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
