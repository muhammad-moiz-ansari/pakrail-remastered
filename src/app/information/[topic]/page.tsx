import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { stations } from "@/lib/booking";
import PeoplePage from "@/components/people-page";
import { informationPages, isInformationTopic } from "@/lib/site-routes";
export function generateStaticParams() {
  return Object.keys(informationPages).map((topic) => ({ topic }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  return {
    title: `${isInformationTopic(topic) ? informationPages[topic].title : "Information"} | Pakistan Railways`,
  };
}
export default async function Information({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  if (!isInformationTopic(topic)) notFound();
  if (topic === "people") return <PeoplePage />;
  return (
    <main id="main-content" className="information-page">
      <span className="eyebrow">PAKISTAN RAILWAYS</span>
      <h1>{informationPages[topic].title}</h1>
      {topic === "about" && (
        <>
          <p>
            From familiar cities to new discoveries, rail travel makes room for
            the journey as well as the destination.
          </p>
          <section className="information-block">
            <h2>Your journey, in one place</h2>
            <p>
              Find a train, compare the class options, add your group and choose
              seats before reviewing the complete journey. Return trips keep
              both legs together.
            </p>
            <Link href="/#booking">
              Plan a journey <ArrowRight size={16} />
            </Link>
          </section>
          <section className="information-block">
            <h2>Places and people</h2>
            <p>
              Explore the destination collection for ideas, or learn about the
              people whose work makes a rail journey possible.
            </p>
            <Link href="/information/people">
              Our people <ArrowRight size={16} />
            </Link>
          </section>
        </>
      )}
      {topic === "journey" && (
        <>
          <p>
            Take a window seat. Make time for the changing landscape and the
            places along the way.
          </p>
          <section className="information-block">
            <h2>Choose the journey that fits your day</h2>
            <p>
              Start with your stations and travel dates. Compare departure
              times, duration and fares, then choose your class and seats. For
              overnight journeys, check the next-day arrival indicator before
              choosing your return train.
            </p>
          </section>
          <section className="information-block">
            <h2>Travel together</h2>
            <p>
              Add your group at the beginning of your search. Suggested seats
              arrive selected and can be changed: select a traveller, choose a
              free seat and confirm. Each leg of a return trip has its own seat
              assignments.
            </p>
            <Link href="/#booking">
              Find your train <ArrowRight size={16} />
            </Link>
          </section>
        </>
      )}
      {topic === "help" && (
        <>
          <p>
            Useful guidance for searching, choosing seats and keeping your
            journey details together.
          </p>
          <section className="information-block" id="search">
            <h2>Search for a train</h2>
            <p>
              Choose different departure and arrival stations. Select a
              departure date, then a return date or One Way. Confirm the
              passenger count and select Search trains. Departure-time filters
              and sorting appear with the results.
            </p>
            <p>
              The current journey planner uses sample schedules, fares, class
              descriptions and seat availability. It is not a live railway
              inventory.
            </p>
          </section>
          <section className="information-block" id="seats">
            <h2>Choose and change seats</h2>
            <p>
              Your suggested seats are already selected. Choose the traveller
              whose seat you want to change, then a Free seat. Confirm seat
              completes the change; Cancel retains the original selection. Sold
              seats cannot be selected. The text selection view offers the same
              choices without the spatial map.
            </p>
            <p>
              For a return trip, switch between Outbound and Return and check
              that everyone has a seat on both legs.
            </p>
          </section>
          <section className="information-block" id="payment">
            <h2>Review and payment</h2>
            <p>
              Review your train, class, travellers, seats and total before
              continuing. Use an Edit action to make a change. The payment step
              is a test: no charge will be made and no card or bank credentials
              are collected. Its confirmation is a summary, not a ticket valid
              for travel.
            </p>
            <p>
              No confirmation email is sent. Print ticket opens the browser’s
              print dialog with only a clearly labelled test ticket so you can
              keep a copy. Start new booking asks before clearing the current
              booking.
            </p>
          </section>
          <section className="information-block">
            <h2>Your saved details</h2>
            <p>
              Your draft is saved in this browser tab. Use the same tab and
              website address when returning to it. Names and contact
              information do not appear in the page address.
            </p>
            <Link href="/#booking">
              Back to journey planning <ArrowRight size={16} />
            </Link>
          </section>
        </>
      )}
      {topic === "stations" && (
        <>
          <p>
            Explore the stations supported by this journey planner. Select a
            destination to return to the booking form; choose your departure
            station and travel dates there.
          </p>
          <div className="station-directory">
            {stations.map((s) => (
              <article key={s.id}>
                <span className="eyebrow">{s.code}</span>
                <h2>{s.city}</h2>
                <p>{s.name}</p>
                <a
                  className="destination-action"
                  href={`/?destination=${s.id}#booking`}
                >
                  Find trains <ArrowRight size={16} />
                </a>
              </article>
            ))}
          </div>
          <p>
            Islamabad uses Islamabad Margalla (ISB). Rawalpindi is a separate
            station. Services displayed by this planner are sample schedules.
          </p>
        </>
      )}
      {topic === "sitemap" && (
        <>
          <p>Journey planning, travel inspiration and passenger information.</p>
          <section className="information-block">
            <h2>Plan and explore</h2>
            <ul>
              <li>
                <Link href="/#booking">Book train tickets</Link>
              </li>
              <li>
                <Link href="/#destinations">Destinations</Link>
              </li>
              <li>
                <Link href="/#travel-classes">Travel classes</Link>
              </li>
              <li>
                <Link href="/information/stations">Station directory</Link>
              </li>
              <li>
                <Link href="/information/journey">The rail journey</Link>
              </li>
            </ul>
          </section>
          <section className="information-block">
            <h2>About and support</h2>
            <ul>
              <li>
                <Link href="/information/about">About Pakistan Railways</Link>
              </li>
              <li>
                <Link href="/information/people">Our people</Link>
              </li>
              <li>
                <Link href="/information/help">Passenger help</Link>
              </li>
              <li>
                <Link href="/information/credits">Image credits</Link>
              </li>
              <li>
                <Link href="/careers">
                  Careers <ArrowRight size={13} />
                </Link>
              </li>
            </ul>
          </section>
        </>
      )}
      {topic === "credits" && (
        <>
          <p>
            Temporary editorial photography, credited to its creators.
            Photographs are displayed with responsive CSS cropping; the original
            downloaded files are otherwise unchanged.
          </p>
          <section className="information-block">
            <h2>Pakistan and its railway heritage</h2>
            <ul className="credits-list">
              <li>
                <a href="https://commons.wikimedia.org/wiki/File:KhyberRailway_01.jpg">
                  Khyber Railway, December 1993
                </a>{" "}
                — MaltaGC,{" "}
                <a href="https://creativecommons.org/licenses/by-sa/3.0/">
                  CC BY-SA 3.0
                </a>
                . Used for the hero and rail-experience tile.
              </li>
              <li>
                <a href="https://commons.wikimedia.org/wiki/File:Badshahi_Mosque_front_picture.jpg">
                  Badshahi Mosque
                </a>{" "}
                — Romero Maia,{" "}
                <a href="https://creativecommons.org/licenses/by-sa/4.0/">
                  CC BY-SA 4.0
                </a>
                .
              </li>
              <li>
                <a href="https://commons.wikimedia.org/wiki/File:MazareQuad.jpeg">
                  Mazar-e-Quaid
                </a>{" "}
                — Steve Evans,{" "}
                <a href="https://creativecommons.org/licenses/by/2.0/">
                  CC BY 2.0
                </a>
                .
              </li>
              <li>
                <a href="https://commons.wikimedia.org/wiki/File:Rawalpindi_Railway_Station_-_01.jpg">
                  Rawalpindi Railway Station
                </a>{" "}
                — Rana Usman Shakoor,{" "}
                <a href="https://creativecommons.org/licenses/by-sa/4.0/">
                  CC BY-SA 4.0
                </a>
                .
              </li>
              <li>
                <a href="https://commons.wikimedia.org/wiki/File:Tomb_of_Shah_Rukn-e-Alam_2_Multan.jpg">
                  Shah Rukn-e-Alam, Multan
                </a>{" "}
                — Junaidahmadj / D Junad Photography,{" "}
                <a href="https://creativecommons.org/licenses/by-sa/3.0/">
                  CC BY-SA 3.0
                </a>
                .
              </li>
              <li>
                <a href="https://commons.wikimedia.org/wiki/File:Clock_Tower,_Faisalabad.jpeg">
                  Faisalabad Clock Tower
                </a>{" "}
                — Muhammad Tahir,{" "}
                <a href="https://creativecommons.org/licenses/sa/1.0/">
                  CC SA 1.0
                </a>
                .
              </li>
              <li>
                <a href="https://www.pexels.com/photo/busy-day-at-masjid-in-islamabad-pakistan-36918154/">
                  Mosque in Islamabad
                </a>{" "}
                — Abdul Basit Nasim, Pexels.
              </li>
            </ul>
          </section>
          <section className="information-block">
            <h2>Illustrative rail interiors and workplace</h2>
            <p>
              These photographs are not verified Pakistan Railways facilities or
              staff portraits.
            </p>
            <ul className="credits-list">
              <li>
                <a href="https://www.pexels.com/photo/interior-of-train-13742961/">
                  Train interior
                </a>{" "}
                — Ali Ramazan Çiftçi.
              </li>
              <li>
                <a href="https://www.pexels.com/photo/empty-seats-by-the-window-in-a-train-23964495/">
                  Seats beside a train window
                </a>{" "}
                — Noland Live.
              </li>
              <li>
                <a href="https://www.pexels.com/photo/red-and-brown-train-seats-4050386/">
                  Vintage rail interior
                </a>{" "}
                — Colin Lloyd.
              </li>
              <li>
                <a href="https://www.pexels.com/photo/a-male-technician-walking-in-the-train-station-13300273/">
                  Railway technician, Surabaya, Indonesia
                </a>{" "}
                — Putra Kusuma.
              </li>
            </ul>
            <p>
              These images are used under the{" "}
              <a href="https://www.pexels.com/license/">Pexels license</a>.
            </p>
          </section>
          <section className="information-block">
            <h2>Typography and identity</h2>
            <p>
              Bodoni Moda and Manrope are served locally under their SIL Open
              Font Licenses. The Pakistan Railways logo is the supplied asset,
              retained without alteration.
            </p>
          </section>
          <section className="information-block">
            <h2>Our people photography</h2>
            <p>
              The Our people cover reuses the credited Rawalpindi Railway
              Station photograph by Rana Usman Shakoor (CC BY-SA 4.0). It is a
              temporary station cover.
            </p>
            <p>
              <a href="https://commons.wikimedia.org/wiki/File:Mohib_Ali_Assistant_Train_Driver_Pakistan_Railways.jpg">
                Pakistan Railways assistant driver, 22 March 2023
              </a>{" "}
              — Syed.mazahirhaider,{" "}
              <a href="https://creativecommons.org/licenses/by-sa/4.0/">
                CC BY-SA 4.0
              </a>
              . The downloaded photograph is unchanged; responsive CSS cropping
              is applied. It is used as temporary editorial staff photography
              without implying endorsement.
            </p>
            <p>
              The three leadership portraits were supplied for this project and
              mapped by their role filenames. Their original files are retained
              without alteration.
            </p>
          </section>
          <section className="information-block">
            <h2>App badges and social icons</h2>
            <p>
              Store badges are original artwork from{" "}
              <a href="https://developer.apple.com/app-store/marketing/guidelines/">
                Apple
              </a>{" "}
              and{" "}
              <a href="https://partnermarketinghub.withgoogle.com/brands/google-play/">
                Google Play
              </a>
              . Apple and the Apple logo are trademarks of Apple Inc.,
              registered in the U.S. and other countries. App Store is a service
              mark of Apple Inc. Google Play and the Google Play logo are
              trademarks of Google LLC.
            </p>
            <p>
              Facebook, X and Instagram SVGs are from{" "}
              <a href="https://simpleicons.org/">Simple Icons (CC0)</a>. The
              LinkedIn SVG is from{" "}
              <a href="https://icons.getbootstrap.com/icons/linkedin/">
                Bootstrap Icons (MIT)
              </a>
              . Original license notices are bundled with these assets.
            </p>
          </section>
        </>
      )}
      <Link className="button secondary" href="/">
        Return to homepage <ArrowRight size={16} />
      </Link>
    </main>
  );
}
