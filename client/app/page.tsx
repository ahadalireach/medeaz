import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { ImportSection } from "@/components/home/ImportSection";
import { InsightsSection } from "@/components/home/InsightsSection";
import { ResultsSection } from "@/components/home/ResultsSection";
import { PrescriptionsSection } from "@/components/home/PrescriptionsSection";
import { PoweredBySection } from "@/components/home/PoweredBySection";
import { FAQsSection } from "@/components/home/FAQsSection";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="min-h-screen font-sans text-text-primary overflow-x-hidden relative" style={{ background: '#f6f8f8' }}>
      {/* Same medical background pattern as dashboards */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-0" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <pattern id="home-diag" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="60" stroke="#0F4C5C" strokeWidth="0.6"/>
          </pattern>
          <pattern id="home-icons" x="0" y="0" width="320" height="320" patternUnits="userSpaceOnUse">
            <g transform="translate(28,38) scale(0.75)" opacity="0.55">
              <circle cx="12" cy="6" r="4" fill="none" stroke="#0F4C5C" strokeWidth="1.5"/>
              <path d="M8 6H4a2 2 0 0 0-2 2v6a6 6 0 0 0 12 0V8a2 2 0 0 0-2-2h-4" fill="none" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="3" fill="none" stroke="#0F4C5C" strokeWidth="1.5"/>
            </g>
            <g transform="translate(205,72) scale(0.68)" opacity="0.55">
              <rect x="3" y="9" width="18" height="6" rx="3" fill="none" stroke="#0F4C5C" strokeWidth="1.5" transform="rotate(-45 12 12)"/>
              <line x1="9" y1="15" x2="15" y2="9" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
            <g transform="translate(95,175)" opacity="0.55">
              <path d="M0 12 L8 12 L12 2 L18 22 L24 2 L30 22 L34 12 L46 12" fill="none" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <g transform="translate(240,222) scale(0.62)" opacity="0.55">
              <rect x="9" y="3" width="6" height="18" rx="1" fill="none" stroke="#0F4C5C" strokeWidth="1.5"/>
              <rect x="3" y="9" width="18" height="6" rx="1" fill="none" stroke="#0F4C5C" strokeWidth="1.5"/>
            </g>
            <g transform="translate(42,235) scale(0.62)" opacity="0.55">
              <line x1="5" y1="19" x2="19" y2="5" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 4l2 2-9.5 9.5-2-2z" fill="none" stroke="#0F4C5C" strokeWidth="1.5" strokeLinejoin="round"/>
              <line x1="9" y1="15" x2="5" y2="19" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#home-diag)" opacity="0.1"/>
        <rect width="100%" height="100%" fill="url(#home-icons)" opacity="0.18"/>
      </svg>

      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <ImportSection />
          <InsightsSection />
          <ResultsSection />
          {/* <PrescriptionsSection /> */}
          <PoweredBySection />
          <FAQsSection />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
