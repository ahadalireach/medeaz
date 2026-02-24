"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border-light">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-foreground">
              medeaz
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-text-secondary">
            <Link href="#" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              FAQs
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          <Link
            href="#"
            className="hidden sm:flex items-center text-sm font-semibold text-text-secondary hover:text-foreground transition-colors"
          >
            <Play className="w-4 h-4 mr-2" />
            Demo
          </Link>
          <Link href="/login">
            <Button
              variant="ghost"
              className="h-10 px-4 rounded-full text-sm font-bold hover:bg-surface"
            >
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button className="h-10 px-6 rounded-full text-sm font-bold shadow-sm">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
