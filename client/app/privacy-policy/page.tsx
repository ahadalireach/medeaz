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
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">{isUrdu ? "رازداری پالیسی" : "Privacy Policy"}</h1>
                        <p className="text-gray-500 text-sm font-semibold tracking-wider uppercase mb-8">{isUrdu ? "موثر تاریخ" : "Effective Date"}: {new Date().getFullYear()}</p>

                        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                            <p className="mb-6">{isUrdu ? "MedEaz آپ کی رازداری کو انتہائی اہمیت دیتا ہے۔ یہ پالیسی واضح کرتی ہے کہ ہم آپ کا ذاتی ڈیٹا کیسے جمع، استعمال اور محفوظ کرتے ہیں۔" : "At MedEaz, we take your privacy seriously. This Privacy Policy outlines how we collect, use, and safeguard your personal information dynamically across our software platforms natively."}</p>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">{isUrdu ? "1. ہم کون سی معلومات جمع کرتے ہیں" : "1. Information We Collect"}</h2>
                            <p className="mb-4">{isUrdu ? "بہتر خدمات کی فراہمی کے لیے ہم نام، ای میل، رابطہ معلومات، طبی معلومات اور متعلقہ ڈیٹا جمع کر سکتے ہیں۔" : "We collect information to provide better services to our users. The types of personal information we might request include your name, email address, physical location natively required, medical identifiers strictly, and optional billing data."}</p>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">{isUrdu ? "2. معلومات کا استعمال" : "2. How We Use the Info"}</h2>
                            <p className="mb-4">{isUrdu ? "یہ معلومات مریض دیکھ بھال، اپائنٹمنٹ مینجمنٹ، کمیونیکیشن اور پلیٹ فارم کی بہتری کے لیے استعمال کی جاتی ہیں۔" : "We securely process data locally and only use it to communicate effectively, fulfill required administrative appointments, deliver AI analytics efficiently, and operate transparently in providing you quality digital care."}</p>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">{isUrdu ? "3. ڈیٹا سیکیورٹی" : "3. Data Integrity & Security"}</h2>
                            <p className="mb-4">{isUrdu ? "آپ کے حساس ڈیٹا کی حفاظت کے لیے ہم جدید انکرپشن اور سیکیورٹی اقدامات (جیسے TLS/AES) اپناتے ہیں۔" : "We implement a variety of resilient security measures—including TLS encryption protocols for communication and AES encryption natively—to maintain the utmost protection over the physical and digital boundaries safeguarding sensitive information."}</p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
