export const informationPages = {
  about: { title: "The journey connects us.", label: "About us", parent: null },
  people: { title: "Our people", label: "Our people", parent: "about" },
  journey: {
    title: "A different view of Pakistan.",
    label: "The rail journey",
    parent: "planning",
  },
  help: {
    title: "A little help along the way.",
    label: "Passenger help",
    parent: null,
  },
  stations: {
    title: "Find your station.",
    label: "Station directory",
    parent: "planning",
  },
  credits: {
    title: "Behind the photographs.",
    label: "Image credits",
    parent: "resources",
  },
  sitemap: { title: "Find your way around.", label: "Sitemap", parent: null },
} as const;
export type InformationTopic = keyof typeof informationPages;
export function isInformationTopic(topic: string): topic is InformationTopic {
  return Object.hasOwn(informationPages, topic);
}
export type BreadcrumbItem = { label: string; href?: string };
const ancestors = {
  about: { label: "About us", href: "/information/about" },
  planning: { label: "Plan your journey", href: "/#booking" },
  resources: { label: "Resources", href: "/information/sitemap" },
};
const bookingPages: Record<string, string> = {
  "/booking/trains": "Choose trains",
  "/booking/classes": "Choose classes",
  "/booking/passengers": "Traveller details",
  "/booking/seats": "Choose seats",
  "/booking/review": "Review booking",
  "/booking/payment": "Test payment",
  "/booking/confirmation": "Booking summary",
};
/** Exact route metadata, independent of click history. Home and unknown routes omit the strip. */
export function breadcrumbsForPath(pathname: string): BreadcrumbItem[] {
  const home = { label: "Pakistan Railways", href: "/" };
  const normalized = pathname === "/" ? pathname : pathname.replace(/\/$/, "");
  const topic = normalized.split("/")[2];
  if (normalized === `/information/${topic}` && isInformationTopic(topic)) {
    const page = informationPages[topic];
    return [
      home,
      ...(page.parent ? [ancestors[page.parent]] : []),
      { label: page.label },
    ];
  }
  if (Object.hasOwn(bookingPages, normalized))
    return [
      home,
      { label: "Book a journey", href: "/#booking" },
      { label: bookingPages[normalized] },
    ];
  return [];
}
