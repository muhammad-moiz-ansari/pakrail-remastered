import { stationResponse } from "../src/server/station-handler";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { catalogueSchemas, sourceSchema } from "../src/lib/catalogue/models";
import {
  mergeFacts,
  parseImportFile,
  planImport,
} from "../src/lib/catalogue/import";
import {
  escapeRegex,
  publicStation,
  stationQuery,
  STATION_LIMIT,
} from "../src/lib/station-search";
import { DatabaseError, publicDatabaseError } from "../src/server/db/errors";
import { database } from "../src/server/db/mongodb";
import { catalogueIndexes } from "../src/server/db/indexes";
import {
  addDays,
  freshBooking,
  restore,
  searchErrors,
  station,
  today,
} from "../src/lib/booking";

const records = JSON.parse(
  readFileSync("data/catalogue/review/stations.public-review.json", "utf8"),
) as Record<string, unknown>[];
const none = async () => null;

test("reviewed station file validates without guessed codes or other collections", async () => {
  const plan = await planImport("stations", records, none);
  assert.deepEqual(plan.counts, {
    inserted: 6,
    updated: 0,
    unchanged: 0,
    rejected: 0,
  });
  assert.ok(plan.changes.every((c) => !("officialCode" in c.record)));
  assert.equal(
    plan.changes[0].record.provenance.sourceUrl,
    "https://www.pakrailways.gov.pk/home",
  );
});
test("repeat import is idempotent and timestamps are not refreshed for unchanged facts", async () => {
  const first = await planImport("stations", records, none);
  const saved = first.changes.map((c) => ({
    ...c.record,
    createdAt: "2026-11-02T00:00:00Z",
    updatedAt: "2026-11-02T00:00:00Z",
  }));
  const second = await planImport(
    "stations",
    records,
    async (_, id) => saved.find((s) => s.id === id) ?? null,
    saved,
  );
  assert.deepEqual(second.counts, {
    inserted: 0,
    updated: 0,
    unchanged: 6,
    rejected: 0,
  });
});
test("blank updates preserve established facts, while zero and false remain meaningful", async () => {
  const saved: Record<string, unknown> = {
    ...records[0],
    city: "Local city",
    aliases: ["Station alias"],
    active: true,
  };
  const plan = await planImport(
    "stations",
    [{ id: saved.id, name: "  ", city: null, aliases: [], active: false }],
    async () => saved,
  );
  assert.equal(plan.counts.updated, 1);
  assert.deepEqual(mergeFacts({ amountMinor: 100 }, { amountMinor: 0 }), {
    amountMinor: 0,
  });
  assert.equal(
    (plan.changes[0].record as typeof catalogueSchemas.stations._output).city,
    "Local city",
  );
  assert.equal(
    (plan.changes[0].record as typeof catalogueSchemas.stations._output).active,
    false,
  );
});
test("duplicate IDs and conflicting optional codes are rejected before writing", async () => {
  const plan = await planImport(
    "stations",
    [
      records[0],
      records[0],
      { ...records[1], officialCode: "SAME" },
      { ...records[2], officialCode: "same" },
    ],
    none,
  );
  assert.equal(plan.counts.rejected, 2);
  assert.equal(plan.errors[0].row, 2);
});
test("optional code indexes exclude missing values and use unique identity constraints", () => {
  assert.deepEqual(catalogueIndexes.stations[0].partialFilterExpression, {
    officialCode: { $type: "string" },
  });
  assert.equal(catalogueIndexes.routes[0].unique, true);
});
test("JSON and CSV preserve structured provenance; every template parses", () => {
  for (const name of Object.keys(
    catalogueSchemas,
  ) as (keyof typeof catalogueSchemas)[]) {
    for (const suffix of ["json", "csv"]) {
      const rows = parseImportFile(
        readFileSync(`data/catalogue/templates/${name}.${suffix}`, "utf8"),
        suffix === "csv",
      );
      assert.equal(
        catalogueSchemas[name].safeParse(rows[0]).success,
        true,
        `${name}.${suffix}`,
      );
    }
  }
});
test("imports reject foreign passenger data, impossible times and duplicate route stops", async () => {
  const p = records[0].provenance;
  assert.equal(
    catalogueSchemas.stations.safeParse({
      ...records[0],
      cnic: "not-permitted",
    }).success,
    false,
  );
  assert.equal(
    catalogueSchemas.routes.safeParse({
      id: "r",
      trainId: "t",
      variant: "up",
      provenance: p,
      stops: [
        { stationId: "s", sequence: 1, departureTime: "25:00" },
        { stationId: "s", sequence: 1 },
      ],
    }).success,
    false,
  );
  const route = {
    id: "r",
    trainId: "t",
    variant: "up",
    provenance: p,
    stops: [
      { stationId: "s1", sequence: 1 },
      { stationId: "s2", sequence: 2 },
    ],
  };
  const plan = await planImport("routes", [route], none);
  assert.match(plan.errors[0].message, /Missing trains reference/);
});
test("fare references enforce ordered stations, class and matching route train", async () => {
  const fare = {
    id: "fare",
    routeId: "route",
    originId: "a",
    destinationId: "b",
    classId: "class",
    currency: "PKR",
    provenance: records[0].provenance,
  };
  const lookup = async (name: string) =>
    name === "routes"
      ? { trainId: "train", stops: [{ stationId: "b" }, { stationId: "a" }] }
      : { id: "found" };
  const plan = await planImport("fares", [fare], lookup);
  assert.match(plan.errors[0].message, /ordered origin\/destination/);
  assert.equal(
    catalogueSchemas.fares.safeParse({ ...fare, amountMinor: 12.5 }).success,
    false,
  );
});
test("demo records cannot enter public collections or claim verified provenance", async () => {
  const demo = {
    ...records[0],
    provenance: {
      ...(records[0].provenance as object),
      dataOrigin: "demo",
      verifiedAt: null,
      verificationStatus: "unverified",
    },
  };
  assert.equal((await planImport("stations", [demo], none)).counts.rejected, 1);
  assert.equal(
    (await planImport("stations", [demo], none, [], true)).counts.inserted,
    1,
  );
  assert.equal(
    sourceSchema.safeParse({
      ...demo.provenance,
      verificationStatus: "verified",
    }).success,
    false,
  );
});
test("station queries have bounded length, reject control/duplicate values and escape regex", () => {
  assert.equal(stationQuery(new URLSearchParams("q=+Lahore+")), "Lahore");
  assert.equal(stationQuery(new URLSearchParams()), "");
  assert.throws(() => stationQuery(new URLSearchParams({ q: "x".repeat(81) })));
  assert.throws(() => stationQuery(new URLSearchParams("q=a&q=b")));
  assert.throws(() => stationQuery(new URLSearchParams({ q: "x\u0000y" })));
  assert.equal(new RegExp(escapeRegex(".*(LHE)"), "i").test(".*(LHE)"), true);
  assert.equal(new RegExp(escapeRegex(".*"), "i").test("Lahore"), false);
  assert.equal(STATION_LIMIT, 12);
  assert.deepEqual(publicStation({ id: "s", name: "Station", city: null }), {
    id: "s",
    name: "Station",
  });
});
test("missing/invalid database configuration and raw errors never expose credentials", async () => {
  const originalUri = process.env.MONGODB_URI,
    originalDb = process.env.MONGODB_DB;
  try {
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_DB;
    await assert.rejects(
      database,
      (e: unknown) => e instanceof DatabaseError && e.code === "DB_CONFIG",
    );
    process.env.MONGODB_URI = "mongodb://private-user:private-password@";
    process.env.MONGODB_DB = "rail";
    await assert.rejects(
      database,
      (e: unknown) =>
        e instanceof DatabaseError && !e.message.includes("private-password"),
    );
    const safe = publicDatabaseError(
      new Error("mongodb+srv://private-user:private-password@host"),
    );
    assert.equal(safe.code, "DB_UNAVAILABLE");
    assert.ok(!safe.message.includes("private-password"));
  } finally {
    if (originalUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = originalUri;
    if (originalDb === undefined) delete process.env.MONGODB_DB;
    else process.env.MONGODB_DB = originalDb;
  }
});
test("catalogue station IDs and label snapshots survive booking restoration", () => {
  const b = freshBooking();
  b.search = {
    ...b.search,
    from: "public-a",
    to: "public-b",
    trip: "oneway",
    date: addDays(today(), 1),
    stationNames: {
      "public-a": "Public station A",
      "public-b": "Public station B",
    },
  };
  assert.deepEqual(searchErrors(b.search), {});
  const saved = restore(JSON.stringify(b));
  assert.equal(station(saved.search.from, saved.search), "Public station A");
  assert.equal(saved.search.to, "public-b");
});

test("station endpoint validates before DB access and distinguishes empty success from failure", async () => {
  let calls = 0;
  const search = async () => {
    calls++;
    return { provider: "mongodb" as const, stations: [] };
  };
  const invalid = await stationResponse(
    new Request("http://localhost/api/stations?q=" + "x".repeat(81)),
    search,
  );
  assert.equal(invalid.status, 400);
  assert.equal(calls, 0);
  const empty = await stationResponse(
    new Request("http://localhost/api/stations?q=Lahore"),
    search,
  );
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), { provider: "mongodb", stations: [] });
  const failure = await stationResponse(
    new Request("http://localhost/api/stations"),
    async () => {
      throw new Error("mongodb://secret:private@host");
    },
  );
  assert.equal(failure.status, 503);
  assert.equal(failure.headers.get("cache-control"), "no-store");
  assert.ok(!(await failure.text()).includes("private"));
});

test("database reference lookup errors are sanitized in importer reports", async () => {
  const plan = await planImport("stations", records, async () => {
    throw new Error("mongodb://private:secret@host");
  });
  assert.equal(plan.counts.rejected, 6);
  assert.ok(!JSON.stringify(plan.errors).includes("secret"));
});

test("changed facts cannot silently inherit verification from an older record", async () => {
  const before = records[0];
  const plan = await planImport(
    "stations",
    [{ id: before.id, name: "A different unverified name" }],
    async () => before,
  );
  assert.equal(plan.counts.rejected, 1);
  assert.match(plan.errors[0].message, /requires explicit source metadata/);
});
