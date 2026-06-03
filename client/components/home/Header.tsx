"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MedeazLogo } from "@/components/ui/MedeazLogo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Languages, Menu, X, Home, UserRound, FileText } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

export function Header() {
  const { language, toggleLanguage } = useLanguage();
  const isUrdu = language === "ur";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mobileNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/login", label: isUrdu ? "لاگ اِن" : "Log In", icon: UserRound },
    { href: "/register", label: isUrdu ? "شروع کریں" : "Get Started", icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md">
      <div 
        className={cn(
          "mx-auto max-w-350 px-4 sm:px-6 lg:px-8 min-h-20 py-3 flex items-center justify-between gap-y-2 flex-wrap",
          isUrdu ? "flex-row-reverse" : "flex-row"
        )} 
        dir={isUrdu ? "rtl" : "ltr"}
      >
        <Link href="/" className={cn("flex items-center gap-3 group shrink-0", isUrdu && "flex-row-reverse")}>
          <MedeazLogo size={40} />
          <span className={cn(
            "font-display text-[26px] sm:text-[30px] leading-none text-text-primary tracking-tight font-bold",
            isUrdu && "font-urdu text-[28px]"
          )}>
            Medeaz
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap max-[550px]:hidden">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/60 px-3 py-2 backdrop-blur-sm text-[11px] sm:text-xs font-semibold text-text-primary hover:bg-white/80 transition-colors"
            aria-label="Toggle language"
          >
            <Languages className="h-4 w-4 text-text-secondary" />
            <span
              className={
                language === "en" ? "text-primary font-bold" : "text-text-muted"
              }
            >
              EN
            </span>
            <span className="text-text-muted">|</span>
            <span
              className={
                language === "ur"
                  ? "text-primary font-bold font-urdu"
                  : "text-text-muted font-urdu"
              }
            >
              اردو
            </span>
          </button>

          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-10 px-4 text-sm font-bold transition-colors whitespace-nowrap",
                isUrdu && "font-urdu px-6 py-2 text-base leading-relaxed"
              )}
            >
              {isUrdu ? "لاگ اِن" : "Log In"}
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className={cn(
                "h-10 px-4 text-sm font-bold transition-colors whitespace-nowrap",
                isUrdu && "font-urdu px-6 py-2 text-base leading-relaxed"
              )}
            >
              {isUrdu ? "شروع کریں" : "Get Started"}
            </Button>
          </Link>
        </div>

        <div className="hidden max-[550px]:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white/70 text-text-primary shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mounted && mobileMenuOpen
        ? createPortal(
            <div className="fixed inset-0 z-10000 max-[550px]:block hidden">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setMobileMenuOpen(false)} />
              <div className="absolute right-0 top-0 h-full w-[86vw] max-w-xs bg-white shadow-2xl p-5 flex flex-col gap-4 z-10000">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-text-primary">Medeaz</span>
                  <button type="button" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/5">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-surface/60 px-4 py-3 text-sm font-semibold text-text-primary shadow-sm"
                  aria-label="Toggle language"
                >
                  <span className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-primary" />
                    <span className={language === "en" ? "text-primary font-bold" : "text-text-muted"}>EN</span>
                    <span className="text-text-muted">|</span>
                    <span className={language === "ur" ? "text-primary font-bold font-urdu" : "text-text-muted font-urdu"}>اردو</span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">
                    {isUrdu ? "زبان" : "Language"}
                  </span>
                </button>
                <nav className="mt-4 flex flex-col gap-2">
                  {mobileNavLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-2xl border border-black/5 px-4 py-3 text-sm font-bold text-text-primary hover:bg-primary/5"
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
