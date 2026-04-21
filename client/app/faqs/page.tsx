"use client";

import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useLocale } from "next-intl";

export default function FAQPage() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = isUrdu ? [
    {
      question: "اپائنٹمنٹ کیسے بک کی جائے؟",
      answer: "اپنے پیشنٹ ڈیش بورڈ میں لاگ ان کریں، ڈاکٹر منتخب کریں اور دستیاب وقت سلاٹ منتخب کر کے اپائنٹمنٹ بک کریں۔"
    },
    {
      question: "کیا میرا میڈیکل ڈیٹا محفوظ ہے؟",
      answer: "جی ہاں، ہم جدید انکرپشن اور سیکیورٹی پروٹوکول استعمال کرتے ہیں تاکہ آپ کا ڈیٹا محفوظ رہے۔"
    },
    {
      question: "کیا میں ایک سے زیادہ میڈیکل ریکارڈز مینیج کر سکتا ہوں؟",
      answer: "جی ہاں، آپ میڈیکل والٹ میں اپنے نسخے، لیب رپورٹس اور دیگر دستاویزات اپ لوڈ کر سکتے ہیں۔"
    },
    {
      question: "کلینک ایڈمن اسٹاف کیسے مینیج کرتا ہے؟",
      answer: "کلینک ایڈمن پورٹل سے ڈاکٹرز اور اسٹاف مینیج کر سکتا ہے، اپائنٹمنٹس سنبھال سکتا ہے اور ریونیو ٹریک کر سکتا ہے۔"
    },
    {
      question: "کیا موبائل ایپ موجود ہے؟",
      answer: "MedEaz موبائل براؤزرز پر مکمل طور پر ریسپانسیو ہے۔ iOS اور Android ایپس بھی زیرِ تیاری ہیں۔"
    }
  ] : [
    {
      question: "How do I book an appointment?",
      answer: "You can book an appointment by logging into your patient dashboard, searching for a doctor, and choosing an available time slot."
    },
    {
      question: "Is my medical data secure?",
      answer: "Yes, we use industry-standard encryption and high-security protocols to ensure your medical records are only accessible to you and the doctors you authorize."
    },
    {
      question: "Can I manage multiple medical records?",
      answer: "Absolutely. Our 'Medical Vault' allows you to upload and categorize all your medical documents, from prescriptions to lab reports."
    },
    {
      question: "How do clinic admins manage staff?",
      answer: "Clinic administrators have a dedicated portal to add/remove doctors and staff, manage appointments across the facility, and track clinic revenue."
    },
    {
      question: "Is there a mobile app?",
      answer: "MedEaz is fully responsive and works perfectly on mobile browsers. We are also working on dedicated iOS and Android applications."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
              {isUrdu ? "اکثر پوچھے جانے والے سوالات" : "Frequently Asked Questions"}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {isUrdu ? "MedEaz پلیٹ فارم کے بارے میں ضروری معلومات" : "Everything you need to know about the MedEaz platform."}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-gray-900 dark:text-white">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="p-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
