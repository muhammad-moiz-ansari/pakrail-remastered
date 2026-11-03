export type GalleryPhoto = {
  id: string;
  src: string;
  originalUrl: string;
  sourceUrl: string;
  title: string;
  alt: string;
  caption: string;
  category: string;
  width: number;
  height: number;
  focalPoint: string;
  credit: string;
  license: string;
  licenseUrl: string;
  permissionNote: string;
  order: number;
  published: boolean;
};

const commons = "https://commons.wikimedia.org/wiki/File:";
const uploads = "https://upload.wikimedia.org/wikipedia/commons/";
const shareAlike = (version: string) => ({
  license: `CC BY-SA ${version}`,
  licenseUrl: `https://creativecommons.org/licenses/by-sa/${version}/`,
  permissionNote:
    "Reuse permitted with attribution and share-alike. Responsive cropping and image compression only; derivatives remain under the linked licence.",
});

/** Curated public content, like home-content.ts. No downloads occur during page requests. */
export const galleryPhotos: GalleryPhoto[] = [
  {
    id: "khyber-1993",
    src: "/images/home/train-hero.jpg",
    originalUrl: `${uploads}a/a8/KhyberRailway_01.jpg`,
    sourceUrl: `${commons}KhyberRailway_01.jpg`,
    title: "Climbing the Khyber Pass",
    alt: "A steam-hauled charter train winding through the rocky Khyber Pass",
    caption:
      "A Pakistan Railways charter train climbs the Khyber Pass through a series of zig-zags. Historical photograph, December 1993; not a current service listing.",
    category: "Scenic journeys",
    width: 1280,
    height: 864,
    focalPoint: "50% 55%",
    credit: "MaltaGC / Wikimedia Commons",
    ...shareAlike("3.0"),
    order: 1,
    published: true,
  },
  {
    id: "rawalpindi-station-2016",
    src: "/images/home/destination-rawalpindi.jpg",
    originalUrl: `${uploads}8/88/Rawalpindi_Railway_Station_-_01.jpg`,
    sourceUrl: `${commons}Rawalpindi_Railway_Station_-_01.jpg`,
    title: "Rawalpindi railway station",
    alt: "The arched facade, green dome and garden at Rawalpindi railway station",
    caption: "Rawalpindi railway station, photographed on 2 October 2016.",
    category: "Stations",
    width: 1200,
    height: 800,
    focalPoint: "center",
    credit: "Rana Usman Shakoor / Wikimedia Commons",
    ...shareAlike("4.0"),
    order: 2,
    published: true,
  },
  {
    id: "pakistan-train-2008",
    src: "/images/gallery/pakistan-train.jpg",
    originalUrl: `${uploads}2/2b/Pakistan_Railway_Train.jpg`,
    sourceUrl: `${commons}Pakistan_Railway_Train.jpg`,
    title: "Along the platform",
    alt: "A Pakistan Railways train alongside a station platform",
    caption:
      "A Pakistan Railways train, photographed by Farhan on 5 April 2008. The original source does not name the service.",
    category: "Trains",
    width: 2592,
    height: 1944,
    focalPoint: "center",
    credit: "Farhan (Fantaz) / Flickr, via Wikimedia Commons",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    permissionNote:
      "Reuse permitted with attribution. Responsive cropping and image compression only.",
    order: 3,
    published: true,
  },
  {
    id: "hangu-bridge-2003",
    src: "/images/gallery/hangu-bridge.jpg",
    originalUrl: `${uploads}f/f9/Railway_bridge%2C_Hangu%2C_Pakistan.jpg`,
    sourceUrl: `${commons}Railway_bridge,_Hangu,_Pakistan.jpg`,
    title: "A railway bridge in Hangu",
    alt: "A railway bridge spanning the landscape in Hangu, Pakistan",
    caption:
      "Railway bridge in Hangu, Pakistan. The source dates this photograph to 3 January 2003.",
    category: "Bridges",
    width: 2816,
    height: 2120,
    focalPoint: "center",
    credit: "franek2 / Panoramio, via Wikimedia Commons",
    ...shareAlike("3.0"),
    order: 4,
    published: true,
  },
  {
    id: "lahore-station-2015",
    src: "/images/gallery/lahore-station.jpg",
    originalUrl: `${uploads}3/3d/Lahore-railway-station.jpg`,
    sourceUrl: `${commons}Lahore-railway-station.jpg`,
    title: "Lahore Junction",
    alt: "The brick facade and twin towers of Lahore Junction railway station",
    caption: "The front of Lahore Junction railway station, 9 February 2015.",
    category: "Stations",
    width: 3264,
    height: 1840,
    focalPoint: "center",
    credit: "Joe mon bkk / Wikimedia Commons",
    ...shareAlike("4.0"),
    order: 5,
    published: true,
  },
  {
    id: "lahore-preserved-engine-2012",
    src: "/images/gallery/lahore-heritage.jpg",
    originalUrl: `${uploads}c/c1/Pakistan_Railways_headquarters_2.jpg`,
    sourceUrl: `${commons}Pakistan_Railways_headquarters_2.jpg`,
    title: "A preserved steam locomotive",
    alt: "A preserved steam locomotive on display at the railway offices in Lahore",
    caption:
      "A former Kalabagh–Bannu Railway locomotive on display at the Pakistan Railways offices in Lahore. Photographed on 27 December 2012.",
    category: "Railway heritage",
    width: 4608,
    height: 3072,
    focalPoint: "center",
    credit: "Khalid Mahmood / Wikimedia Commons",
    ...shareAlike("3.0"),
    order: 6,
    published: true,
  },
];

export function publishedGallery(photos: GalleryPhoto[]) {
  return photos
    .filter((photo) => photo.published)
    .sort((a, b) => a.order - b.order);
}

export function filterGallery(photos: GalleryPhoto[], category: string) {
  return publishedGallery(photos).filter(
    (photo) => category === "All photographs" || photo.category === category,
  );
}
