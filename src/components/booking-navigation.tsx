"use client";
import { ArrowRight } from "lucide-react";
export function focusBooking(field = "from") {
  const panel = document.getElementById("booking");
  if (!panel) return;
  panel.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
  requestAnimationFrame(() =>
    panel
      .querySelector<HTMLButtonElement>(`[data-field="${field}"]`)
      ?.focus({ preventScroll: true }),
  );
}
export function PlanJourney({
  className = "button primary",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button className={className} onClick={() => focusBooking()}>
      {children ?? (
        <>
          Plan your journey <ArrowRight size={17} />
        </>
      )}
    </button>
  );
}
export function FindDestination({ id, name }: { id: string; name: string }) {
  return (
    <button
      className="destination-action"
      aria-label={`Find trains to ${name}`}
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent("railway:destination", { detail: id }),
        );
        focusBooking("to");
      }}
    >
      Find trains <ArrowRight size={16} />
    </button>
  );
}
