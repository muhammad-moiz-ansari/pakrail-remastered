import { loadEnvConfig } from "@next/env";
import { readdir, readFile } from "node:fs/promises";
async function main() {
  loadEnvConfig(process.cwd());
  if (
    process.env.NODE_ENV === "production" ||
    process.env.AUTH_MAIL_MODE !== "local"
  )
    throw Error("Local development mail is disabled.");
  const files = await readdir(".local/auth-mail").catch(() => []);
  const messages = await Promise.all(
    files
      .filter((f) => /^[a-f0-9-]+\.json$/.test(f))
      .map(async (f) =>
        JSON.parse(await readFile(`.local/auth-mail/${f}`, "utf8")),
      ),
  );
  messages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // Deliberate developer-only access. Never imported by routes or bundled publicly.
  console.log(
    JSON.stringify(
      process.argv.includes("--latest") ? (messages[0] ?? null) : messages,
      null,
      2,
    ),
  );
}
void main().catch(() => {
  console.error("Development mail could not be read.");
  process.exitCode = 1;
});
