import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { database } from "./db/mongodb";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export function authOrigin() {
  const value = process.env.BETTER_AUTH_URL;
  if (!value) throw Error("AUTH_CONFIG");
  const url = new URL(value);
  if (
    url.origin !== value ||
    (url.protocol !== "https:" &&
      !["127.0.0.1", "localhost"].includes(url.hostname))
  )
    throw Error("AUTH_CONFIG");
  return url.origin;
}
export function developmentMailEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.AUTH_MAIL_MODE === "local"
  );
}
async function deliver(kind: string, email: string, url: string) {
  if (!developmentMailEnabled())
    throw Error("Email delivery is not configured.");
  await mkdir(".local/auth-mail", { recursive: true });
  await writeFile(
    `.local/auth-mail/${randomUUID()}.json`,
    JSON.stringify({ kind, email, url, createdAt: new Date().toISOString() }),
    { mode: 0o600, flag: "wx" },
  );
}
let instance: ReturnType<typeof betterAuth> | undefined;
export async function getAuth(): Promise<ReturnType<typeof betterAuth>> {
  if (instance) return instance;
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw Error("AUTH_CONFIG");
  const db = await database();
  // Non-destructive indexes. Independent namespace from the public catalogue.
  await Promise.all([
    db.collection("auth_user").createIndex({ email: 1 }, { unique: true }),
    db.collection("auth_session").createIndex({ token: 1 }, { unique: true }),
    db.collection("auth_session").createIndex({ userId: 1 }),
    db
      .collection("auth_account")
      .createIndex({ providerId: 1, accountId: 1 }, { unique: true }),
    db.collection("auth_verification").createIndex({ identifier: 1 }),
    db.collection("auth_rateLimit").createIndex({ key: 1 }, { unique: true }),
  ]);
  const mail = developmentMailEnabled();
  const options: BetterAuthOptions = {
    appName: "Pakistan Railways Remastered",
    baseURL: authOrigin(),
    secret,
    database: mongodbAdapter(db),
    user: { modelName: "auth_user" },
    account: { modelName: "auth_account" },
    verification: { modelName: "auth_verification" },
    session: {
      modelName: "auth_session",
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      ...(mail
        ? {
            sendResetPassword: async ({
              user,
              url,
            }: {
              user: { email: string };
              url: string;
            }) => deliver("reset-password", user.email, url),
          }
        : {}),
    },
    ...(mail
      ? {
          emailVerification: {
            sendOnSignUp: true,
            sendVerificationEmail: async ({
              user,
              url,
            }: {
              user: { email: string };
              url: string;
            }) => deliver("verify-email", user.email, url),
          },
        }
      : {}),
    trustedOrigins: [authOrigin()],
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "auth_rateLimit",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 60, max: 3 },
      },
    },
    advanced: {
      cookiePrefix: "pakrail",
      useSecureCookies: authOrigin().startsWith("https:"),
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
    logger: { disabled: true },
  };
  instance = betterAuth(options);
  return instance;
}
export async function sessionFor(headers: Headers) {
  return (await getAuth()).api.getSession({ headers });
}
