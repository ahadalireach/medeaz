import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-text-primary overflow-x-hidden">
      <Header />
      <main>
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
