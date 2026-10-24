"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { breadcrumbsForPath } from "@/lib/site-routes";
export default function FooterBreadcrumb() {
  const items = breadcrumbsForPath(usePathname());
  if (!items.length) return null;
  return (
    <nav className="footer-breadcrumb" aria-label="Breadcrumb">
      <ol className="rail-container">
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`}>
            {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
