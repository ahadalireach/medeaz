import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-text-primary font-sans">
      <main className="flex min-h-screen w-full items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-[440px]">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/medeaz.jpeg"
              alt="Medeaz Logo"
              width={64}
              height={64}
              priority
              className="h-24 w-24 rounded-lg object-cover drop-shadow-[0_10px_24px_rgba(94,77,156,0.25)]"
            />

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-muted px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
              Error 404
            </div>

            <h1 className="mt-5 font-display text-[clamp(2.25rem,6vw,3.25rem)] leading-[1.05] tracking-[-0.02em] text-text-primary">
              Page not found
            </h1>
            <p className="mt-3 text-[15px] text-text-secondary leading-relaxed max-w-[360px]">
              The page you&apos;re looking for may have been moved, renamed, or
              is temporarily unavailable.
            </p>

            <div className="mt-8 w-full rounded-2xl border border-border-light bg-surface-cream/60 p-5 sm:p-6">
              <p className="text-[13px] text-text-secondary">
                Let&apos;s get you back on track.
              </p>

              <div className="mt-4 flex flex-col gap-2.5">
                <Link href="/" className="w-full">
                  <Button size="lg" className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Go to homepage
                  </Button>
                </Link>
                <Link href="/login" className="w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>

            <p className="mt-8 text-[13px] text-text-secondary">
              Need help?{" "}
              <a
                href="mailto:support@medeaz.com"
                className="font-semibold text-text-primary hover:text-primary"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
