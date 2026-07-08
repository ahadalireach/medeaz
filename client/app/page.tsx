import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/home/Hero";
import { ShowcaseSections } from "@/components/home/ShowcaseSections";
import { FAQsSection } from "@/components/home/FAQsSection";
import { Footer } from "@/components/home/Footer";
import { LenisProvider } from "@/providers/LenisProvider";

export default function Home() {
  return (
    <LenisProvider>
      <div className="min-h-screen font-sans text-ink bg-white overflow-x-hidden relative selection:bg-brand/20 selection:text-ink">
        <Navbar />
        <main>
          <Hero />
          <ShowcaseSections />
          <FAQsSection />
        </main>
        <Footer />
      </div>
    </LenisProvider>
  );
}
