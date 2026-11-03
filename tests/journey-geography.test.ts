import { test } from "node:test";
import assert from "node:assert/strict";
import {
  geographySeeds,
  pointSchema,
  routeQuery,
  geographyResponse,
} from "../src/lib/journey-geography";
test("station geography rejects invalid and non-finite locations", () => {
  const p = geographySeeds[0];
  for (const lat of [NaN, Infinity, 91, -91])
    assert.equal(pointSchema.safeParse({ ...p, lat }).success, false);
  for (const lng of [NaN, 181, -181])
    assert.equal(pointSchema.safeParse({ ...p, lng }).success, false);
  for (const point of geographySeeds)
    assert.equal(pointSchema.safeParse(point).success, true);
  assert.equal(new Set(geographySeeds.map((p) => p.stationId)).size, 6);
  assert.notDeepEqual(
    geographySeeds.find((p) => p.stationId === "ISB"),
    geographySeeds.find((p) => p.stationId === "RWP"),
  );
});
test("route queries reject ambiguous input; partial and missing geography remain valid", () => {
  for (const q of [
    { from: "LHE", to: "LHE" },
    { from: "$gt", to: "KHI" },
    { from: "", to: "RWP" },
  ])
    assert.equal(routeQuery.safeParse(q).success, false);
  assert.equal(routeQuery.safeParse({ from: "KHI", to: "LHE" }).success, true);
  assert.deepEqual(geographyResponse.parse({ points: [] }), { points: [] });
  assert.equal(
    geographyResponse.parse({ points: [geographySeeds[0]] }).points.length,
    1,
  );
});
