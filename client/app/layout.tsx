import type { Metadata } from "next";
import { Inter, Fraunces, Noto_Nastaliq_Urdu, Baloo_Bhaijaan_2 } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/providers/StoreProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
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
      className={`${inter.variable} ${fraunces.variable} ${notoUrdu.variable} ${balooUrdu.variable}`}
      suppressHydrationWarning
    >
      <body
        className="font-sans antialiased bg-background text-text-primary"
        suppressHydrationWarning
      >
        <StoreProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
