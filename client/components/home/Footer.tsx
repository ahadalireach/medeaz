"use client";

import Link from "next/link";
import Image from "next/image";

const PRODUCT_LINKS = [
  { label: "About", href: "/about" },
  { label: "Docs", href: "/docs" },
  { label: "Support", href: "/support" },
  { label: "FAQ", href: "/faqs" },
  { label: "Cookies", href: "/cookie-policy" },
  { label: "Policy", href: "/privacy-policy" },
];

export function Footer() {
  return (
    <footer className="relative bg-ink-soft text-white overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{ backgroundImage: "url('/footer-bg.svg')" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundSize: "220px 220px",
        }}
      />

      <div className="relative mx-auto max-w-[1100px] px-6 lg:px-8 pt-16 pb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16">
              <Image
                src="/logo.png"
                alt="medeaz"
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/95">Medeaz</p>
              <p className="text-xs text-white/60">
                Voice-enabled digital healthcare platform
              </p>
            </div>
          </div>

          <FooterColumn title="Quick Links" items={PRODUCT_LINKS} />
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} Medeaz. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div className="min-w-[220px]">
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/60">
        {title}
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="text-sm text-white/90 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
