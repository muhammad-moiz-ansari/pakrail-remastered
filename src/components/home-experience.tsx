"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { classes } from "@/lib/booking";
import { classInformation } from "@/lib/class-content";
import { homeAssets } from "@/lib/home-content";
import HomePhoto from "./home-photo";
import { focusBooking } from "./booking-navigation";
import { ReferenceLayoutBrowser } from "./coach-booking";
const photographs = {
  economy: homeAssets.economy,
  standard: homeAssets.standard,
  business: homeAssets.business,
  sleeper: homeAssets.business,
  parlour: homeAssets.standard,
};
export default function HomeExperience() {
  const [selected, setSelected] = useState(classes[0]);
  const detail = useRef<HTMLDialogElement>(null);
  const information =
    classInformation[selected.id as keyof typeof classInformation];
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
                <span className="class-card-preview">
                  {
                    classInformation[c.id as keyof typeof classInformation]
                      .preview
                  }
                </span>
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
        <ReferenceLayoutBrowser />
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
        <p>{information.introduction}</p>
        <h3>Accommodation</h3>
        <p>{information.accommodation}</p>
        <ul>
          {information.features.map((feature) => (
            <li key={feature}>
              <Check size={17} aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <h3>Who it suits</h3>
        <p>{information.suitedTo}</p>
        <p className="class-integrity">
          Coach variants follow the supplied railway references. Service
          configurations, fares and availability in this booking flow remain
          sample data. Facilities vary by service.
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
