import BookingApp from "@/components/booking-app";
import { notFound } from "next/navigation";
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
    payment: "Demo payment",
    confirmation: "Booking confirmation",
  };
  return { title: `${titles[step] ?? "Booking"} | Designify` };
}
export function generateStaticParams() {
  return [
    "trains",
    "classes",
    "passengers",
    "seats",
    "review",
    "payment",
    "confirmation",
  ].map((step) => ({ step }));
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
  return <BookingApp step={step} />;
}
