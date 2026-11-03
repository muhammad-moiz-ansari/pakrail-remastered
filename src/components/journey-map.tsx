"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as VectorMap } from "maplibre-gl";
import { geographyResponse, type StationPoint } from "@/lib/journey-geography";
import { station, type Search } from "@/lib/booking";
export default function JourneyMap({
  from,
  to,
  search,
  context,
}: {
  from: string;
  to: string;
  search: Search;
  context: string;
}) {
  const [open, setOpen] = useState(true);
  const [data, setData] = useState<{
    key: string;
    points: StationPoint[];
    error?: boolean;
  } | null>(null);
  const [tileError, setTileError] = useState(false);
  const [ready, setReady] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<VectorMap | null>(null);
  const key = from + ":" + to;
  const current = data?.key === key ? data : null;
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    fetch(
      `/api/journey-geography?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { signal: controller.signal },
    )
      .then(async (r) => {
        if (!r.ok) throw Error();
        return geographyResponse.parse(await r.json());
      })
      .then((d) => {
        if (active) setData({ key, points: d.points });
      })
      .catch(() => {
        if (active) setData({ key, points: [], error: true });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [from, to, key]);
  useEffect(() => {
    if (!open || !current?.points.length || !host.current) return;
    let disposed = false;
    let instance: VectorMap | undefined;
    let observer: ResizeObserver | undefined;
    const controller = new AbortController();
    Promise.all([
      import("maplibre-gl"),
      fetch(
        process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
          "https://tiles.openfreemap.org/styles/liberty",
        { signal: controller.signal },
      ).then(async (response) => {
        if (!response.ok) throw Error("Map style unavailable");
        return response.json();
      }),
    ])
      .then(([L, style]) => {
        if (disposed || !host.current) return;
        const language = document.documentElement.lang.split("-")[0] || "en";
        for (const layer of style.layers ?? []) {
          if (
            layer.type === "symbol" &&
            JSON.stringify(layer.layout?.["text-field"] ?? "").includes("name")
          ) {
            layer.layout["text-field"] = [
              "coalesce",
              ["get", `name:${language}`],
              ["get", `name_${language}`],
              ["get", "name:latin"],
              ["get", "name"],
            ];
          }
        }
        L.setWorkerUrl(`/vendor/maplibre/worker.mjs?v=${L.getVersion()}`);
        instance = new L.Map({
          container: host.current,
          style,
          center: [current.points[0].lng, current.points[0].lat],
          zoom: 6,
          dragRotate: false,
          pitchWithRotate: false,
          attributionControl: false,
        });
        map.current = instance;
        instance.addControl(
          new L.NavigationControl({ showCompass: false }),
          "top-left",
        );
        instance.addControl(new L.AttributionControl({ compact: false }));
        instance.touchZoomRotate.disableRotation();
        const bounds = new L.LngLatBounds();
        for (const point of current.points) {
          bounds.extend([point.lng, point.lat]);
          const destination = point.stationId === to;
          const marker = document.createElement("button");
          marker.className = "journey-marker";
          marker.type = "button";
          marker.textContent = destination ? "B" : "A";
          marker.setAttribute(
            "aria-label",
            `${destination ? "Destination" : "Origin"}: ${point.name}`,
          );
          new L.Marker({ element: marker })
            .setLngLat([point.lng, point.lat])
            .setPopup(new L.Popup().setText(point.name))
            .addTo(instance);
        }
        instance.fitBounds(bounds, { padding: 35, maxZoom: 13, duration: 0 });
        instance.on("error", () => {
          if (!disposed) setTileError(true);
        });
        instance.on("load", () => {
          if (disposed || !instance) return;
          if (current.points.length === 2) {
            instance.addSource("journey", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: current.points.map((point) => [
                    point.lng,
                    point.lat,
                  ]),
                },
              },
            });
            instance.addLayer({
              id: "journey",
              type: "line",
              source: "journey",
              paint: {
                "line-color": "#146b4a",
                "line-width": 3,
                "line-dasharray": [2, 2],
              },
            });
          }
          setReady(true);
        });
        observer = new ResizeObserver(() => instance?.resize());
        observer.observe(host.current);
      })
      .catch(() => {
        if (!disposed) setTileError(true);
      });
    return () => {
      disposed = true;
      controller.abort();
      observer?.disconnect();
      instance?.remove();
      map.current = null;
    };
  }, [open, current, to]);
  return (
    <section className="panel journey-map-panel" aria-label="Journey route">
      <span className="eyebrow">YOUR JOURNEY AT A GLANCE</span>
      <h2>Journey route</h2>
      <p>{context}</p>
      <ol className="journey-map-stations">
        <li>
          <b>A - From</b> {station(from, search)}
        </li>
        <li>
          <b>B - To</b> {station(to, search)}
        </li>
      </ol>
      <button
        className="button secondary"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setTileError(false);
          setReady(false);
        }}
      >
        {open ? "Hide route map" : "View route map"}
      </button>
      {open && (
        <>
          <p className="subtle">
            Approximate route - connector between stations, not the railway
            tracks. No verified intermediate stops are available for these
            sample services.
          </p>
          {!current ? (
            <p role="status">Loading station locations...</p>
          ) : current.error || !current.points.length ? (
            <p role="status">
              Map unavailable. Your journey is shown above; train selection is
              still available.
            </p>
          ) : (
            <>
              <div
                ref={host}
                className="journey-map-canvas"
                aria-label="Approximate station route map"
              />
              {!ready && !tileError && <p role="status">Loading map...</p>}
              {current.points.length < 2 && (
                <p role="status">
                  Only one station location is available. No route line is
                  drawn.
                </p>
              )}
              {tileError && (
                <p role="status">
                  Background map unavailable. Your journey summary remains
                  available.
                </p>
              )}
              <button
                className="text-button"
                onClick={() => {
                  const points = current.points;
                  map.current?.fitBounds(
                    points.length === 1
                      ? [
                          [points[0].lng, points[0].lat],
                          [points[0].lng, points[0].lat],
                        ]
                      : [
                          [
                            Math.min(...points.map((p) => p.lng)),
                            Math.min(...points.map((p) => p.lat)),
                          ],
                          [
                            Math.max(...points.map((p) => p.lng)),
                            Math.max(...points.map((p) => p.lat)),
                          ],
                        ],
                    { padding: 35, maxZoom: 13 },
                  );
                }}
              >
                Reset to journey
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}
