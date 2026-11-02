import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { sessionFor } from "@/server/auth";
import { draftStore } from "@/server/booking-drafts";
import AccountTicket from "@/components/account-ticket";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your ticket | Pakistan Railways" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await sessionFor(await headers());
  if (!session) redirect("/login?returnTo=/account");
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) notFound();
  const row = await (await draftStore()).owned(id, session.user.id);
  if (!row) notFound();
  return (
    <main id="main-content" className="account-main">
      <AccountTicket booking={row.snapshot} />
    </main>
  );
}
