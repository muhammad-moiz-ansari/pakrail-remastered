import type { travelClasses } from "./coach-layouts";

type ClassInformation = {
  preview: string;
  introduction: string;
  accommodation: string;
  features: string[];
  suitedTo: string;
};

// Customer-facing editorial content; evidence and variant decisions live in
// docs/travel-class-content.md. Booking catalogue snapshots remain immutable.
export const classInformation = {
  economy: {
    preview:
      "Fan-cooled seats or sleeping berths for budget-conscious journeys.",
    introduction:
      "Economy keeps travel simple, with fan-cooled accommodation and a choice of seated or sleeping coaches where offered.",
    accommodation:
      "The seated variant shown here has fixed, non-rotating standard seats, with groups of three and side seats across the aisle. The berth variant has partitioned bays with lower, middle and upper sleeping berths, side seats and small tables.",
    features: [
      "Fans and openable windows provide ventilation; this class is not air-conditioned.",
      "Choose a seat for a daytime trip or a berth variant for a journey involving sleep; side seats are seated accommodation.",
      "Bring your own bedding for the Economy berth variant. Meals are not included; food availability depends on the service.",
    ],
    suitedTo:
      "A practical choice for travellers prioritising budget: fixed seats for shorter day trips, or a sleeping berth for an overnight journey without air conditioning.",
  },
  standard: {
    preview:
      "Air-conditioned comfort, with seated or berth variants by service.",
    introduction:
      "AC Standard offers air-conditioned travel without the premium cabin experience of AC Sleeper.",
    accommodation:
      "Seated variants are described with 2+2 reclining seats and headrests. The AC Lower / Standard variant shown here is instead a berth layout, with grouped places, side accommodation and tables. Its reference does not identify each berth’s tier.",
    features: [
      "Air conditioning provides a cooler alternative to fan-cooled Economy.",
      "Newer seated coaches may have a charging point at each seat; this is not confirmed for this berth variant.",
      "Meals are not included. Do not assume the seated variant’s recliners or charging facilities apply to every AC Standard coach.",
    ],
    suitedTo:
      "Suited to families and travellers who want air conditioning for daytime or longer journeys. Choose the actual coach variant according to whether you want to sit or sleep.",
  },
  business: {
    preview:
      "Air-conditioned travel with lounge berths or wider seated variants.",
    introduction:
      "AC Business offers a more comfort-focused air-conditioned journey, with accommodation that changes between coach variants.",
    accommodation:
      "The berth variant shown here has lounges A–I, each containing two three-tier berth stacks: lower, middle and upper, with a table. Other services are described with wider 2+2 seats and additional legroom; those seats are a different variant from this lounge-berth coach.",
    features: [
      "Partitioned lounges group these sleeping berths together, rather than providing an individual private room.",
      "Some seated Business services include meals, tea and water; confirm inclusion for your chosen train.",
      "Charging points and reading lights are offered on some seated Business services; they are not confirmed for this lounge-berth variant.",
    ],
    suitedTo:
      "Suited to longer journeys when you value air conditioning and a more defined lounge arrangement, or a wider seat on services offering the seated variant.",
  },
  sleeper: {
    preview:
      "Upper and lower sleeping berths in air-conditioned shared cabins.",
    introduction:
      "AC Sleeper is designed for rest on overnight journeys, with sleeping berths inside air-conditioned cabins.",
    accommodation:
      "The cabin variant shown here has two-berth and four-berth cabins, with lower and upper berths, tables and cabin-associated toilets along a corridor. An individual berth does not reserve the whole cabin: other berths may be shared with fellow passengers.",
    features: [
      "Cabins separate sleeping accommodation from the corridor, offering more separation than an open seated coach.",
      "Some four-berth cabins are described with a lockable door, blanket and pillow. Confirm locks and bedding provision for your chosen service.",
      "This cabin variant has upper and lower tiers, with no middle berth; other services may offer a different cabin arrangement.",
    ],
    suitedTo:
      "Suited to overnight travellers who want to lie down, and groups seeking cabin accommodation. Sharing and privacy depend on how many of the cabin’s berths your group reserves.",
  },
  parlour: {
    preview:
      "Air-conditioned reclining seats for a more relaxed daytime journey.",
    introduction:
      "AC Parlour Car focuses on premium seated comfort, rather than sleeping berths.",
    accommodation:
      "The variant shown here has reclining seats in a 2+2 layout across a central aisle. Seats can rotate in this prototype’s current Parlour configuration; rotation on a particular train still depends on its coach variant.",
    features: [
      "Recliners provide a more relaxed seated option for daytime travel; they are not sleeping berths or private cabins.",
      "This coach’s central aisle serves pairs of seats on both sides, rather than enclosed sleeping compartments.",
      "Some premium Parlour services are described with individual pods, meal service, Wi-Fi and screens. These facilities are not confirmed for this rotating-seat variant.",
    ],
    suitedTo:
      "Suited to travellers who prefer to remain seated in air-conditioned reclining accommodation, especially for a comfortable day journey.",
  },
} satisfies Record<(typeof travelClasses)[number]["id"], ClassInformation>;
