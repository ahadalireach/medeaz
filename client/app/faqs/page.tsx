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
  const faqs = isUrdu
    ? [
        {
          question: "اپائنٹمنٹ کیسے بک کی جائے؟",
          answer:
            "اپنے پیشنٹ ڈیش بورڈ میں لاگ ان کریں، ڈاکٹر منتخب کریں اور دستیاب وقت سلاٹ منتخب کر کے اپائنٹمنٹ بک کریں۔",
        },
        {
          question: "کیا میرا میڈیکل ڈیٹا محفوظ ہے؟",
          answer:
            "جی ہاں، Medeaz Records انکرپشن، محفوظ لاگ اِن، اور رول بیسڈ ایکسس کنٹرول کے ذریعے ڈیٹا کو محفوظ رکھتا ہے۔",
        },
        {
          question: "کیا میں ایک سے زیادہ میڈیکل ریکارڈز مینیج کر سکتا ہوں؟",
          answer:
            "جی ہاں، آپ میڈیکل والٹ میں اپنے نسخے، لیب رپورٹس اور دیگر دستاویزات اپ لوڈ کر سکتے ہیں۔",
        },
        {
          question: "کلینک ایڈمن اسٹاف کیسے مینیج کرتا ہے؟",
          answer:
            "کلینک ایڈمن پورٹل سے ڈاکٹرز اور اسٹاف مینیج کر سکتا ہے، اپائنٹمنٹس سنبھال سکتا ہے اور ریونیو ٹریک کر سکتا ہے۔",
        },
        {
          question: "کیا موبائل ایپ موجود ہے؟",
          answer:
            "یہ پروڈکٹ موبائل براؤزر پر مکمل ریسپانسیو ہے۔ مستقبل میں iOS/Android ایپس اور مزید انٹیگریشنز شامل کیے جا سکتے ہیں۔",
        },
        {
          question: "کیا ڈاکٹر وائس کے ذریعے پریسکرپشن بنا سکتے ہیں؟",
          answer:
            "جی ہاں، ڈاکٹر ماڈیول میں وائس ٹو ٹیکسٹ ورک فلو دستی تحریر کا وقت کم کرنے کے لیے ڈیزائن کیا گیا ہے۔",
        },
      ]
    : [
        {
          question: "How do I book an appointment?",
          answer:
            "You can book an appointment by logging into your patient dashboard, searching for a doctor, and choosing an available time slot.",
        },
        {
          question: "Is my medical data secure?",
          answer:
            "Yes. Medeaz Records uses encryption, secure authentication, and role-based access controls so medical records are only available to authorized users.",
        },
        {
          question: "Can I manage multiple medical records?",
          answer:
            "Absolutely. Our 'Medical Vault' allows you to upload and categorize all your medical documents, from prescriptions to lab reports.",
        },
        {
          question: "How do clinic admins manage staff?",
          answer:
            "Clinic administrators have a dedicated portal to add/remove doctors and staff, manage appointments across the facility, and track clinic revenue.",
        },
        {
          question: "Is there a mobile app?",
          answer:
            "The product is fully responsive on mobile browsers. Dedicated mobile app and integration expansion can be introduced in future releases.",
        },
        {
          question: "Can doctors create prescriptions using voice?",
          answer:
            "Yes. The doctor workflow includes voice-enabled drafting to reduce time spent on manual prescription writing.",
        },
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
            <h1 className="text-4xl font-extrabold text-text-primary mb-6 tracking-tight">
              {isUrdu
                ? "اکثر پوچھے جانے والے سوالات"
                : "Frequently Asked Questions"}
            </h1>
            <p className="text-xl text-text-secondary">
              {isUrdu
                ? "Medeaz پلیٹ فارم کے بارے میں ضروری معلومات"
                : "Everything you need to know about the Medeaz platform."}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-border-light rounded-3xl overflow-hidden bg-white shadow-sm transition-all"
              >
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-background :bg-white/5 transition-colors"
                >
                  <span className="font-bold text-text-primary">
                    {faq.question}
                  </span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-secondary" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="p-6 pt-0 text-text-secondary leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
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
