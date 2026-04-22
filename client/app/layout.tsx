import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Medeaz",
  description: "Digital Healthcare Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable}`}
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
