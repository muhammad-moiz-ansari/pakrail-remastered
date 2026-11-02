import type { Metadata } from "next";
import "./globals.css";
import "./marketing.css";
import "./people.css";
import "./careers.css";
import localFont from "next/font/local";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
const manrope = localFont({
  src: "../../public/fonts/Manrope.ttf",
  variable: "--font-ui",
  display: "swap",
  weight: "200 800",
  fallback: ["system-ui", "Arial"],
});
const bodoni = localFont({
  src: [
    {
      path: "../../public/fonts/BodoniModa.ttf",
      style: "normal",
      weight: "400 900",
    },
    {
      path: "../../public/fonts/BodoniModa-Italic.ttf",
      style: "italic",
      weight: "400 900",
    },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["Georgia"],
});
export const metadata: Metadata = {
  icons: { icon: "/logo.png" },
  title: "Pakistan Railways | Book Your Train Journey",
  description:
    "Plan your rail journey across Pakistan. Explore destinations, compare travel classes and find a train for your next trip.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${manrope.variable} ${bodoni.variable}`}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
