import { Check, UploadCloud, Smartphone } from "lucide-react";

const POINTS = [
  "Verify your ID to pull prescriptions, labs, and medical history",
  "Auto-import from 150,000+ hospitals and clinics",
  "No passwords or portal logins required",
];

export function ImportSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-10 py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.02em] text-text-primary max-w-md">
            Securely import your medical history in minutes
          </h2>
          <ul className="mt-10 space-y-4 max-w-md">
            {POINTS.map((p) => (
              <li
                key={p}
                className="flex items-start gap-3 text-[15px] leading-relaxed text-text-secondary"
              >
                <span className="mt-0.5 flex-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-text-primary/80">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] rounded-[20px] bg-gradient-to-br from-surface via-surface-lavender/60 to-surface-cream overflow-hidden border border-border-light">
            <div className="absolute inset-0 bg-surface-overlay" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[58%] aspect-[9/16] rounded-[24px] bg-ink-soft shadow-[0_20px_60px_-20px_rgba(15,76,92,0.35)]">
                <div className="absolute inset-[4px] rounded-[20px] bg-white flex flex-col items-center justify-center gap-4 px-6">
                  <div className="h-10 w-10 rounded-full bg-primary-muted flex items-center justify-center">
                    <UploadCloud className="h-5 w-5 text-primary" strokeWidth={2} />
                  </div>
                  <div className="text-center">
                    <p className="font-display text-lg text-text-primary">
                      Importing records
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Connecting 150,000+ providers
                    </p>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-background overflow-hidden">
                    <div className="h-full w-2/3 rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-6 right-6 h-11 w-11 rounded-full bg-white border border-border-light flex items-center justify-center shadow-[0_6px_20px_-8px_rgba(15,76,92,0.25)]">
              <Smartphone className="h-5 w-5 text-primary" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
