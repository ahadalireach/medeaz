"use client";

import { useLanguage } from "@/providers/LanguageProvider";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function FinalCTA() {
  const { language } = useLanguage();
  const isUrdu = language === "ur";

  return (
    <section className="py-40 bg-white">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col items-center text-center">
        <h2 className="font-serif text-[64px] font-bold text-ink mb-8 leading-[1.1]">
          {isUrdu ? "اپنی کلینیکل پریکٹس کو آج ہی تبدیل کریں۔" : "Transform your clinical practice today."}
        </h2>
        
        <p className="text-[22px] text-ink-soft mb-12 max-w-2xl leading-relaxed">
          {isUrdu 
            ? "Medeaz کو ان سینکڑوں ڈاکٹروں میں شامل کریں جو پہلے ہی کاغذ اور کی بورڈ سے چھٹکارا پا چکے ہیں۔"
            : "Join hundreds of forward-thinking healthcare professionals who have already ditched the keyboard and embraced the future of medicine."}
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-6">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-16 px-10 rounded-full bg-brand text-white text-[18px] font-bold flex items-center gap-3 shadow-[0_15px_30px_rgba(0,180,149,0.3)] transition-all hover:bg-[#00a386]"
          >
            {isUrdu ? "فری ڈیمو شروع کریں" : "Start Free Trial"} <ArrowRight className="h-5 w-5" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-16 px-10 rounded-full bg-surface text-ink text-[18px] font-bold flex items-center gap-3 border border-border/60 transition-all hover:bg-gray-100"
          >
            {isUrdu ? "سیلز سے بات کریں" : "Contact Sales"}
          </motion.button>
        </div>
      </div>
    </section>
  );
}
