import { z } from "zod";
export const pointSchema = z.object({
  stationId: z.string().min(1).max(80),
  name: z.string(),
  lat: z.number().finite().min(-85).max(85),
  lng: z.number().finite().min(-180).max(180),
  source: z.url(),
});
export type StationPoint = z.infer<typeof pointSchema>;
export const geographySeeds: StationPoint[] = [
  {
    stationId: "LHE",
    name: "LAHORE JN.",
    lat: 31.5772,
    lng: 74.3363,
    source: "https://en.wikipedia.org/wiki/Lahore_Junction_railway_station",
  },
  {
    stationId: "RWP",
    name: "RAWALPINDI",
    lat: 33.6036,
    lng: 73.0483,
    source: "https://en.wikipedia.org/wiki/Rawalpindi_railway_station",
  },
  {
    stationId: "KHI",
    name: "KARACHI CANTT",
    lat: 24.8438,
    lng: 67.0412,
    source: "https://en.wikipedia.org/wiki/Karachi_Cantonment_railway_station",
  },
  {
    stationId: "ISB",
    name: "MARGALA",
    lat: 33.663653,
    lng: 73.048182,
    source: "https://en.wikipedia.org/wiki/Margalla_railway_station",
  },
  {
    stationId: "MUX",
    name: "MULTAN CANTT",
    lat: 30.1804,
    lng: 71.4446,
    source: "https://multan.punjab.gov.pk/node/289",
  },
  {
    stationId: "FSD",
    name: "FAISALABAD",
    lat: 31.41722,
    lng: 73.09667,
    source: "https://en.wikipedia.org/wiki/Faisalabad_railway_station",
  },
];
export const routeQuery = z
  .object({
    from: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/),
    to: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/),
  })
  .refine((v) => v.from !== v.to);
export const geographyResponse = z.object({
  points: z.array(pointSchema).max(2),
});
