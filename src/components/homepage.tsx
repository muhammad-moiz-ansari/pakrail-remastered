import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Armchair,
  ShieldCheck,
  Users,
} from "lucide-react";
import { destinations, homeAssets, officialLinks } from "@/lib/home-content";
import BookingApp from "./booking-app";
import HomePhoto from "./home-photo";
import HomeExperience from "./home-experience";
import { FindDestination, PlanJourney } from "./booking-navigation";
export default function Homepage() {
  return (
    <main id="main-content" className="marketing-home">
      <section className="rail-hero" aria-labelledby="hero-title">
        <HomePhoto {...homeAssets.hero} eager sizes="100vw" />
        <div className="hero-gradient" />
        <div className="rail-container rail-hero-inner">
          <div className="rail-hero-copy">
            <span className="eyebrow">PAKISTAN RAILWAYS</span>
            <h1 id="hero-title">
              See Pakistan.
              <br />
              <em>Enjoy the journey.</em>
            </h1>
            <p>
              From familiar cities to new discoveries,
              <br className="desktop-break" /> your next journey starts here.
            </p>
            <PlanJourney className="button hero-plan" />
            <a className="hero-explore" href="#destinations">
              Explore destinations <ArrowRight size={16} />
            </a>
          </div>
          <span className="hero-photo-credit">
            A MOMENT FROM OUR RAILWAY HERITAGE
          </span>
        </div>
      </section>
      <section
        className="booking-overlap rail-container"
        id="booking"
        aria-label="Book train tickets"
      >
        <BookingApp step="search" />
      </section>
      <div className="booking-benefits rail-container">
        <span>
          <ShieldCheck size={18} /> Clear fares at every step
        </span>
        <span>
          <Users size={18} /> Bring your people along
        </span>
        <span>
          <Armchair size={18} /> Choose your place on board
        </span>
      </div>
      <section
        className="destination-section rail-container"
        id="destinations"
        aria-labelledby="destination-title"
      >
        <div className="marketing-heading">
          <span className="eyebrow">EXPLORE PAKISTAN</span>
          <h2 id="destination-title">
            Where will your next
            <br className="desktop-break" /> journey take you?
          </h2>
          <span className="gold-rule" />
          <p>Discover the places, people and stories along the way.</p>
        </div>
        <div className="destination-grid">
          {destinations.map((d) => (
            <article className="destination-card" key={d.stationId}>
              <div className="destination-photo">
                <HomePhoto src={d.image} alt={d.alt} position={d.position} />
                <span className="destination-index">
                  {String(destinations.indexOf(d) + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="destination-copy">
                <span className="eyebrow">{d.region}</span>
                <h3>{d.name}</h3>
                <p>{d.copy}</p>
                <FindDestination id={d.stationId} name={d.name} />
              </div>
            </article>
          ))}
        </div>
        <div className="destination-bottom">
          <span>One country. So many ways to see it.</span>
          <Link href="/information/stations">
            Explore our station directory <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <HomeExperience />
      <section
        className="about-section rail-container"
        id="about"
        aria-labelledby="about-title"
      >
        <div className="marketing-heading">
          <span className="eyebrow">BEHIND EVERY JOURNEY</span>
          <h2 id="about-title">About Pakistan Railways</h2>
          <span className="gold-rule" />
          <p>
            Meet the people behind the journey and explore
            <br className="desktop-break" /> opportunities to be part of it.
          </p>
        </div>
        <div className="about-links">
          {[
            {
              title: "Our people",
              href: "/information/people",
              asset: homeAssets.people,
              external: false,
            },
            {
              title: "Careers",
              href: officialLinks.careers,
              asset: homeAssets.careers,
              external: true,
            },
          ].map((v) => (
            <a
              className="about-link"
              key={v.title}
              href={v.href}
              {...(v.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className="about-portrait">
                <HomePhoto {...v.asset} sizes="220px" />
              </span>
              <span>
                {v.title}
                {v.external ? (
                  <>
                    <ArrowUpRight size={17} />
                    <span className="sr-only">
                      {" "}
                      (official website, opens a new tab)
                    </span>
                  </>
                ) : (
                  <ArrowRight size={17} />
                )}
              </span>
            </a>
          ))}
        </div>
        <p className="image-caption">
          Railway workplace photographs are illustrative.
        </p>
      </section>
    </main>
  );
}
