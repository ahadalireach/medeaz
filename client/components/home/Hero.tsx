"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative pt-44 pb-32 px-6 overflow-hidden flex flex-col items-center">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <h1 className="text-heading font-semibold text-3xl md:text-5xl tracking-tight text-foreground leading-[1.2] max-w-5xl mb-12">
          Build Digital Health <br /> with Medeaz
        </h1>

        <p className="text-xl md:text-2xl text-text-secondary font-medium max-w-2xl leading-relaxed mb-14">
          The full-stack platform for AI-powered clinical and financial
          experiences.
        </p>

        <div className="flex flex-col sm:flex-row gap-5">
          <Link href="#">
            <Button
              variant="outline"
              className="h-14 px-10 rounded-full text-base font-bold bg-white shadow-none border-border-light hover:border-primary/20 transition-all"
            >
              Developer Docs
            </Button>
          </Link>
          <Link href="/register">
            <Button className="h-14 px-10 rounded-full text-base font-bold">
              Start Building
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
