"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { classes } from "@/lib/booking";
import { homeAssets } from "@/lib/home-content";
import HomePhoto from "./home-photo";
import { focusBooking } from "./booking-navigation";
const photographs = {
  economy: homeAssets.economy,
  standard: homeAssets.standard,
  business: homeAssets.business,
};
export default function HomeExperience() {
  const [selected, setSelected] = useState(classes[0]);
  const detail = useRef<HTMLDialogElement>(null);
  return (
    <section
      className="experience-section"
      id="travel-classes"
      aria-labelledby="experience-title"
    >
      <div className="rail-container">
        <div className="marketing-heading">
          <span className="eyebrow">TRAVELLING WITH PAKISTAN RAILWAYS</span>
          <h2 id="experience-title">Find your kind of comfort.</h2>
          <span className="gold-rule" />
          <p>
            Explore travel classes and choose the experience that suits your
            journey.
          </p>
        </div>
        <div className="experience-mosaic">
          <Link
            className="experience-tile journey-tile"
            href="/information/journey"
          >
            <HomePhoto {...homeAssets.experience} />
            <span className="tile-shade" />
            <span className="tile-copy">
              <span className="eyebrow">THE RAIL JOURNEY</span>
              <h3>
                A different view
                <br />
                of Pakistan.
              </h3>
              <p>
                Take a window seat.
                <br />
                Let the country come to you.
              </p>
              <span className="tile-action">
                Explore the journey <ArrowRight size={17} />
              </span>
            </span>
            <span className="photo-note">
              Railway heritage · Khyber Pass, 1993
            </span>
          </Link>
          {classes.map((c) => (
            <button
              className={`experience-tile class-tile tile-${c.id}`}
              key={c.id}
              onClick={() => {
                setSelected(c);
                detail.current?.showModal();
              }}
              aria-haspopup="dialog"
            >
              <HomePhoto {...photographs[c.id as keyof typeof photographs]} />
              <span className="tile-shade" />
              <span className="tile-copy">
                <span className="eyebrow">TRAVEL CLASSES</span>
                <h3>{c.name}</h3>
                <span className="tile-action">
                  Explore class <ArrowRight size={17} />
                </span>
              </span>
            </button>
          ))}
        </div>
        <p className="image-caption">
          Interior photography is illustrative and does not represent confirmed
          Pakistan Railways facilities.
        </p>
      </div>
      <dialog
        className="class-detail-dialog"
        ref={detail}
        aria-labelledby="class-detail-title"
      >
        <div className="panel-heading">
          <span className="eyebrow">FIND YOUR KIND OF COMFORT</span>
          <button
            className="icon-button"
            aria-label="Close class details"
            onClick={() => detail.current?.close()}
          >
            <X size={22} />
          </button>
        </div>
        <h2 id="class-detail-title">{selected.name}</h2>
        <p>{selected.description}</p>
        <ul>
          <li>
            <Check size={17} /> Compare the class fare for your chosen train.
          </li>
          <li>
            <Check size={17} /> Choose seats for each traveller before
            continuing.
          </li>
          <li>
            <Check size={17} /> Review the full group total before payment.
          </li>
        </ul>
        <p className="class-integrity">
          Class descriptions and availability in this booking flow use sample
          data. Facilities can vary by service; confirm them before travel.
        </p>
        <button
          className="button primary full"
          onClick={() => {
            detail.current?.close();
            requestAnimationFrame(() => focusBooking());
          }}
        >
          Find trains in this class <ArrowRight size={17} />
        </button>
        <small>Choose your train first, then select your class.</small>
      </dialog>
    </section>
  );
}
