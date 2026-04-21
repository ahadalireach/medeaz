"use client";

import Link from "next/link";
import { Github, Twitter, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-24 px-6 relative border-t border-border-light border-dashed overflow-hidden">
      {/* Footer Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/nodes.svg')] bg-center bg-no-repeat pointer-events-none"></div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start relative z-10 space-y-16 md:space-y-0">
        <div className="flex flex-col">
          <Link href="/" className="flex items-center space-x-2 mb-10">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              medeaz
            </span>
          </Link>
          <p className="text-text-muted font-medium text-sm mb-10">
            &copy; 2026 Medeaz
          </p>
          <div className="flex space-x-6">
            <Github className="w-6 h-6 text-text-muted hover:text-foreground cursor-pointer transition-colors" />
            <Twitter className="w-6 h-6 text-text-muted hover:text-foreground cursor-pointer transition-colors" />
            <Youtube className="w-6 h-6 text-text-muted hover:text-foreground cursor-pointer transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-20 gap-y-12">
          <div>
            <h5 className="font-bold text-foreground mb-8">Developers</h5>
            <ul className="space-y-4 text-sm font-bold text-text-secondary">
              <li className="hover:text-foreground transition-colors cursor-pointer">
                Docs
              </li>
              <li className="hover:text-foreground transition-colors cursor-pointer">
                Dashboard
              </li>
              <li className="hover:text-foreground transition-colors cursor-pointer">
                Status
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-foreground mb-8">About</h5>
          </div>
          <div>
            <h5 className="font-bold text-foreground mb-8">Company</h5>
            <ul className="space-y-4 text-sm font-bold text-text-secondary">
              <li className="hover:text-foreground transition-colors cursor-pointer">
                Contact
              </li>
              <li className="hover:text-foreground transition-colors cursor-pointer">
                Privacy
              </li>
              <li className="hover:text-foreground transition-colors cursor-pointer">
                Terms
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
