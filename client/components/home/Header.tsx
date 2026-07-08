"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { useLenis } from "@studio-freight/react-lenis";

// ─── Nav Items (Only sections that actually exist on the home page) ─────────────
const NAV_ITEMS = [
  { id: "home",          label: "Home",         labelUr: "ہوم",         sectionId: "hero"         },
  { id: "features",     label: "Features",     labelUr: "خصوصیات",     sectionId: "features"     },
  { id: "solutions",    label: "Solutions",    labelUr: "حل",           sectionId: "solutions"    },
  { id: "how-it-works", label: "How It Works", labelUr: "طریقہ کار",    sectionId: "how-it-works" },
  { id: "pricing",      label: "Pricing",      labelUr: "قیمتیں",       sectionId: "faq"          },
  { id: "contact",      label: "Contact",      labelUr: "رابطہ",        sectionId: "contact"      },
] as const;

export function Header() {
  const { language, toggleLanguage } = useLanguage();
  const isUrdu = language === "ur";
  const pathname = usePathname();
  const lenis = useLenis();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState("home");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Monitor scroll for styling navbar
  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // IntersectionObserver: Highlight section as user scrolls
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

  // Universal Navigation & Scroll Trigger
  const handleNavClick = useCallback((e: React.MouseEvent, item: typeof NAV_ITEMS[number], closeMobile = false) => {
    if (closeMobile) setMobileOpen(false);

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
        /* Self-contained premium animations and overrides */
        @keyframes gradient-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-border {
          background-size: 200% auto;
          animation: gradient-border 3s linear infinite;
        }
        /* Remove default browser focus rings on nav elements */
        .no-focus-ring:focus, 
        .no-focus-ring:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>

      {/* ── Floating Navbar Container ─────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-5">
        <div className="max-w-[1280px] mx-auto">
          <header
            className={cn(
              "w-full rounded-full flex items-center justify-between px-6 relative transition-all duration-300",
              scrolled
                ? "h-14 bg-white/90 backdrop-blur-2xl border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
                : "h-[68px] bg-white/75 backdrop-blur-xl border border-black/[0.05] shadow-[0_2px_16px_rgba(0,0,0,0.03)]"
            )}
          >
            {/* ── Logo (Left) ──────────────────────────────────────────────── */}
            <Link
              href="/"
              onClick={(e) => handleNavClick(e, NAV_ITEMS[0])}
              className="flex items-center gap-2.5 group shrink-0 no-focus-ring"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 4 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Image
                  src="/medeaz.jpeg"
                  alt="MedEaz Logo"
                  width={32}
                  height={32}
                  priority
                  className="h-8 w-8 object-contain rounded-lg shadow-sm"
                />
              </motion.div>
              <span className="font-sans text-[17px] font-bold text-[#111827] group-hover:text-[#00b495] transition-colors duration-200">
                MedEaz
              </span>
            </Link>

            {/* ── Center Navigation (Desktop - Absolutely Centered) ─────────── */}
            <nav className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <LayoutGroup id="desktop-navbar">
                <ul className="flex items-center gap-0.5 bg-[#F3F4F6] rounded-full p-1 border border-black/[0.02]">
                  {NAV_ITEMS.map((item) => {
                    const isActive = activeId === item.id;
                    const isHovered = hoveredId === item.id;
                    return (
                      <li key={item.id} className="relative">
                        <Link
                          href={`/#${item.sectionId}`}
                          onClick={(e) => handleNavClick(e, item)}
                          onMouseEnter={() => setHoveredId(item.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className={cn(
                            "relative flex items-center px-4 py-2 rounded-full transition-colors duration-200 select-none whitespace-nowrap z-10 no-focus-ring",
                            isActive ? "text-[#00b495]" : "text-[#4B5563] hover:text-[#111827]"
                          )}
                        >
                          {/* Active sliding pill background (No border, only shadow) */}
                          {isActive && (
                            <motion.span
                              layoutId="active-nav-pill"
                              className="absolute inset-0 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)] -z-10"
                              transition={{ type: "spring", stiffness: 380, damping: 34 }}
                            />
                          )}

                          {/* Hover pill background */}
                          {isHovered && !isActive && (
                            <motion.span
                              className="absolute inset-0 bg-white/60 rounded-full -z-10"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            />
                          )}

                          {/* Text with dynamic size & line-height correction for Urdu */}
                          <span className={cn(
                            "transition-all duration-150",
                            isUrdu ? "text-[11px] font-bold font-urdu pt-0.5" : "text-[13px] font-semibold"
                          )}>
                            {isUrdu ? item.labelUr : item.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </LayoutGroup>
            </nav>

            {/* ── Right Actions (Right) ────────────────────────────────────── */}
            <div className="flex items-center gap-3 shrink-0">
              
              {/* Language Selector (EN / Urdu) */}
              <button
                onClick={toggleLanguage}
                className="relative hidden md:flex items-center rounded-full cursor-pointer h-8 w-[74px] select-none overflow-hidden bg-[#E5E7EB] border border-black/[0.04] shrink-0 no-focus-ring"
                aria-label="Toggle language"
              >
                <motion.span
                  layout
                  className="absolute top-0.5 bottom-0.5 w-8 bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                  style={{ left: isUrdu ? "calc(100% - 34px)" : "2px" }}
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
                <span className={cn(
                  "flex-1 text-center text-[10px] font-bold z-10 transition-colors duration-150",
                  !isUrdu ? "text-[#00b495]" : "text-[#9CA3AF]"
                )}>
                  EN
                </span>
                <span className={cn(
                  "flex-1 text-center text-[10px] font-bold z-10 transition-colors duration-150",
                  isUrdu ? "text-[#00b495]" : "text-[#9CA3AF]"
                )}>
                  اردو
                </span>
              </button>

              {/* Login Button (Filled Teal) */}
              <Link href="/login" className="hidden sm:block no-focus-ring">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 4px 18px rgba(0,180,149,0.3)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  style={{ backgroundColor: "#00b495", color: "#ffffff" }}
                  className={cn(
                    "h-[38px] px-5 rounded-full flex items-center justify-center font-bold transition-colors duration-150 shadow-sm shadow-[#00b495]/20 hover:bg-[#00a386] no-focus-ring",
                    isUrdu ? "text-[12px] font-urdu pt-0.5" : "text-[13px]"
                  )}
                >
                  {isUrdu ? "لاگ اِن" : "Log In"}
                </motion.button>
              </Link>

              {/* Get Started Button (Larger than Login, Animated Border on Hover) */}
              <Link href="/register" className="hidden sm:block no-focus-ring">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="relative h-[44px] px-6 rounded-full text-[#111827] bg-white border border-[#111827]/12 flex items-center justify-center gap-1.5 transition-colors duration-200 overflow-hidden group no-focus-ring"
                >
                  {/* Hover gradient border mask */}
                  <span className="absolute inset-0 p-[2px] rounded-full bg-gradient-to-r from-[#00b495] via-[#34d399] to-[#00b495] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 animate-gradient-border"></span>
                  <span className="absolute inset-[1.5px] bg-white rounded-full -z-10"></span>
                  
                  <span className={cn(
                    "relative z-10 transition-colors duration-200 flex items-center gap-1.5 group-hover:text-[#00b495]",
                    isUrdu ? "text-[12px] font-bold font-urdu pt-0.5" : "text-[13px] font-bold"
                  )}>
                    {isUrdu ? "شروع کریں" : "Get Started"}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </motion.button>
              </Link>

              {/* Mobile Drawer Trigger (Hamburger) */}
              <motion.button
                onClick={() => setMobileOpen(true)}
                whileTap={{ scale: 0.92 }}
                className="lg:hidden p-2 rounded-full hover:bg-black/[0.04] transition-colors text-[#111827] no-focus-ring"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </motion.button>

            </div>
          </header>
        </div>
      </div>

      {/* ── Mobile Navigation Drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Dark blur background overlay */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-sm"
            />

            {/* Sidebar drawer content */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed right-0 top-0 bottom-0 z-[70] w-[85vw] max-w-[340px] bg-white shadow-2xl flex flex-col no-focus-ring"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.05]">
                <span className="font-bold text-[17px] text-[#111827]">MedEaz</span>
                <motion.button
                  onClick={() => setMobileOpen(false)}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-full hover:bg-black/[0.05] transition-colors no-focus-ring"
                >
                  <X className="w-5 h-5 text-[#111827]" />
                </motion.button>
              </div>

              {/* Navigation Links List */}
              <nav className="flex-1 px-3 py-5 overflow-y-auto">
                {NAV_ITEMS.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                  >
                    <Link
                      href={`/#${item.sectionId}`}
                      onClick={(e) => handleNavClick(e, item, true)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-left transition-colors duration-150 mb-0.5 no-focus-ring",
                        activeId === item.id
                          ? "bg-[#00b495]/10 text-[#00b495]"
                          : "text-[#374151] hover:bg-black/[0.03]"
                      )}
                    >
                      {activeId === item.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00b495] shrink-0" />
                      )}
                      <span className={cn(
                        isUrdu ? "text-[13px] font-bold font-urdu pt-0.5" : "text-[14px]"
                      )}>
                        {isUrdu ? item.labelUr : item.label}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Drawer Bottom Actions */}
              <div className="px-5 pb-10 pt-5 space-y-3 border-t border-black/[0.05]">
                
                {/* Language Switcher inside Drawer */}
                <button
                  onClick={toggleLanguage}
                  className="relative flex items-center rounded-xl cursor-pointer h-11 w-full select-none overflow-hidden bg-[#F3F4F6] border border-black/[0.05] shrink-0 no-focus-ring"
                >
                  <motion.span
                    layout
                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm"
                    style={{ left: isUrdu ? "calc(50% + 2px)" : "4px" }}
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                  <span className={cn(
                    "flex-1 text-center text-[12px] font-bold z-10 transition-colors duration-150",
                    !isUrdu ? "text-[#00b495]" : "text-[#9CA3AF]"
                  )}>
                    English
                  </span>
                  <span className={cn(
                    "flex-1 text-center text-[12px] font-bold z-10 transition-colors duration-150",
                    isUrdu ? "text-[#00b495]" : "text-[#9CA3AF]"
                  )}>
                    اردو
                  </span>
                </button>

                {/* Login Action */}
                <Link href="/login" onClick={() => setMobileOpen(false)} className="no-focus-ring">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    style={{ backgroundColor: "#00b495", color: "#ffffff" }}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold flex items-center justify-center shadow-sm shadow-[#00b495]/15 focus:outline-none no-focus-ring",
                      isUrdu ? "text-[13px] font-urdu pt-0.5" : "text-[14px]"
                    )}
                  >
                    {isUrdu ? "لاگ اِن" : "Log In"}
                  </motion.button>
                </Link>

                {/* Get Started Action */}
                <Link href="/register" onClick={() => setMobileOpen(false)} className="no-focus-ring">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "w-full py-3 rounded-xl border border-[#00b495] text-[#00b495] font-bold flex items-center justify-center gap-2 hover:bg-[#00b495]/5 transition-colors focus:outline-none no-focus-ring",
                      isUrdu ? "text-[13px] font-urdu pt-0.5" : "text-[14px]"
                    )}
                  >
                    {isUrdu ? "شروع کریں" : "Get Started"}
                    <ArrowRight className="w-4 h-4" />
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
