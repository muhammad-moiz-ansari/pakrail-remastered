"use client";
import Image from "next/image";
import { useState } from "react";
export default function HomePhoto({
  src,
  alt,
  position = "center",
  eager = false,
  sizes = "(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw",
}: {
  src: string;
  alt: string;
  position?: string;
  eager?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      src={failed ? "/images/home/train-hero.jpg" : src}
      alt={
        failed
          ? "Railway landscape illustration in place of an unavailable photograph"
          : alt
      }
      fill
      sizes={sizes}
      priority={eager}
      loading={eager ? undefined : "lazy"}
      style={{ objectFit: "cover", objectPosition: position }}
      onError={() => setFailed(true)}
    />
  );
}
