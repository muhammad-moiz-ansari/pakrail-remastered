import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { footerGroups } from "@/lib/home-content";
import { appStores, socialLinks } from "@/lib/footer-content";
import FooterBreadcrumb from "./footer-breadcrumb";
export default function SiteFooter() {
  return (
    <>
      <FooterBreadcrumb />
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
              An independent student project.
              <br />
              Not affiliated with Pakistan Railways.
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
          <div className="footer-connect">
            <section aria-labelledby="rabta-title">
              <h2 id="rabta-title">Travel with RABTA</h2>
              <p>Get the RABTA app for your next rail journey.</p>
              <div className="app-store-links">
                {appStores.map((store) => (
                  <a
                    key={store.className}
                    className={`store-link ${store.className}`}
                    href={store.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${store.label} (opens a new tab)`}
                  >
                    <Image
                      src={store.image}
                      width={store.width}
                      height={store.height}
                      alt=""
                      aria-hidden="true"
                      unoptimized
                    />
                  </a>
                ))}
              </div>
            </section>
            <section aria-labelledby="social-title">
              <h2 id="social-title">Connect with us</h2>
              <p>Follow Pakistan Railways.</p>
              <div className="social-links">
                {socialLinks.map((social) => (
                  <a
                    key={social.platform}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Pakistan Railways on ${social.platform} (opens a new tab)`}
                  >
                    <Image
                      src={social.icon}
                      alt=""
                      aria-hidden="true"
                      width={22}
                      height={22}
                      unoptimized
                    />
                  </a>
                ))}
              </div>
            </section>
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
    </>
  );
}
