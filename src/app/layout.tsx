import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Designify | A better way to journey",
  description:
    "Find your train, bring your people, and choose your seat. A Pakistan Railways booking redesign prototype.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
