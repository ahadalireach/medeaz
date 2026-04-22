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
              {isUrdu ? "Medeaz" : "About Medeaz"}
              {isUrdu ? " کے بارے میں" : ""}
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              {isUrdu
                ? "MedEaz ایک جدید ڈیجیٹل ہیلتھ کیئر پلیٹ فارم ہے جو مریضوں، ڈاکٹروں اور کلینکس کو ایک محفوظ نظام میں جوڑتا ہے۔"
                : "MedEaz is a modern, intuitive, and highly functional digital healthcare platform designed to bridge the gap between patients, doctors, and clinics."}
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
                  ? "ہماری کوشش ہے کہ صحت کی سہولت ہر فرد کے لیے آسان، قابلِ رسائی اور محفوظ ہو۔"
                  : "We aim to make healthcare seamless, accessible, and highly secure for everyone. By connecting patients with the best specialists effortlessly, we remove the friction of traditional medical administration."}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-border-light shadow-sm">
              <h3 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
                <Award className="w-6 h-6 text-primary" />
                {isUrdu ? "ہمیں کیوں منتخب کریں" : "Why Choose Us"}
              </h3>
              <p className="text-text-secondary leading-relaxed text-sm">
                {isUrdu
                  ? "ہمارا پلیٹ فارم AI رہنمائی، جدید میڈیکل ریکارڈ ٹریکنگ اور مؤثر نسخہ مینجمنٹ فراہم کرتا ہے۔"
                  : "Our platform offers AI-assisted guidance, advanced medical record tracking, dynamic prescription management, and robust integrations that empower you to take full control of your healthcare journey reliably."}
              </p>
            </div>
          </div>

          <div className="bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10 text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-6">
              {isUrdu
                ? "آج ہی ہمارے نیٹ ورک کا حصہ بنیں"
                : "Join our network today."}
            </h2>
            <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
              {isUrdu
                ? "چاہے آپ ماہر ڈاکٹر تلاش کر رہے ہوں یا کئی کلینکس مینیج کر رہے ہوں، MedEaz آپ کو ضروری تمام ٹولز فراہم کرتا ہے۔"
                : "Whether you are discovering specialists or managing multiple clinics at scale, MedEaz provides all the tools you need."}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
