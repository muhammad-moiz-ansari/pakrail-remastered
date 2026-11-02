import AboutCover from "./about-cover";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import {
  biography,
  leadership,
  peopleAssets,
  staffThemes,
} from "@/lib/people-content";

export default function PeoplePage() {
  return (
    <main id="main-content" className="people-page">
      <AboutCover
        title="Our people"
        description="The people behind every journey."
        id="people-title"
      />
      <section
        className="people-introduction rail-container"
        aria-labelledby="people-introduction-title"
      >
        <span className="eyebrow">TOGETHER, WE MAKE THE JOURNEY</span>
        <h2 id="people-introduction-title">
          Every journey begins with people.
        </h2>
        <span className="gold-rule" />
        <p>
          Every railway journey depends on people working together. Meet the
          teams who support passengers, care for our trains and help keep
          journeys moving across Pakistan.
        </p>
      </section>
      <section
        className="people-staff rail-container"
        aria-labelledby="staff-title"
      >
        <figure className="staff-photo">
          <div className="staff-photo-window">
            <Image
              src={peopleAssets.crew.src}
              alt={peopleAssets.crew.alt}
              fill
              sizes="(max-width: 800px) 100vw, 55vw"
              style={{
                objectFit: "cover",
                objectPosition: peopleAssets.crew.position,
              }}
            />
          </div>
          <figcaption>
            Pakistan Railways assistant driver, 2023.{" "}
            <a href={peopleAssets.crew.source}>
              Photo: {peopleAssets.crew.credit}
            </a>
          </figcaption>
        </figure>
        <div className="staff-story">
          <span className="eyebrow">THE PEOPLE BEHIND THE JOURNEY</span>
          <h2 id="staff-title">
            Our train crew <br />
            and staff
          </h2>
          <span className="gold-rule" />
          <p>
            From train crews and station teams to maintenance and customer
            support, railway staff contribute to the everyday experience of
            travelling by rail.
          </p>
          <dl className="staff-themes">
            {staffThemes.map((theme) => (
              <div key={theme.title}>
                <dt>{theme.title}</dt>
                <dd>{theme.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <section className="people-leadership" aria-labelledby="leadership-title">
        <div className="rail-container">
          <div className="marketing-heading">
            <span className="eyebrow">GUIDING THE JOURNEY</span>
            <h2 id="leadership-title">Our leadership</h2>
            <span className="gold-rule" />
            <p>Meet the leadership of Pakistan Railways.</p>
          </div>
          <div className="leadership-grid">
            {leadership.map((person) => (
              <article className="leadership-card" key={person.name}>
                <div className="leader-portrait">
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                    style={{
                      objectFit: "contain",
                      objectPosition: person.position,
                    }}
                  />
                </div>
                <div className="leader-details">
                  <h3>{person.name}</h3>
                  <p className="leader-role">{person.role}</p>
                  <p className="leader-organization">{person.organization}</p>
                  {person.biography && (
                    <a className="biography-link" href={`#${person.biography}`}>
                      Read biography <ArrowDown size={16} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        className="people-biography"
        id={biography.id}
        aria-labelledby="biography-title"
      >
        <div className="rail-container biography-layout">
          <div className="biography-heading">
            <span className="eyebrow">LEADERSHIP PROFILE</span>
            <h2 id="biography-title">{biography.name}</h2>
            <p>{biography.role}</p>
            <span className="gold-rule" />
          </div>
          <div className="biography-copy">
            {biography.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
