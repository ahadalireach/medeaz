"use client";

import Footer from "@/components/ui/Footer";
import { Cookie } from "lucide-react";
import { useLocale } from "next-intl";

export default function CookiePolicyPage() {
    const locale = useLocale();
    const isUrdu = locale === "ur";
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 mt-10">
                <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 mt-12 mb-12 animate-in fade-in duration-300">
                    <div className="mb-12">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary/20">
                            <Cookie className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">{isUrdu ? "کوکی پالیسی" : "Cookie Policy"}</h1>
                        <p className="text-gray-500 text-sm font-semibold tracking-wider uppercase mb-8">{isUrdu ? "موثر تاریخ" : "Effective Date"}: {new Date().getFullYear()}</p>

                        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                            <p className="mb-6">{isUrdu ? "MedEaz میں ہم صرف ضروری کوکیز استعمال کرتے ہیں تاکہ کارکردگی بہتر رہے اور لاگ اِن سیشن محفوظ رہے۔" : "At MedEaz, we utilize minimal essential cookies to optimize performance and retain authentication tokens across local sessions reliably securely."}</p>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4 tracking-tight">{isUrdu ? "1. ہم کوکیز کیوں استعمال کرتے ہیں" : "1. Why We Use Cookies"}</h2>
                            <p className="mb-4">{isUrdu ? "کوکیز اور لوکل اسٹوریج کے ذریعے ہم سیشن کو محفوظ رکھتے ہیں اور ڈیش بورڈ تک مسلسل رسائی یقینی بناتے ہیں۔" : "We actively utilize browser-based cookies, local storage sessions, and strict session algorithms exclusively to protect patient integrity dynamically and guarantee that dashboard access tokens remain persistent and seamlessly resilient under usage loads without compromising UX metrics."}</p>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4 tracking-tight">{isUrdu ? "2. تھرڈ پارٹی ٹریکرز" : "2. Third-Party Trackers"}</h2>
                            <p className="mb-4">{isUrdu ? "ہم غیر ضروری تھرڈ پارٹی ٹریکنگ استعمال نہیں کرتے۔ صرف نظام کے استحکام کے لیے محدود تکنیکی ڈیٹا استعمال کیا جاتا ہے۔" : "We firmly avoid third-party marketing identifiers or intrusive tracking infrastructure strictly aligned with global healthcare regulations natively. Only essential telemetry for debugging stability runs transparently internally."}</p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
