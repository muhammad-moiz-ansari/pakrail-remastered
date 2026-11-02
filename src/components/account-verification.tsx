"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
export default function AccountVerification({
  verified,
  email,
  mailEnabled,
}: {
  verified: boolean;
  email: string;
  mailEnabled: boolean;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  if (verified) return <p>Email verified.</p>;
  return (
    <div>
      <p>
        Email not yet verified.{" "}
        {mailEnabled
          ? "Development verification links are delivered to the private local mail sink."
          : "Email delivery is not configured."}
      </p>
      {mailEnabled && (
        <button
          className="text-button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const result = await authClient.sendVerificationEmail({
              email,
              callbackURL: "/account",
            });
            setMessage(
              result.error
                ? "Verification could not be requested."
                : "Verification requested in the local development mail sink. No external email sent.",
            );
            setBusy(false);
          }}
        >
          Request verification link
        </button>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
