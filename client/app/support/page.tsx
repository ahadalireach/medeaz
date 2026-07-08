import { Footer } from "@/components/home/Footer";

import { Navbar } from "@/components/layout/Navbar";
import SupportContent from "@/components/ui/SupportContent";

export default function SupportPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-24">
        <SupportContent />
      </main>
      <Footer />
    </div>
  );
}
