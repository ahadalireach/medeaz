import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <section className="px-4 sm:px-6 lg:px-10 pt-16 pb-24">
      <div className="mx-auto max-w-[1100px] flex flex-col items-center text-center">
        <div className="flex items-center gap-4 mb-2">
          <div className="relative h-20 w-20">
            <Image
              src="/logo.png"
              alt="medeaz"
              fill
              sizes="80px"
              className="object-contain drop-shadow-[0_12px_24px_rgba(94,77,156,0.25)]"
            />
          </div>
        </div>
        <h2 className="mt-6 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em] text-text-primary max-w-2xl">
          Your health, finally under your control
        </h2>
        <div className="mt-8">
          <Link href="/register">
            <Button size="lg" className="px-8">
              Chat with Medeaz
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
