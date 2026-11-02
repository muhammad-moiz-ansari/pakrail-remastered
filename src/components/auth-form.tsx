"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  draftRequest,
  draftStorageKey,
  DraftRequestError,
  persistCurrentDraft,
} from "@/lib/draft-client";
import { safeReturnTo } from "@/lib/auth-navigation";
export default function AuthForm({
  mode,
  returnTo = "/account",
  token = "",
  mailEnabled = false,
}: {
  mode: "login" | "signup" | "forgot" | "reset";
  returnTo?: string;
  token?: string;
  mailEnabled?: boolean;
}) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [visible, setVisible] = useState(false);
  const destination = safeReturnTo(returnTo),
    signup = mode === "signup",
    forgot = mode === "forgot",
    reset = mode === "reset";
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim(),
      email = String(form.get("email") ?? "")
        .trim()
        .toLowerCase(),
      password = String(form.get("password") ?? "");
    setError("");
    setMessage("");
    if ((signup || reset) && password !== form.get("confirm")) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (forgot) {
        if (!mailEnabled)
          throw Error(
            "Password recovery email is not configured on this server.",
          );
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: "/reset-password",
        });
        if (result.error)
          throw Error(
            result.error.message ?? "Recovery could not be requested.",
          );
        setMessage(
          "If this email has an account, a recovery message is available in the local development mail sink. No external email was sent.",
        );
        return;
      }
      if (reset) {
        if (!token)
          throw Error(
            "This recovery link is missing or invalid. Request a new one.",
          );
        const result = await authClient.resetPassword({
          newPassword: password,
          token,
        });
        if (result.error)
          throw Error(
            result.error.message ?? "This recovery link is invalid or expired.",
          );
        setMessage("Password updated. Please log in with your new password.");
        return;
      }
      // Persist before leaving the anonymous context; failure never discards local fields.
      try {
        await persistCurrentDraft();
      } catch (e) {
        if (!(e instanceof DraftRequestError) || e.status !== 403) throw e;
      }
      const result = signup
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error)
        throw Error(
          result.error.message ??
            "Please check your account details and try again.",
        );
      const claimed = await draftRequest("claim");
      if (claimed)
        sessionStorage.setItem(
          draftStorageKey,
          JSON.stringify(claimed.snapshot),
        );
      if (destination === "/booking/payment") {
        try {
          await draftRequest("checkout");
        } catch (e) {
          setMessage(
            e instanceof Error ? e.message : "Your places need checking again.",
          );
          router.push("/booking/review?checkout=review");
          router.refresh();
          return;
        }
      }
      router.push(destination);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The account service is unavailable.",
      );
    } finally {
      setBusy(false);
    }
  };
  const title = signup
    ? "Create your account"
    : forgot
      ? "Reset your password"
      : reset
        ? "Choose a new password"
        : "Welcome back";
  return (
    <main id="main-content" className="account-main">
      <section className="account-form panel">
        <span className="eyebrow">PAKISTAN RAILWAYS</span>
        <h1>{title}</h1>
        <p>
          {destination === "/booking/payment"
            ? "Log in to continue to payment. Your travellers and selected places are saved; the hold deadline stays the same."
            : "Manage your bookings and return to your journey whenever you’re ready."}
        </p>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="account-message" role="status">
            {message}
          </p>
        )}
        <form onSubmit={submit}>
          {signup && (
            <label htmlFor="account-name">
              Name
              <input
                id="account-name"
                className="input"
                name="name"
                autoComplete="name"
                required
                maxLength={120}
              />
            </label>
          )}
          {!reset && (
            <label htmlFor="account-email">
              Email address
              <input
                id="account-email"
                className="input"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
          )}
          {!forgot && (
            <>
              <label htmlFor="account-password">
                Password
                <input
                  id="account-password"
                  className="input"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete={
                    signup || reset ? "new-password" : "current-password"
                  }
                  required
                  minLength={signup || reset ? 8 : undefined}
                  maxLength={128}
                />
              </label>
              <button
                className="text-button password-toggle"
                type="button"
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
              >
                {visible ? "Hide password" : "Show password"}
              </button>
            </>
          )}
          {(signup || reset) && (
            <>
              <small>
                Use 8–128 characters. Pasted passwords and password managers are
                welcome.
              </small>
              <label htmlFor="account-confirm">
                Confirm password
                <input
                  id="account-confirm"
                  className="input"
                  name="confirm"
                  type={visible ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                />
              </label>
            </>
          )}
          <button
            className="button primary full"
            disabled={busy || (forgot && !mailEnabled)}
          >
            {busy
              ? "Please wait…"
              : signup
                ? "Create account"
                : forgot
                  ? "Request recovery link"
                  : reset
                    ? "Update password"
                    : "Log in"}
          </button>
        </form>
        {forgot && !mailEnabled && (
          <p>
            Recovery email is not configured. Contact the project maintainer; no
            email will be claimed as sent.
          </p>
        )}
        {!forgot && !reset && (
          <p>
            {signup ? "Already have an account?" : "New here?"}{" "}
            <Link
              href={`/${signup ? "login" : "signup"}?returnTo=${encodeURIComponent(destination)}`}
            >
              {signup ? "Log in" : "Create account"}
            </Link>
          </p>
        )}
        {!signup && !forgot && !reset && (
          <Link href="/forgot-password">Forgot your password?</Link>
        )}
        {(forgot || reset) && <Link href="/login">Back to login</Link>}
        <Link
          className="account-back"
          href={destination === "/booking/payment" ? "/booking/review" : "/"}
        >
          Continue reviewing your journey
        </Link>
      </section>
    </main>
  );
}
