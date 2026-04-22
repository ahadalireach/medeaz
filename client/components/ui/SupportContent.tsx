"use client";

import { HelpCircle, Mail, Phone, Clock } from "lucide-react";
import { useLocale } from "next-intl";

export default function SupportContent() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-4 tracking-tight">
          {isUrdu ? (
            <>
              ہم آپ کی <span className="text-primary">کس طرح مدد</span> کر سکتے
              ہیں؟
            </>
          ) : (
            <>How can we help?</>
          )}
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          {isUrdu
            ? "ہماری سپورٹ ٹیم آپ کو Medeaz Records کے استعمال، آن بورڈنگ اور تکنیکی مسائل میں رہنمائی دیتی ہے۔"
            : "Our support team helps with Medeaz Records onboarding, usage guidance, and technical troubleshooting."}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-8 rounded-2xl border border-border-light text-center shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            {isUrdu ? "ای میل سپورٹ" : "Email Support"}
          </h3>
          <p className="text-text-secondary mb-4 text-sm">
            {isUrdu
              ? "پروڈکٹ سوالات یا بگ رپورٹس ای میل کریں، عمومی طور پر 24 گھنٹوں میں جواب دیا جاتا ہے۔"
              : "Send product questions or bug reports by email; we usually respond within 24 hours."}
          </p>
          <a
            href="mailto:support@medeaz.com"
            className="text-primary font-semibold hover:underline"
          >
            support@medeaz.com
          </a>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-border-light text-center shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Phone className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            {isUrdu ? "فون سپورٹ" : "Phone Support"}
          </h3>
          <p className="text-text-secondary mb-4 text-sm">
            {isUrdu
              ? "آن بورڈنگ، کلینک سیٹ اپ اور ورک فلو رہنمائی کے لیے کال شیڈول کریں۔"
              : "Schedule a call for onboarding, clinic setup, and workflow guidance."}
          </p>
          <a
            href="tel:+18001234567"
            className="text-primary font-semibold hover:underline"
          >
            +92324-1441444
          </a>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-border-light text-center shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            {isUrdu ? "اوقاتِ کار" : "Business Hours"}
          </h3>
          <p className="text-text-secondary mb-4 text-sm">
            {isUrdu
              ? "پیر تا جمعہ، صبح 9:00 تا شام 6:00 (PKT)"
              : "Mon - Fri, 9:00 AM - 6:00 PM PKT"}
          </p>
          <span className="text-text-secondary font-semibold text-sm">
            {isUrdu
              ? "اہم سروس ایشوز کے لیے ترجیحی سپورٹ دستیاب ہے۔"
              : "Priority support is available for critical service-impacting issues."}
          </span>
        </div>
      </div>

      <div className="bg-background rounded-3xl p-8 md:p-12 border border-black/5">
        <h2 className="text-2xl font-bold text-text-primary mb-8 flex items-center gap-3">
          <HelpCircle className="text-primary w-6 h-6" />
          {isUrdu
            ? "اکثر پوچھے جانے والے سوالات"
            : "Frequently Asked Questions"}
        </h2>

        <div className="space-y-6 text-left">
          <div>
            <h4 className="text-lg font-bold text-text-primary">
              {isUrdu
                ? "پاس ورڈ کیسے ری سیٹ کریں؟"
                : "How do I reset my password?"}
            </h4>
            <p className="text-text-secondary mt-2">
              {isUrdu
                ? 'لاگ ان پیج پر "Forgot Password" پر کلک کریں یا پروفائل سیٹنگز سے پاس ورڈ تبدیل کریں۔'
                : 'You can reset your password from the login page by clicking "Forgot Password" or from your profile settings if you are already logged in.'}
            </p>
          </div>
          <hr className="border-border-light" />
          <div>
            <h4 className="text-lg font-bold text-text-primary">
              {isUrdu
                ? "اپائنٹمنٹ کیسے منسوخ کریں؟"
                : "How do I cancel an appointment?"}
            </h4>
            <p className="text-text-secondary mt-2">
              {isUrdu
                ? 'ڈیش بورڈ میں "Appointments" ٹیب کھولیں، اپائنٹمنٹ منتخب کریں اور "Cancel" پر کلک کریں۔'
                : 'Go to the "Appointments" tab in your dashboard, select the upcoming appointment, and click "Cancel". Be sure to check clinic cancellation policies.'}
            </p>
          </div>
          <hr className="border-border-light" />
          <div>
            <h4 className="text-lg font-bold text-text-primary">
              {isUrdu
                ? "کیا میرا میڈیکل ڈیٹا محفوظ ہے؟"
                : "Is my medical data secure?"}
            </h4>
            <p className="text-text-secondary mt-2">
              {isUrdu
                ? "جی ہاں، Medeaz Records محفوظ تصدیق، رول بیسڈ رسائی اور انکرپٹڈ ٹرانسفر کے ذریعے ڈیٹا کی حفاظت کرتا ہے۔"
                : "Yes, Medeaz Records protects data with secure authentication, role-based access, and encrypted transport."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
