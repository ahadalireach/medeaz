import { Activity, HeartPulse } from "lucide-react";

export function InsightsSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-10 py-20 sm:py-28">
      <div className="mx-auto max-w-[900px] text-center">
        <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.02em] text-text-primary">
          Unlock insights hidden in your health data
        </h2>
        <p className="mt-5 text-[17px] text-text-secondary max-w-xl mx-auto leading-relaxed">
          Your health data is full of signals. Medeaz finds the patterns,
          connects the dots, and makes them actionable.
        </p>
      </div>

      <div className="mx-auto max-w-[880px] mt-14">
        <div className="relative aspect-[2/1] rounded-[22px] overflow-hidden bg-[#0f2a2f] shadow-[0_30px_80px_-30px_rgba(15,76,92,0.45)]">
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(15,76,92,0.6),rgba(10,58,71,0.9)_55%,#061c22)]" />

          <div className="absolute top-6 left-6 right-6 flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <HeartPulse className="h-4.5 w-4.5 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-2 text-left">
                <span className="text-[13px] font-semibold text-white">
                  Heart disease risk
                </span>
              </div>
              <p className="mt-2 text-[13px] text-white/70 max-w-[32ch]">
                Your family history turns this from routine to high-priority
              </p>
            </div>
          </div>

          <div className="absolute inset-x-10 bottom-10">
            <div className="flex items-end gap-2 h-24">
              {[22, 32, 28, 40, 35, 55, 50, 68, 60, 80, 72, 92].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-primary/40 to-white/60"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
              <span>Age 25</span>
              <span className="flex items-center gap-1.5">
                <Activity className="h-3 w-3" />
                Risk over time
              </span>
              <span>Age 75</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
