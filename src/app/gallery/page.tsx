import PhotoGallery from "@/components/photo-gallery";
import { galleryPhotos, publishedGallery } from "@/lib/gallery";

export const metadata = {
  title: "Photo gallery | Pakistan Railways",
  description:
    "Explore Pakistan's rail journeys, places and people in photographs.",
};

export default function GalleryPage() {
  return (
    <main id="main-content" className="gallery-page rail-container">
      <header className="gallery-intro">
        <p className="gallery-eyebrow">THE JOURNEY, IN PICTURES</p>
        <h1>Photo gallery</h1>
        <p>Explore Pakistan&apos;s rail journeys, places and people.</p>
        <p className="gallery-context">
          From familiar platforms to railway heritage, a collection of real
          moments across the network. Dates and photo credits accompany each
          image.
        </p>
      </header>
      <PhotoGallery photos={publishedGallery(galleryPhotos)} />
      <aside className="gallery-source-note">
        <p>
          Historical photographs do not describe current train services or
          facilities.
        </p>
      </aside>
    </main>
  );
}
