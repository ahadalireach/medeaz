"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="medeaz"
            width={36}
            height={36}
            priority
            className="h-9 w-9 object-contain"
          />
          <span className="font-display text-[28px] leading-none text-text-primary/90 tracking-tight font-semibold">
            Medeaz
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 px-5 text-sm font-semibold"
            >
              Log In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="h-10 px-5 text-sm font-semibold">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
