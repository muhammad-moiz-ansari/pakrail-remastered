"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { persistCurrentDraft } from "@/lib/draft-client";
import { safeReturnTo } from "@/lib/auth-navigation";
export default function AccountAccess({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { data: session, isPending } = authClient.useSession(),
    router = useRouter(),
    pathname = usePathname();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const enter = async (
    event: React.MouseEvent<HTMLAnchorElement>,
    mode: string,
  ) => {
    event.preventDefault();
    onNavigate?.();
    try {
      await persistCurrentDraft();
    } catch {
      /* Keep the local draft; auth UI explains a genuine service failure. */
    }
    router.push(
      `/${mode}?returnTo=${encodeURIComponent(safeReturnTo(pathname))}`,
    );
  };
  return (
    <div className="account-access" aria-label="Account navigation">
      {isPending ? (
        <span>Account…</span>
      ) : session ? (
        <>
          <Link href="/account" onClick={onNavigate}>
            My account
          </Link>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              const result = await authClient.signOut();
              setBusy(false);
              if (result.error) {
                setError("Could not log out. Try again.");
                return;
              }
              onNavigate?.();
              router.refresh();
            }}
          >
            Log out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" onClick={(e) => enter(e, "login")}>
            Log in
          </Link>
          <Link href="/signup" onClick={(e) => enter(e, "signup")}>
            Create account
          </Link>
        </>
      )}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
