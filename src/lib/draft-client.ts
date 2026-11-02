"use client";
import { type Booking } from "./booking";
export const draftStorageKey = "designify-draft-v1";
export class DraftRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
  }
}
let queue: Promise<unknown> = Promise.resolve();
export function draftRequest(
  action: string,
  extra: Record<string, unknown> = {},
) {
  const operation = async () => {
    const response = await fetch("/api/booking-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new DraftRequestError(
        data.error ?? "Your booking could not be saved.",
        data.code ?? "UNKNOWN",
        response.status,
      );
    return data as {
      id: string;
      snapshot: Booking;
      holdExpiresAt: string | null;
    } | null;
  };
  const pending = queue.then(operation, operation);
  queue = pending.catch(() => {});
  return pending;
}
export async function persistCurrentDraft() {
  const raw = sessionStorage.getItem(draftStorageKey);
  if (!raw) return;
  const snapshot = JSON.parse(raw) as Booking;
  if (snapshot.status === "draft") await draftRequest("save", { snapshot });
}
