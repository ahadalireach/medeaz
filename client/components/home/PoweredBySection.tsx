import { Sparkles } from "lucide-react";

export function PoweredBySection() {
  return (
    <section className="px-4 sm:px-6 lg:px-10 py-20 sm:py-28">
      <div className="mx-auto max-w-[900px] text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-muted px-3.5 py-1.5 text-[12px] font-semibold tracking-wide uppercase text-primary">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
          Clinician-reviewed
        </div>
        <h2 className="mt-6 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.02em] text-text-primary">
          Powered by AI. Verified by clinicians
        </h2>
        <p className="mt-5 text-[17px] text-text-secondary max-w-xl mx-auto leading-relaxed">
          Medical recommendations are confirmed by a licensed clinician in
          your state.
        </p>
      </div>
    </section>
  );
}
