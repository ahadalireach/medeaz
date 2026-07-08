import type { Metadata } from "next";
import { Figtree, Inter, Plus_Jakarta_Sans, Space_Grotesk, Onest, Playfair_Display, Outfit, Noto_Nastaliq_Urdu, Baloo_Bhaijaan_2 } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/providers/StoreProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { Toaster } from "react-hot-toast";
import NotificationProvider from "@/components/NotificationProvider";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const notoUrdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-noto-urdu",
  display: "swap",
  weight: ["400", "700"],
});

const balooUrdu = Baloo_Bhaijaan_2({
  subsets: ["arabic"],
  variable: "--font-baloo-urdu",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Medeaz",
  description: "Digital Healthcare Platform",
  icons: {
    icon: "/medeaz.jpeg",
    apple: "/medeaz.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${inter.variable} ${plusJakartaSans.variable} ${spaceGrotesk.variable} ${onest.variable} ${playfair.variable} ${outfit.variable} ${notoUrdu.variable} ${balooUrdu.variable}`}
      suppressHydrationWarning
    >
      <body
        className="font-sans antialiased bg-background text-text-primary"
        suppressHydrationWarning
      >
        <StoreProvider>
          <LanguageProvider>
            <NextAuthProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </NextAuthProvider>
            <Toaster
              containerStyle={{ zIndex: 99999 }}
              toastOptions={{ style: { zIndex: 99999 } }}
            />
          </LanguageProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
