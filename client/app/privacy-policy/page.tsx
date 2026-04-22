"use client";

import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Lock } from "lucide-react";
import { useLocale } from "next-intl";

export default function PrivacyPolicyPage() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-20">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 mt-12 mb-12">
          <div className="mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-6">
              {isUrdu ? "رازداری پالیسی" : "Privacy Policy"}
            </h1>
            <p className="text-text-secondary text-sm font-semibold tracking-wider uppercase mb-8">
              {isUrdu ? "موثر تاریخ" : "Effective Date"}:{" "}
              {new Date().getFullYear()}
            </p>

            <div className="prose max-w-none text-text-primary text-lg leading-relaxed">
              <p className="mb-6">
                {isUrdu
                  ? "Medeaz Records آپ کی رازداری کو بنیادی ترجیح دیتا ہے۔ یہ پالیسی بتاتی ہے کہ ہم کون سا ڈیٹا جمع کرتے ہیں، اسے کیسے استعمال کرتے ہیں، اور اسے کیسے محفوظ رکھتے ہیں۔"
                  : "Medeaz Records treats privacy as a core responsibility. This policy explains what data we collect, how we use it, and how we protect it."}
              </p>

              <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">
                {isUrdu
                  ? "1. ہم کون سی معلومات جمع کرتے ہیں"
                  : "1. Information We Collect"}
              </h2>
              <p className="mb-4">
                {isUrdu
                  ? "ہم اکاؤنٹ معلومات (نام، ای میل، فون)، طبی ریکارڈز، اپائنٹمنٹ ڈیٹا، اور سسٹم لاگز جمع کر سکتے ہیں تاکہ پلیٹ فارم قابلِ اعتماد اور مفید رہے۔"
                  : "We may collect account details (name, email, phone), medical records, appointment data, and system logs required to operate the product reliably."}
              </p>

              <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">
                {isUrdu ? "2. معلومات کا استعمال" : "2. How We Use the Info"}
              </h2>
              <p className="mb-4">
                {isUrdu
                  ? "یہ معلومات مریض دیکھ بھال، وائس ٹو پریسکرپشن پراسیسنگ، اپائنٹمنٹ مینجمنٹ، نوٹیفکیشنز، اور پلیٹ فارم کو بہتر بنانے کے لیے استعمال ہوتی ہیں۔"
                  : "Data is used for care delivery, voice-to-prescription processing, appointment workflows, notifications, and product improvement."}
              </p>

              <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">
                {isUrdu ? "3. ڈیٹا سیکیورٹی" : "3. Data Integrity & Security"}
              </h2>
              <p className="mb-4">
                {isUrdu
                  ? "حساس معلومات کی حفاظت کے لیے ہم محفوظ رسائی کنٹرول، انکرپشن (مثلاً TLS)، اور رول بیسڈ پرمیشنز استعمال کرتے ہیں۔"
                  : "We protect sensitive information through secure access controls, encryption (including TLS in transit), and role-based permissions."}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
