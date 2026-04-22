"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Languages } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

export function Header() {
  const { language, toggleLanguage } = useLanguage();
  const isUrdu = language === "ur";

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 min-h-20 py-3 flex flex-wrap items-center justify-between gap-y-2">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="medeaz"
            width={36}
            height={36}
            priority
            className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
          />
          <span className="font-display text-[24px] sm:text-[28px] leading-none text-text-primary/90 tracking-tight font-semibold">
            Medeaz
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          <button
            type="button"
            onClick={toggleLanguage}
            className="sm:inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border border-black/10 bg-white/60 px-2.5 sm:px-3 py-2 backdrop-blur-sm text-[11px] sm:text-xs font-semibold text-text-primary hover:bg-white/80 transition-colors hidden"
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
              className="h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm font-semibold"
            >
              {isUrdu ? "لاگ اِن" : "Log In"}
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm font-semibold"
            >
              {isUrdu ? "شروع کریں" : "Get Started"}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
