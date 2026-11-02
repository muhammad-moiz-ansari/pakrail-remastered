import Image from "next/image";
import { peopleAssets } from "@/lib/people-content";

export default function AboutCover({
  title,
  description,
  id,
}: {
  title: string;
  description: string;
  id: string;
}) {
  return (
    <section className="people-cover" aria-labelledby={id}>
      <Image
        src={peopleAssets.cover.src}
        alt={peopleAssets.cover.alt}
        fill
        sizes="100vw"
        priority
        style={{
          objectFit: "cover",
          objectPosition: peopleAssets.cover.position,
        }}
      />
      <div className="people-cover-shade" />
      <div className="rail-container people-cover-copy">
        <span className="eyebrow">ABOUT PAKISTAN RAILWAYS</span>
        <h1 id={id}>{title}</h1>
        <p>{description}</p>
      </div>
      <span className="people-cover-caption">RAWALPINDI RAILWAY STATION</span>
    </section>
  );
}
