"use client";

import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Info, Shield, Award } from "lucide-react";
import { useLocale } from "next-intl";

export default function AboutPage() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-20">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-in mt-12 mb-12">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Info className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-6 tracking-tight">
              {isUrdu ? "Medeaz Records" : "About Medeaz Records"}
              {isUrdu ? " کے بارے میں" : ""}
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              {isUrdu
                ? "Medeaz Records ایک وائس سے چلنے والا ڈیجیٹل ہیلتھ کیئر پروڈکٹ ہے جو مریضوں، ڈاکٹروں اور کلینکس کو ایک محفوظ اور مربوط نظام میں جوڑتا ہے۔"
                : "Medeaz Records is a voice-enabled digital healthcare product built to connect patients, doctors, and clinics on one secure platform."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white p-8 rounded-3xl border border-border-light shadow-sm">
              <h3 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                {isUrdu ? "ہمارا مشن" : "Our Mission"}
              </h3>
              <p className="text-text-secondary leading-relaxed text-sm">
                {isUrdu
                  ? "ہمارا مقصد یہ ہے کہ ڈاکٹرز کا کاغذی بوجھ کم ہو، ریکارڈ ضائع نہ ہوں، اور مریضوں کو بروقت اور بہتر علاج ملے۔"
                  : "Our mission is to reduce clinical paperwork, prevent record loss, and improve continuity of care through a unified digital workflow."}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-border-light shadow-sm">
              <h3 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
                <Award className="w-6 h-6 text-primary" />
                {isUrdu ? "ہمیں کیوں منتخب کریں" : "Why Choose Us"}
              </h3>
              <p className="text-text-secondary leading-relaxed text-sm">
                {isUrdu
                  ? "یہ پلیٹ فارم وائس ٹو پریسکرپشن، ریئل ٹائم اینالیٹکس، ملٹی لِنگول سپورٹ اور خودکار فالو اپس فراہم کرتا ہے۔"
                  : "The platform combines voice-to-prescription workflows, real-time analytics, multilingual support, and automated reminders for measurable operational impact."}
              </p>
            </div>
          </div>

          <div className="bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10 text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-6">
              {isUrdu
                ? "اپنے کلینک یا پریکٹس کو ڈیجیٹل بنائیں"
                : "Digitize your clinic operations"}
            </h2>
            <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
              {isUrdu
                ? "چاہے آپ انفرادی ڈاکٹر ہوں یا ملٹی کلینک نیٹ ورک چلا رہے ہوں، Medeaz Records آپ کو ریکارڈ، پریسکرپشن، کمیونیکیشن اور اینالیٹکس کے ضروری ٹولز دیتا ہے۔"
                : "Whether you are an individual practitioner or a multi-clinic operator, Medeaz Records gives you the core tools for records, prescriptions, communication, and analytics."}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
