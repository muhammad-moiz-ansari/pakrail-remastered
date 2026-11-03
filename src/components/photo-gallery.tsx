"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, ImageOff, X } from "lucide-react";
import { filterGallery, type GalleryPhoto } from "@/lib/gallery";

function Photograph({
  photo,
  large = false,
}: {
  photo: GalleryPhoto;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div
      className="gallery-image-missing"
      role="img"
      aria-label={`Photograph unavailable: ${photo.alt}`}
    >
      <ImageOff aria-hidden="true" />
      <span>Photograph unavailable</span>
    </div>
  ) : (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={
        large
          ? "(max-width: 900px) 95vw, 1080px"
          : "(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
      }
      loading={large ? "eager" : "lazy"}
      style={{
        objectFit: large ? "contain" : "cover",
        objectPosition: photo.focalPoint,
      }}
      onError={() => setFailed(true)}
    />
  );
}

export default function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [category, setCategory] = useState("All photographs");
  const [selected, setSelected] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const categories = [
    "All photographs",
    ...new Set(photos.map((photo) => photo.category)),
  ];
  const visible = filterGallery(photos, category);
  const index = visible.findIndex((photo) => photo.id === selected);
  const current = visible[index];
  const isOpen = Boolean(current);

  useEffect(() => {
    if (!isOpen) return;
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal?.showModal();
    return () => {
      modal?.close();
      document.body.style.overflow = previousOverflow;
      opener.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const move = (offset: number) => {
    const next = visible[index + offset];
    if (next) setSelected(next.id);
  };

  return (
    <>
      <div className="gallery-toolbar">
        <div
          className="gallery-filters"
          role="group"
          aria-label="Filter photographs by category"
        >
          {categories.map((item) => (
            <button
              key={item}
              aria-pressed={item === category}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <p role="status">
          {visible.length} {visible.length === 1 ? "photograph" : "photographs"}
        </p>
      </div>
      {visible.length ? (
        <div className="gallery-grid">
          {visible.map((photo) => (
            <button
              key={photo.id}
              className="gallery-card"
              aria-label={`View photograph: ${photo.title}`}
              aria-haspopup="dialog"
              onClick={(event) => {
                opener.current = event.currentTarget;
                setSelected(photo.id);
              }}
            >
              <span className="gallery-thumbnail">
                <Photograph photo={photo} />
                <span className="gallery-expand">
                  <Expand size={18} aria-hidden="true" />
                </span>
              </span>
              <span className="gallery-card-copy">
                <span className="gallery-category">{photo.category}</span>
                <span className="gallery-card-title">{photo.title}</span>
                <span className="gallery-card-caption">{photo.caption}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="gallery-empty">
          <h2>No photographs to show</h2>
          <p>Try another category or return later for more photographs.</p>
          <button onClick={() => setCategory("All photographs")}>
            Show all photographs
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        className="gallery-lightbox"
        aria-labelledby="gallery-photo-title"
        aria-describedby="gallery-photo-caption"
        onCancel={(event) => {
          event.preventDefault();
          setSelected(null);
        }}
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          if (event.key === "Tab") {
            const controls = event.currentTarget.querySelectorAll<HTMLElement>(
              "button:not(:disabled), a[href]",
            );
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
        }}
      >
        {current && (
          <div className="gallery-lightbox-inner">
            <div className="gallery-lightbox-bar">
              <span aria-live="polite">
                {index + 1} / {visible.length} · {current.category}
              </span>
              <button
                autoFocus
                aria-label="Close photograph"
                onClick={() => setSelected(null)}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="gallery-large-image">
              <Photograph key={current.id} photo={current} large />
            </div>
            <div className="gallery-lightbox-details" aria-live="polite">
              <h2 id="gallery-photo-title">{current.title}</h2>
              <p id="gallery-photo-caption">{current.caption}</p>
              <p className="gallery-credit">
                {current.credit} ·{" "}
                <a href={current.sourceUrl} target="_blank" rel="noreferrer">
                  Photo source
                </a>{" "}
                ·{" "}
                <a href={current.licenseUrl} target="_blank" rel="noreferrer">
                  {current.license}
                </a>
              </p>
              <p className="gallery-credit">
                Displayed with responsive cropping and compression.
              </p>
            </div>
            <div className="gallery-lightbox-navigation">
              <button
                disabled={index <= 0}
                onClick={() => move(-1)}
                aria-label="Previous photograph"
              >
                <ArrowLeft aria-hidden="true" /> Previous
              </button>
              <span>Use the arrow keys to explore</span>
              <button
                disabled={index >= visible.length - 1}
                onClick={() => move(1)}
                aria-label="Next photograph"
              >
                Next <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
