import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { footerGroups } from "@/lib/home-content";
export default function SiteFooter() {
  return (
    <footer className="rail-footer">
      <div className="rail-container">
        <div className="footer-intro">
          <Link href="/" className="footer-mark">
            <Image
              src="/logo.png"
              alt="Pakistan Railways"
              width={56}
              height={56}
            />
            <span aria-hidden="true">Pakistan Railways</span>
          </Link>
          <p>
            Across cities. Through landscapes.
            <br />
            Connecting you to the places that matter.
          </p>
        </div>
        <div className="footer-groups">
          {footerGroups.map((g) => (
            <section key={g.title}>
              <h2>{g.title}</h2>
              <ul>
                {g.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      {...("external" in l
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {l.label}
                      {"external" in l && (
                        <>
                          <ArrowUpRight size={13} />
                          <span className="sr-only">
                            {" "}
                            (external website, opens a new tab)
                          </span>
                        </>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="footer-utility">
          <p>© {new Date().getFullYear()} Pakistan Railways.</p>
          <span>
            <Link href="/information/help">Passenger help</Link>
            <Link href="/information/sitemap">Sitemap</Link>
            <Link href="/information/credits">Image credits</Link>
          </span>
          <span className="footer-signoff">
            THE JOURNEY IS PART OF THE STORY
          </span>
        </div>
      </div>
    </footer>
  );
}
