"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { focusBooking } from "./booking-navigation";
const navigation = [
  { id: "destinations", label: "Destinations", href: "/#destinations" },
  { id: "travel-classes", label: "Travel classes", href: "/#travel-classes" },
  { id: "about", label: "About us", href: "/#about" },
  { id: "help", label: "Help", href: "/information/help" },
];
export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const menu = useRef<HTMLDialogElement>(null);
  const book = () => {
    menu.current?.close();
    setActive("");
    if (pathname === "/") requestAnimationFrame(() => focusBooking());
    else router.push("/#booking");
  };
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="rail-header">
        <div className="rail-header-inner">
          <Link
            className="rail-brand"
            href="/"
            aria-label="Pakistan Railways home"
            onClick={() => setActive("")}
          >
            <Image
              src="/logo.png"
              width={64}
              height={64}
              alt="Pakistan Railways"
              className="rail-logo"
              priority
            />
            <span aria-hidden="true">
              Pakistan Railways<small>THE JOURNEY CONNECTS US</small>
            </span>
          </Link>
          <nav className="desktop-navigation" aria-label="Main navigation">
            {navigation.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                className={
                  active === n.id || pathname === n.href ? "active" : ""
                }
                aria-current={pathname === n.href ? "page" : undefined}
                onClick={() => setActive(n.id)}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <button className="header-book" onClick={book}>
            Book a journey <ArrowRight size={16} />
          </button>
          <button
            className="menu-trigger"
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              menu.current?.showModal();
              setOpen(true);
            }}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>
      <dialog
        ref={menu}
        className="navigation-sheet"
        aria-labelledby="navigation-title"
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        <div className="sheet-top">
          <span id="navigation-title">Pakistan Railways</span>
          <button
            className="icon-button"
            aria-label="Close navigation menu"
            onClick={() => menu.current?.close()}
          >
            <X size={23} />
          </button>
        </div>
        <p className="sheet-caption">Where will your next journey take you?</p>
        <nav aria-label="Mobile navigation">
          {navigation.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              onClick={() => {
                setActive(n.id);
                menu.current?.close();
              }}
            >
              {n.label}
              <ArrowRight size={17} />
            </Link>
          ))}
        </nav>
        <button className="button primary full" onClick={book}>
          Book a journey <ArrowRight size={17} />
        </button>
        <small>Across cities. Closer to your people.</small>
      </dialog>
    </>
  );
}
