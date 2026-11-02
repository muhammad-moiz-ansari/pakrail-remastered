import BookingApp from "@/components/booking-app";
import { notFound, redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { sessionFor } from "@/server/auth";
import { draftStore, draftCookie } from "@/server/booking-drafts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const titles: Record<string, string> = {
    trains: "Choose trains",
    classes: "Choose classes",
    passengers: "Traveller details",
    seats: "Choose seats",
    review: "Review booking",
    payment: "Test payment",
    confirmation: "Booking confirmation",
  };
  return { title: `${titles[step] ?? "Booking"} | Pakistan Railways` };
}
export default async function Page({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  if (
    ![
      "trains",
      "classes",
      "passengers",
      "seats",
      "review",
      "payment",
      "confirmation",
    ].includes(step)
  )
    notFound();
  if (step === "payment") {
    const session = await sessionFor(await headers());
    if (!session) redirect("/login?returnTo=/booking/payment");
    let snapshot;
    try {
      const row = await (
        await draftStore()
      ).checkout((await cookies()).get(draftCookie)?.value, session.user.id);
      snapshot = row.snapshot;
    } catch {
      redirect("/booking/review?checkout=review");
    }
    return <BookingApp step={step} initialBooking={snapshot} />;
  }
  return <BookingApp step={step} />;
}
