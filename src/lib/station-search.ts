export type PublicStation = {
  id: string;
  name: string;
  city?: string | null;
  code?: string;
};
export const STATION_LIMIT = 12;
export function stationQuery(params: URLSearchParams) {
  const values = params.getAll("q");
  if (values.length > 1) throw new Error("Provide one station query.");
  const q = (values[0] ?? "").trim();
  if (q.length > 80 || /[\x00-\x1f\x7f]/.test(q))
    throw new Error(
      "Station query must be at most 80 characters and contain no control characters.",
    );
  return q;
}
export const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function publicStation(value: {
  id: string;
  name: string;
  city?: string | null;
  officialCode?: string;
}): PublicStation {
  return {
    id: value.id,
    name: value.name,
    ...(value.city ? { city: value.city } : {}),
    ...(value.officialCode ? { code: value.officialCode } : {}),
  };
}
