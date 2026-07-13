"use client";

import { useLanguage } from "@/providers/LanguageProvider";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import heroImg from "../../public/Hero.png";

export function Hero() {
  const { language } = useLanguage();
  const isUrdu = language === "ur";

  // ECG Pulse SVG Path (Clean 2-line pulse)
  const EcgIcon = () => (
    <svg
      className="w-4 h-4 text-[#00b495] shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12h3l3-9 4 18 3-12h5" />
    </svg>
  );

  // Waveform mini-bars for top-left floating chip
  const WaveformIcon = () => (
    <div className="flex items-end gap-0.5 h-[16px] shrink-0 select-none">
      <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-[#00b495] rounded-full" />
      <motion.div animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-0.5 bg-[#00b495] rounded-full" />
      <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-0.5 bg-[#00b495] rounded-full" />
    </div>
  );

  return (
    <section 
      id="hero" 
      className="relative min-h-[92vh] pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-12 flex items-center justify-center bg-white overflow-hidden"
    >
      {/* ── BACKGROUND IMAGE COVER (With responsive focal points to keep the doctor visible) ── */}
      <Image
        src={heroImg}
        alt="MedEaz Hero Background"
        fill
        priority
        quality={100}
        className="object-cover object-[92%_center] sm:object-[95%_center] md:object-[98%_center] lg:object-right z-0 pointer-events-none"
      />

      {/* Subtle gradient overlay layer for text contrast on smaller screens */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/35 md:from-white/95 md:via-white/75 md:to-white/20 lg:from-transparent lg:to-transparent z-1 pointer-events-none" />

      <div className="max-w-[1200px] mx-auto w-full relative z-10 flex items-center justify-start" dir="ltr">
        
        {/* ── LEFT COLUMN: TEXT BLOCK ── */}
        <div 
          className="w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[440px] md:max-w-[520px] lg:max-w-[540px] xl:max-w-[600px] flex flex-col justify-center relative z-20 items-start text-left"
        >

          {/* 2. HEADLINE */}
          <h1
            className="flex flex-col mb-6 tracking-tight"
            style={{
              lineHeight: "1.0",
              letterSpacing: "-0.04em"
            }}
          >
            {isUrdu ? (
              // Urdu Typography with same sizes as English
              <div
                className="font-urdu font-black text-[#0a1628] text-[24px] xs:text-[27px] sm:text-[40px] md:text-[52px] lg:text-[72px] leading-[1.25] flex flex-col items-start text-left"
              >
                <motion.span
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                >
                  طبی خدمات،
                </motion.span>
                <motion.span
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.27 }}
                  className="text-[#00b495] mt-1"
                >
                  بالآخر باہم مربوط۔
                </motion.span>
              </div>
            ) : (
              // English Typography (72px, weight 800)
              <div
                className="font-extrabold italic text-[#0a1628] text-[24px] xs:text-[27px] sm:text-[40px] md:text-[52px] lg:text-[72px] flex flex-col items-start leading-[1.1]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <motion.span
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                >
                  Healthcare,
                </motion.span>
                <motion.span
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.27 }}
                  className="text-[#00b495]"
                >
                  Finally Connected.
                </motion.span>
              </div>
            )}
          </h1>

          {/* 3. SUPPORTING LINE */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={cn(
              "text-[15px] sm:text-[17px] text-[#4b5563] leading-[1.6] max-w-full sm:max-w-[420px] mb-8 font-medium text-left",
              isUrdu ? "font-urdu" : "font-normal"
            )}
            style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
          >
            {isUrdu
              ? "ڈاکٹر آواز سے نسخہ لکھیں۔ مریض سیکنڈوں میں بکنگ کریں۔ کلینکس خود چلیں۔"
              : "Doctors prescribe by voice. Patients book in seconds. Clinics run themselves."}
          </motion.p>

          {/* 4. CTA ROW */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="flex flex-wrap items-center gap-3 mb-8 w-full sm:w-auto justify-start"
          >
            <Link href="/register" className="no-focus-ring">
              <motion.button
                whileHover={{ scale: 1.03, y: -1, backgroundColor: "#009e82", boxShadow: "0 6px 20px rgba(0,180,149,0.38)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className="bg-[#00b495] text-white text-[14px] sm:text-[15px] font-semibold px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl transition-all duration-200 cursor-pointer no-focus-ring shadow-sm"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {isUrdu ? "عملی طور پر دیکھیں" : "See It in Action"}
              </motion.button>
            </Link>
          </motion.div>

          {/* 5. TRUST ROW */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className={cn(
              "flex flex-wrap items-center gap-y-1.5 gap-x-2.5 text-[11px] sm:text-[12.5px] text-[#6b7280] font-semibold mt-1 justify-start",
              isUrdu && "font-urdu"
            )}
            style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
          >
            <div className="flex items-center gap-1">
              <span className="text-[#00b495] font-bold text-[12px] sm:text-[13px]">✓</span>
              <span>{isUrdu ? "ڈاکٹر کی تشخیص" : "Doctor's Diagnosis"}</span>
            </div>
            <span className="text-gray-300">·</span>
            <div className="flex items-center gap-1">
              <span className="text-[#00b495] font-bold text-[12px] sm:text-[13px]">✓</span>
              <span>{isUrdu ? "آواز سے نسخہ" : "Prescription by Voice"}</span>
            </div>
            <span className="text-gray-300">·</span>
            <div className="flex items-center gap-1">
              <span className="text-[#00b495] font-bold text-[12px] sm:text-[13px]">✓</span>
              <span>{isUrdu ? "EN + اردو" : "EN + اردو"}</span>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
