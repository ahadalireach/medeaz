"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

export function Header() {
  const { language, toggleLanguage } = useLanguage();
  const isUrdu = language === "ur";

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md">
      <div 
        className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8 min-h-20 py-3 flex items-center justify-between gap-y-2",
          isUrdu ? "flex-row-reverse" : "flex-row"
        )} 
        dir={isUrdu ? "rtl" : "ltr"}
      >
        <Link href="/" className={cn("flex items-center gap-3 group shrink-0", isUrdu && "flex-row-reverse")}>
          <Image
            src="/medeaz.jpeg"
            alt="medeaz"
            width={40}
            height={40}
            priority
            className="h-9 w-9 sm:h-10 sm:w-10 object-contain transition-transform group-hover:scale-105 rounded-lg"
          />
          <span className={cn(
            "font-display text-[26px] sm:text-[30px] leading-none text-text-primary tracking-tight font-bold",
            isUrdu && "font-urdu text-[28px]"
          )}>
            Medeaz
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/60 px-3 py-2 backdrop-blur-sm text-[11px] sm:text-xs font-semibold text-text-primary hover:bg-white/80 transition-all active:scale-95 shadow-sm"
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
                "h-10 px-5 text-sm font-bold transition-all hover:scale-105 active:scale-95",
                isUrdu && "font-urdu px-7 py-2 text-base leading-relaxed"
              )}
            >
              {isUrdu ? "لاگ اِن" : "Log In"}
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className={cn(
                "h-10 px-6 text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-md",
                isUrdu && "font-urdu px-8 py-2 text-base leading-relaxed"
              )}
            >
              {isUrdu ? "شروع کریں" : "Get Started"}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
