"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useLanguage } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll, useTransform, type Variants } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLenis } from "@studio-freight/react-lenis";

// ─── useScrollY Custom Hook ───────────────────────────────────────────────────
function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return scrollY;
}

// ─── Navigation Items Configuration (Pricing removed) ─────────────────────────
const NAV_ITEMS = [
  { id: "home",          label: "Home",         labelUr: "ہوم",         sectionId: "hero"         },
  { id: "features",     label: "Features",     labelUr: "خصوصیات",     sectionId: "features"     },
  { id: "how-it-works", label: "How It Works", labelUr: "طریقہ کار",    sectionId: "how-it-works" },
  { id: "faq",          label: "FAQ",          labelUr: "سوالات",       sectionId: "faq"          },
] as const;

// ─── Drawer Motion Variants ───────────────────────────────────────────────────
const drawerVariants: Variants = {
  hidden: (locale: string) => ({
    x: locale === "ur" ? "-100%" : "100%",
  }),
  visible: {
    x: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 30 }
  },
  exit: (locale: string) => ({
    x: locale === "ur" ? "-100%" : "100%",
    transition: { ease: "easeInOut" as const, duration: 0.3 }
  })
};

export function Navbar() {
  const scrollY = useScrollY();
  const pathname = usePathname();
  const currentLocale = useLocale(); // next-intl locale hook
  const { language, toggleLanguage } = useLanguage(); // custom language provider hook
  const lenis = useLenis();

  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState("home");

  const isUrdu = language === "ur";
  const isScrolled = scrollY > 60;

  // useScroll and useTransform to drive backdrop-blur from 0 to 16px as scroll progress goes 0 to 0.05
  const { scrollYProgress } = useScroll();
  const backdropBlur = useTransform(scrollYProgress, [0, 0.05], ["blur(0px)", "blur(16px)"]);

  // IntersectionObserver: Active link highlight detection
  useEffect(() => {
    const obs: IntersectionObserver[] = [];
    NAV_ITEMS.forEach((item) => {
      if (item.sectionId === "hero") return;
      const el = document.getElementById(item.sectionId);
      if (!el) return;
      const o = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            setActiveId(item.id);
          }
        },
        { rootMargin: "-45% 0px -45% 0px" }
      );
      o.observe(el);
      obs.push(o);
    });
    return () => obs.forEach((o) => o.disconnect());
  }, []);

  // Universal click scroll handler
  const handleNavClick = useCallback((e: React.MouseEvent, item: typeof NAV_ITEMS[number], closeMobile = false) => {
    if (closeMobile) setIsOpen(false);

    if (pathname === "/") {
      e.preventDefault();
      setActiveId(item.id);
      
      const targetId = `#${item.sectionId}`;
      if (lenis) {
        lenis.scrollTo(targetId, { offset: -80 });
      } else {
        const el = document.getElementById(item.sectionId);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
    }
  }, [pathname, lenis]);

  return (
    <>
      <style>{`
        /* Plus Jakarta Sans logo override */
        .med-wordmark {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #0f1f2e;
        }

        /* Inter nav items styling & active underlines */
        .nav-link {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          position: relative;
          padding-bottom: 2px;
          transition: color 200ms ease;
        }
        .nav-link:hover {
          color: #00b495;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #00b495;
          transform: scaleX(0);
          transform-origin: bottom right;
          transition: transform 0.25s ease-out;
        }
        .nav-link:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
        .nav-link-active {
          color: #00b495 !important;
        }
        .nav-link-active::after {
          transform: scaleX(1) !important;
          transform-origin: bottom center !important;
        }

        /* Disable focus outline rings for premium presentation */
        .no-focus-ring:focus,
        .no-focus-ring:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>

      {/* ── Floating Navbar Wrapper ────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 mt-4 pointer-events-none flex justify-center">
        <motion.div
          dir={isUrdu ? "rtl" : "ltr"}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          style={{ backdropFilter: backdropBlur }}
          className={cn(
            "w-full max-w-[1100px] rounded-full border border-white/40 px-6 py-2.5 flex items-center justify-between pointer-events-auto transition-all duration-300 ease-in-out no-focus-ring",
            isScrolled
              ? "bg-white/92 shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
              : "bg-white/85 shadow-[0_6px_32px_rgba(0,0,0,0.04)] border-white/60"
          )}
        >
          {/* ── Left Cluster: Original Logo Image & Wordmark (No ping) ──────── */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, NAV_ITEMS[0])}
            className="flex items-center gap-2 shrink-0 no-focus-ring cursor-pointer"
          >
            <Image
              src="/medeaz.jpeg"
              alt="MedEaz Logo"
              width={28}
              height={28}
              priority
              className="h-7 w-7 object-contain rounded-lg"
            />
            <span className="med-wordmark">MedEaz</span>
          </Link>

          {/* ── Center Cluster: Navigation Links (Desktop Only) ─────────────── */}
          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeId === item.id;
              return (
                <Link
                  key={item.id}
                  href={`/#${item.sectionId}`}
                  onClick={(e) => handleNavClick(e, item)}
                  className={cn(
                    "nav-link no-focus-ring",
                    isActive && "nav-link-active"
                  )}
                >
                  <span className={cn(isUrdu && "font-urdu pt-0.5")}>
                    {isUrdu ? item.labelUr : item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* ── Right Cluster: Switcher, Login, CTA ──────────────────────────── */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Language Switcher EN | اردو */}
            <div className="hidden md:flex items-center border border-[#e5e7eb] rounded-full p-0.5 bg-white relative">
              <button
                onClick={() => { if (language !== 'en') toggleLanguage(); }}
                className={cn(
                  "px-3 py-1 text-[13px] font-medium rounded-full transition-all duration-200 no-focus-ring cursor-pointer",
                  language === 'en' ? "bg-[#00b495] text-white" : "text-[#374151] hover:text-[#00b495]"
                )}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                EN
              </button>
              <button
                onClick={() => { if (language !== 'ur') toggleLanguage(); }}
                className={cn(
                  "px-3 py-1 text-[13px] font-medium rounded-full transition-all duration-200 no-focus-ring cursor-pointer",
                  language === 'ur' ? "bg-[#00b495] text-white" : "text-[#374151] hover:text-[#00b495]"
                )}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                اردو
              </button>
            </div>

            {/* Login button (Ghost style) */}
            <Link
              href="/login"
              className="hidden md:inline-block text-[14px] font-medium text-[#374151] hover:text-[#00b495] transition-colors duration-200 no-focus-ring"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {isUrdu ? "لاگ اِن" : "Log in"}
            </Link>

            {/* Get Started button */}
            <Link href="/register" className="hidden md:inline-block no-focus-ring">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 4px 16px rgba(0,180,149,0.35)", backgroundColor: "#009e82" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 450, damping: 22 }}
                className="bg-[#00b495] text-white text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors duration-200 focus:outline-none no-focus-ring shadow-sm"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {isUrdu ? "شروع کریں" : "Get Started"}
              </motion.button>
            </Link>

            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-1.5 rounded-full hover:bg-black/[0.04] transition-colors text-[#374151] no-focus-ring cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Mobile Navigation Drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[60] bg-black"
            />

            {/* Slide-in Drawer Container */}
            <motion.div
              key="drawer"
              custom={language}
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              dir={isUrdu ? "rtl" : "ltr"}
              className="fixed top-0 bottom-0 z-[70] w-[85vw] max-w-[340px] bg-white shadow-2xl flex flex-col no-focus-ring"
              style={{
                right: isUrdu ? "auto" : 0,
                left: isUrdu ? 0 : "auto",
              }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.05]">
                <div className="flex items-center gap-2">
                  <Image
                    src="/medeaz.jpeg"
                    alt="MedEaz Logo"
                    width={28}
                    height={28}
                    priority
                    className="h-7 w-7 object-contain rounded-lg"
                  />
                  <span className="med-wordmark">MedEaz</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-black/[0.05] transition-colors cursor-pointer no-focus-ring"
                  aria-label="Close mobile menu"
                >
                  <X className="w-6 h-6 text-[#111827]" />
                </button>
              </div>

              {/* Vertical Links Stack (Reduced font size and height) ─────────── */}
              <nav className="flex-1 px-6 py-8 flex flex-col gap-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.id}
                    href={`/#${item.sectionId}`}
                    onClick={(e) => handleNavClick(e, item, true)}
                    className={cn(
                      "text-[16px] font-medium text-[#374151] hover:text-[#00b495] transition-colors leading-[36px] no-focus-ring",
                      isUrdu && "font-urdu text-[14px]"
                    )}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <span>
                      {isUrdu ? item.labelUr : item.label}
                    </span>
                  </Link>
                ))}
              </nav>

              {/* Drawer Bottom Action Block ─────────────────────────────────── */}
              <div className="px-6 pb-12 pt-6 border-t border-black/[0.05] space-y-4">
                
                {/* Language Switcher inside Drawer */}
                <div className="flex items-center border border-[#e5e7eb] rounded-full p-0.5 bg-white relative w-full">
                  <button
                    onClick={() => { if (language !== 'en') toggleLanguage(); }}
                    className={cn(
                      "flex-1 text-center py-2 text-[13px] font-medium rounded-full transition-all duration-200 no-focus-ring cursor-pointer",
                      language === 'en' ? "bg-[#00b495] text-white" : "text-[#374151]"
                    )}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { if (language !== 'ur') toggleLanguage(); }}
                    className={cn(
                      "flex-1 text-center py-2 text-[13px] font-medium rounded-full transition-all duration-200 no-focus-ring cursor-pointer",
                      language === 'ur' ? "bg-[#00b495] text-white" : "text-[#374151]"
                    )}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    اردو
                  </button>
                </div>

                {/* Login button (With premium filled background) */}
                <Link href="/login" onClick={() => setIsOpen(false)} className="block no-focus-ring">
                  <button
                    className="w-full py-3.5 bg-black/[0.04] hover:bg-black/[0.07] text-[#374151] font-medium text-[16px] rounded-full transition-colors text-center no-focus-ring cursor-pointer"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {isUrdu ? "لاگ اِن" : "Log in"}
                  </button>
                </Link>

                {/* Get Started CTA */}
                <Link href="/register" onClick={() => setIsOpen(false)} className="block no-focus-ring">
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "#009e82" }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 bg-[#00b495] text-white font-semibold text-[16px] rounded-full transition-all duration-200 text-center no-focus-ring shadow-sm cursor-pointer"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {isUrdu ? "شروع کریں" : "Get Started"}
                  </motion.button>
                </Link>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

