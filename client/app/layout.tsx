import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter for Lens-like clean sans
import "./globals.css";
import { StoreProvider } from "@/providers/StoreProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-white text-text-primary">
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
