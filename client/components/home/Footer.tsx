"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";

const PRODUCT_LINKS = [
  { label: "About", labelUr: "ہمارے بارے میں", href: "/about" },
  { label: "Docs", labelUr: "دستاویزات", href: "/docs" },
  { label: "Support", labelUr: "مدد", href: "/support" },
  { label: "FAQ", labelUr: "سوالات", href: "/faqs" },
  { label: "Cookies", labelUr: "کوکیز پالیسی", href: "/cookie-policy" },
  { label: "Policy", labelUr: "پرائیویسی", href: "/privacy-policy" },
];

export function Footer() {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  return (
    <footer className="relative bg-white border-t border-black/[0.06] overflow-hidden">
      {/* Subtle diagonal pattern matching dashboard background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <pattern id="footer-diag" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="60" stroke="#0F4C5C" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#footer-diag)" opacity="0.04" />
      </svg>

      <div className="relative mx-auto max-w-[1100px] px-6 lg:px-8 pt-12 pb-8">
        <div className={`flex flex-col md:flex-row md:items-start md:justify-between gap-10 ${isUrdu ? "md:flex-row-reverse" : ""}`}>
          {/* Brand */}
          <div className={`flex items-center gap-4 ${isUrdu ? "flex-row-reverse" : ""}`}>
            <div className="relative h-14 w-14 shrink-0">
              <Image
                src="/medeaz.jpeg"
                alt="medeaz"
                fill
                sizes="56px"
                className="object-contain rounded-lg"
              />
            </div>
            <div className={isUrdu ? "text-right" : ""}>
              <p className="text-base font-bold text-gray-900">Medeaz</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isUrdu
                  ? "آواز سے چلنے والا ڈیجیٹل صحت پلیٹ فارم"
                  : "Voice-enabled digital healthcare platform"}
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className={`min-w-[220px] ${isUrdu ? "text-right" : ""}`}>
            <p className={`text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-400`}>
              {isUrdu ? "فوری روابط" : "Quick Links"}
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
              {PRODUCT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-700 hover:text-primary transition-colors font-medium"
                  >
                    {isUrdu ? item.labelUr : item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`mt-10 border-t border-black/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 ${isUrdu ? "sm:flex-row-reverse" : ""}`}>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Medeaz.{" "}
            {isUrdu ? "تمام حقوق محفوظ ہیں۔" : "All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
}
