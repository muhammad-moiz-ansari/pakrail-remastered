import { loadEnvConfig } from "@next/env";
import { randomBytes, randomInt } from "node:crypto";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { database, closeDatabase } from "../src/server/db/mongodb";
import { checkoutFixture } from "../tests/fixtures/checkout";
import { addDays, today, trains, recommend, pricing } from "../src/lib/booking";
import { sampleCoachServices, serviceOffers } from "../src/lib/coach-layouts";
async function main() {
  loadEnvConfig(process.cwd());
  if (process.env.NODE_ENV === "production" || !process.argv.includes("--run"))
    throw Error(
      "Use --run in development only. This creates isolated QA users and sample bookings.",
    );
  const origin = process.env.BETTER_AUTH_URL!;
  assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
  class Browser {
    cookies = new Map<string, string>();
    async request(path: string, body?: unknown, method?: string) {
      const response = await fetch(origin + path, {
        method: method ?? (body ? "POST" : "GET"),
        headers: {
          Origin: origin,
          ...(body ? { "Content-Type": "application/json" } : {}),
          Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
        },
        body: body ? JSON.stringify(body) : undefined,
        redirect: "manual",
      });
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(";")[0],
          at = pair.indexOf("=");
        this.cookies.set(pair.slice(0, at), pair.slice(at + 1));
      }
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
      return {
        status: response.status,
        data,
        location: response.headers.get("location"),
        text,
      };
    }
    async action(action: string, extra: Record<string, unknown> = {}) {
      return this.request("/api/booking-draft", { action, ...extra });
    }
  }
  const checks: string[] = [];
  const ok = (label: string) => {
    checks.push(label);
    console.log("PASS " + label);
  };
  const guest = new Browser(),
    other = new Browser(),
    stranger = new Browser();
  const stamp = Date.now().toString(36),
    email = `phase2-${stamp}@example.test`,
    otherEmail = `phase2-other-${stamp}@example.test`,
    password = randomBytes(24).toString("base64url");
  try {
    const db = await database();
    for (const step of ["trains", "classes", "passengers", "seats"])
      assert.equal((await guest.request("/booking/" + step)).status, 200);
    ok("signed-out pre-payment pages remain public");
    assert.equal((await guest.request("/booking/payment")).status, 307);
    assert.equal((await guest.action("checkout")).status, 401);
    assert.equal((await guest.action("complete-simulation")).status, 401);
    ok("direct payment route and server completion reject guests");
    const b = checkoutFixture(),
      day = addDays(today(), 30 + randomInt(90));
    b.search.date = day;
    b.search.returnDate = addDays(day, 1);
    b.legs = b.legs.map((l, i) => {
      const train = trains(b.search, l.id)[0],
        offer = serviceOffers(
          sampleCoachServices[0],
          train.from,
          train.to,
          train.date,
        ).find((o) => o.classId === (i ? "standard" : "economy"))!;
      return { ...l, train, offer };
    });
    const snapshot = recommend({ ...b, assignments: {}, suggested: {} });
    let result = await guest.action("save", { snapshot });
    assert.equal(result.status, 200);
    const draftId = result.data.id;
    assert.equal((await stranger.action("claim", { id: draftId })).status, 401);
    assert.equal((await stranger.request("/api/booking-draft")).data, null);
    result = await guest.action("prepare");
    assert.equal(result.status, 200);
    const deadline = result.data.holdExpiresAt;
    const heldSnapshot = result.data.snapshot;
    ok(
      "anonymous draft persists both legs, gender, passengers and exact places under an HttpOnly capability",
    );
    // A competing capability cannot reserve the same sample places.
    assert.equal((await stranger.action("save", { snapshot })).status, 200);
    assert.equal((await stranger.action("prepare")).status, 409);
    ok("sample place holds exclude competing drafts");
    assert.equal(
      (
        await guest.request("/api/auth/sign-up/email", {
          name: "Phase 2 QA",
          email: email.toUpperCase(),
          password,
        })
      ).status,
      200,
    );
    assert.equal((await guest.action("claim")).status, 200);
    result = await guest.action("checkout");
    assert.equal(result.status, 200);
    assert.equal(result.data.holdExpiresAt, deadline);
    assert.deepEqual(result.data.snapshot, heldSnapshot);
    assert.equal(
      (await guest.request("/api/auth/get-session")).data.user.email,
      email,
    );
    ok(
      "signup normalizes email, persists session and atomically claims only the current draft without changing its deadline or details",
    );
    assert.equal(
      (
        await stranger.request("/api/auth/sign-up/email", {
          name: "Duplicate",
          email,
          password,
        })
      ).status,
      422,
    );
    ok("duplicate normalized email rejected");
    // Logout must leave the authoritative draft while requiring a new login.
    const oldCookies = new Map(guest.cookies);
    assert.equal((await guest.request("/api/auth/sign-out", {})).status, 200);
    assert.equal((await guest.action("complete-simulation")).status, 401);
    const revoked = new Browser();
    revoked.cookies = oldCookies;
    assert.equal((await revoked.request("/api/auth/get-session")).data, null);
    assert.equal(
      (
        await guest.request("/api/auth/sign-in/email", {
          email,
          password: "wrong-password-value",
        })
      ).status,
      401,
    );
    assert.equal(
      (await guest.request("/api/auth/sign-in/email", { email, password }))
        .status,
      200,
    );
    assert.equal((await guest.action("claim")).status, 200);
    ok(
      "logout revokes session, wrong password fails and login restores only the owned draft",
    );
    assert.equal(
      (
        await other.request("/api/auth/sign-up/email", {
          name: "Phase 2 Other QA",
          email: otherEmail,
          password,
        })
      ).status,
      200,
    );
    other.cookies.set("pakrail_draft", guest.cookies.get("pakrail_draft")!);
    assert.equal((await other.action("claim")).status, 403);
    assert.equal((await other.action("checkout")).status, 403);
    assert.equal((await other.action("complete-simulation")).status, 403);
    ok(
      "cross-account claim, checkout and completion denied even with the draft capability",
    );
    await db
      .collection("booking_drafts_v1")
      .updateOne(
        { _id: draftId },
        { $set: { holdExpiresAt: new Date(Date.now() - 1000) } },
      );
    assert.equal((await guest.action("checkout")).status, 409);
    assert.equal((await guest.action("claim")).status, 200);
    assert.equal((await guest.action("prepare")).status, 409);
    assert.equal(
      (await guest.request("/api/booking-draft")).data.snapshot.passengers[0]
        .name,
      snapshot.passengers[0].name,
    );
    assert.equal((await guest.action("prepare", { renew: true })).status, 200);
    ok(
      "expired hold survives login/claim without extension; explicit availability recheck recovers the same places",
    );
    result = await guest.action("complete-simulation");
    assert.equal(result.status, 200);
    assert.equal(result.data.snapshot.status, "paid");
    const reference = result.data.snapshot.reference;
    assert.deepEqual(pricing(result.data.snapshot), pricing(snapshot));
    assert.equal(
      (await guest.action("complete-simulation")).data.snapshot.reference,
      reference,
    );
    assert.equal(
      (await guest.request(`/api/account/bookings/${draftId}`)).status,
      200,
    );
    assert.equal(
      (await other.request(`/api/account/bookings/${draftId}`)).status,
      404,
    );
    assert.equal(
      (await stranger.request(`/api/account/bookings/${draftId}`)).status,
      401,
    );
    assert.equal(
      (await other.request(`/account/bookings/${draftId}`)).status,
      404,
    );
    ok(
      "authenticated simulation finalizes once, totals stay correct and account ticket queries enforce ownership",
    );
    const user = await db.collection("auth_user").findOne({ email });
    assert.ok(user);
    const credential = await db
      .collection("auth_account")
      .findOne({ userId: user._id });
    assert.ok(
      credential?.password &&
        credential.password !== password &&
        !credential.password.includes(password),
    );
    assert.equal(
      (
        await guest.request("/api/auth/request-password-reset", {
          email,
          redirectTo: origin + "/reset-password",
        })
      ).status,
      200,
    );
    const messages = await Promise.all(
      (await readdir(".local/auth-mail"))
        .filter((f) => f.endsWith(".json"))
        .map(async (f) =>
          JSON.parse(await readFile(".local/auth-mail/" + f, "utf8")),
        ),
    );
    const verify = messages.find(
      (m) => m.email === email && m.kind === "verify-email",
    );
    assert.ok(verify);
    assert.ok(
      [200, 302, 303].includes(
        (
          await guest.request(
            new URL(verify.url).pathname + new URL(verify.url).search,
          )
        ).status,
      ),
    );
    const reset = messages
      .filter((m) => m.email === email && m.kind === "reset-password")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    assert.ok(reset);
    const resetUrl = new URL(reset.url);
    const token =
      resetUrl.searchParams.get("token") ??
      (resetUrl.pathname.startsWith("/api/auth/reset-password/")
        ? resetUrl.pathname.split("/").at(-1)
        : null);
    assert.ok(token);
    const newPassword = randomBytes(24).toString("base64url");
    assert.equal(
      (await guest.request("/api/auth/reset-password", { token, newPassword }))
        .status,
      200,
    );
    assert.equal(
      (await guest.request("/api/auth/reset-password", { token, newPassword }))
        .status,
      400,
    );
    assert.equal((await guest.request("/api/auth/get-session")).data, null);
    assert.equal(
      (
        await guest.request("/api/auth/sign-in/email", {
          email,
          password: newPassword,
        })
      ).status,
      200,
    );
    ok(
      "private development mail verifies email; recovery resets password once and revokes sessions",
    );
    await db
      .collection("auth_session")
      .updateMany(
        { userId: user._id },
        { $set: { expiresAt: new Date(Date.now() - 1000) } },
      );
    assert.equal((await guest.request("/api/auth/get-session")).data, null);
    assert.equal((await guest.action("checkout")).status, 401);
    ok("expired sessions are rejected by library and checkout endpoint");
    const hostile = await fetch(origin + "/api/booking-draft", {
      method: "POST",
      headers: {
        Origin: "https://evil.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "save", snapshot }),
    });
    assert.equal(hostile.status, 403);
    const hostileLogin = await fetch(origin + "/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        Origin: "https://evil.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(hostileLogin.status, 403);
    ok("cross-origin auth and draft mutation rejected");
    console.log(
      JSON.stringify(
        {
          checks: checks.length,
          qaAccountsCreated: 2,
          completedSampleBookings: 1,
          mode: "development only; no provider, email delivery or real charge",
        },
        null,
        2,
      ),
    );
  } finally {
    await closeDatabase();
  }
}
void main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Account checks failed.");
  process.exitCode = 1;
});
