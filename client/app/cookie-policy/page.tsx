"use client";

import { Footer } from "@/components/home/Footer";

import { Cookie } from "lucide-react";
import { useLocale } from "next-intl";
import { Header } from "../../components/home/Header";

export default function CookiePolicyPage() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 mt-10">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 mt-12 mb-12 animate-in fade-in duration-300">
          <div className="mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary/20">
              <Cookie className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-6 tracking-tight">
              {isUrdu ? "کوکی پالیسی" : "Cookie Policy"}
            </h1>
            <p className="text-text-secondary text-sm font-semibold tracking-wider uppercase mb-8">
              {isUrdu ? "موثر تاریخ" : "Effective Date"}:{" "}
              {new Date().getFullYear()}
            </p>

            <div className="prose max-w-none text-text-primary text-lg leading-relaxed">
              <p className="mb-6">
                {isUrdu
                  ? "Medeaz Records میں ہم بنیادی طور پر ضروری کوکیز استعمال کرتے ہیں تاکہ لاگ ان سیشن محفوظ رہے اور پلیٹ فارم درست طریقے سے کام کرے۔"
                  : "Medeaz Records uses primarily essential cookies to keep sessions secure and ensure the platform functions correctly."}
              </p>

              <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4 tracking-tight">
                {isUrdu
                  ? "1. ہم کوکیز کیوں استعمال کرتے ہیں"
                  : "1. Why We Use Cookies"}
              </h2>
              <p className="mb-4">
                {isUrdu
                  ? "ہم کوکیز اور لوکل اسٹوریج کا استعمال تصدیق، سیشن مینجمنٹ، زبان کی ترجیح اور سیکیورٹی کے لیے کرتے ہیں۔"
                  : "We use cookies and local storage for authentication, session continuity, language preference, and core security controls."}
              </p>

              <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4 tracking-tight">
                {isUrdu ? "2. تھرڈ پارٹی ٹریکرز" : "2. Third-Party Trackers"}
              </h2>
              <p className="mb-4">
                {isUrdu
                  ? "ہم اشتہاری مقاصد کے لیے غیر ضروری تھرڈ پارٹی ٹریکرز استعمال نہیں کرتے۔ صرف محدود تکنیکی ٹیلی میٹری پلیٹ فارم کی کارکردگی اور خرابیوں کے تجزیے کے لیے استعمال ہوتی ہے۔"
                  : "We do not use unnecessary third-party trackers for advertising. Limited technical telemetry is used only for platform stability and troubleshooting."}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
