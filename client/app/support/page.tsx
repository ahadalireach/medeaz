import Footer from "@/components/ui/Footer";
import SupportContent from "@/components/ui/SupportContent";

export default function SupportPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 mt-10">
                <SupportContent />
            </main>
            <Footer />
        </div>
    );
}
