import { loadEnvConfig } from "@next/env";
import { database, closeDatabase } from "../src/server/db/mongodb";
async function main() {
  loadEnvConfig(process.cwd());
  if (
    process.env.NODE_ENV === "production" ||
    process.env.PAYMENT_MODE !== "sandbox" ||
    /prod|live/i.test(process.env.MONGODB_DB ?? "") ||
    !process.argv.includes("--development-database")
  )
    throw Error("Refusing non-development sandbox fixture import.");
  const db = await database();
  const fixtures = [
    {
      id: "visa-frictionless",
      pan: "4111111111111111",
      scenario: "Frictionless success",
    },
    {
      id: "mastercard-frictionless",
      pan: "5555555555554444",
      scenario: "Frictionless success",
    },
    {
      id: "authentication-failure",
      pan: "4456530000001104",
      scenario: "Authentication failure",
    },
  ];
  let inserted = 0;
  for (const fixture of fixtures) {
    const result = await db
      .collection("sandbox_payment_test_cases_v1")
      .updateOne(
        { id: fixture.id },
        {
          $setOnInsert: {
            ...fixture,
            provider: "safepay",
            environment: "sandbox",
            developmentOnly: true,
            source: "https://apidocs.getsafepay.com/",
            reviewedAt: "2026-11-03",
          },
        },
        { upsert: true },
      );
    inserted += result.upsertedCount;
  }
  console.log(
    JSON.stringify({
      fixtures: fixtures.length,
      inserted,
      unchanged: fixtures.length - inserted,
    }),
  );
}
void main()
  .catch(() => {
    console.error("Sandbox fixtures were not imported.");
    process.exitCode = 1;
  })
  .finally(closeDatabase);
