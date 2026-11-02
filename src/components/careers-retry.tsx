"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function CareersRetry() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="button secondary"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "Retrying…" : "Retry"}
    </button>
  );
}
