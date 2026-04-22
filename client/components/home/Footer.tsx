"use client";

import Link from "next/link";
import Image from "next/image";

const COMPANY = [
  { label: "About Us", href: "/about" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "/support" },
  { label: "Help", href: "/support" },
];

const LEGAL = [
  { label: "Terms of Use", href: "/cookie-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Notice of Privacy Practices", href: "/privacy-policy" },
  { label: "Trust Center", href: "#" },
];

export function Footer() {
  return (
    <footer className="relative bg-ink-soft text-white overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.25] mix-blend-overlay"
        style={{ backgroundImage: "url('/footer-bg.svg')" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(80% 60% at 10% 40%, rgba(255,255,255,0.05), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-12 md:gap-20">
          <div className="flex items-start">
            <div className="relative h-36 w-36">
              <Image
                src="/logo.png"
                alt="medeaz"
                fill
                sizes="96px"
                className="object-contain drop-shadow-;[0_14px_40px_rgba(94,77,156,0.45)]"
              />
            </div>
          </div>

          <FooterColumn title="Company" items={COMPANY} />
          <FooterColumn title="Legal" items={LEGAL} />
        </div>

        <div className="mt-16 border-t border-white/10 pt-8">
          <p className="max-w-3xl mx-auto text-center text-[13px] text-white/60 leading-relaxed">
            Medeaz is an AI doctor, not a licensed clinician. AI-generated
            outputs are informational only and are not medical advice,
            diagnoses, or treatment. All outputs should be reviewed with a
            licensed health care professional.
          </p>
          <p className="mt-6 text-center text-[13px] text-white/45">
            © 2026 Medeaz Health. All rights reserved.
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
    <div className="min-w-[160px]">
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/60">
        {title}
      </p>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="text-[14px] text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
