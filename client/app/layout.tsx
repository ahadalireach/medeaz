import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter for Lens-like clean sans
import "./globals.css";
import { StoreProvider } from "@/providers/StoreProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Medeaz",
  description: "Digital Healthcare Platform",
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-white text-text-primary">
        <StoreProvider>
          {children}
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
