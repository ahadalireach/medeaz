"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform, animate, useScroll, type Variants } from "framer-motion";
import { 
  Check, 
  ChevronRight, 
  Stethoscope, 
  Calendar, 
  ShieldCheck, 
  Activity, 
  Users, 
  ArrowRight,
  Mic,
  Brain,
  Smartphone
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";

// ─── Custom Floating Audio Waveform Component ─────────────────────────────────
function AudioWaveform() {
  return (
    <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 w-44 shadow-lg hidden md:block select-none">
      <span className="text-[10px] text-teal-200 uppercase font-bold block mb-1">Ambient Audio</span>
      <div className="flex items-center gap-1.5 h-8">
        <motion.div animate={{ height: [4, 24, 4] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0 }} className="w-1 bg-[#00b495] rounded-full" />
        <motion.div animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.2 }} className="w-1 bg-[#00b495] rounded-full" />
        <motion.div animate={{ height: [4, 28, 4] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.4 }} className="w-1 bg-white rounded-full" />
        <motion.div animate={{ height: [4, 20, 4] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.1 }} className="w-1 bg-[#00b495] rounded-full" />
        <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.3 }} className="w-1 bg-white rounded-full" />
      </div>
    </div>
  );
}

// ─── Interactive Stat Counter ──────────────────────────────────────────────────
function AnimatedNumber({ value, trigger }: { value: number; trigger: boolean }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (trigger) {
      const controls = animate(count, value, {
        duration: 1.5,
        ease: "easeOut",
      });
      return () => controls.stop();
    } else {
      count.set(0);
    }
  }, [trigger, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function ShowcaseSections() {
  const { language } = useLanguage();
  const isUrdu = language === "ur";

  // Ref & InView setup for staggered cards entry
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  // Voice Prescription Section Ref & InView
  const voiceSectionRef = useRef(null);
  const isVoiceSectionInView = useInView(voiceSectionRef, { amount: 0.4, once: true });

  // Workflow main container ref to track scroll for line animation
  const workflowContainerRef = useRef(null);

  // Track main workflow scroll to draw center connector path
  const { scrollYProgress: mainScrollProgress } = useScroll({
    target: workflowContainerRef,
    offset: ["start center", "end center"]
  });
  const scrollProgressSmooth = useSpring(mainScrollProgress, { stiffness: 100, damping: 30 });

  // Hover states to trigger admin dashboard counter increments
  const [adminHovered, setAdminHovered] = useState(false);

  // Staggered card transition values
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const, delay: custom * 0.15 }
    })
  };

  // Waveform heights keyframes for organic animation loop
  const waveformBars = [
    { duration: 0.8, delay: 0.1, heights: ["24px", "80px", "40px", "72px", "24px"] },
    { duration: 1.1, delay: 0.0, heights: ["40px", "96px", "24px", "80px", "40px"] },
    { duration: 0.9, delay: 0.3, heights: ["16px", "64px", "32px", "56px", "16px"] },
    { duration: 1.3, delay: 0.2, heights: ["48px", "88px", "40px", "72px", "48px"] },
    { duration: 0.7, delay: 0.4, heights: ["32px", "56px", "24px", "48px", "32px"] },
    { duration: 1.0, delay: 0.15, heights: ["24px", "72px", "32px", "64px", "24px"] },
    { duration: 1.2, delay: 0.05, heights: ["40px", "80px", "24px", "72px", "40px"] },
  ];

  // Transcript characters setup for typing animation
  const transcriptSentence = isUrdu 
    ? "ٹیبلیٹ: پیناڈول 500 ملی گرام — کھانے کے بعد — 3 دن" 
    : "Tab: Panadol 500mg — After meals — 3 days";
  const transcriptChars = Array.from(transcriptSentence);

  return (
    <div className="bg-white font-sans selection:bg-[#00b495]/20 overflow-hidden" dir={isUrdu ? "rtl" : "ltr"}>
      
      {/* ── SECTION 1: UNIFIED HEALTHCARE ECOSYSTEM (BENTO GRID) ──────────────── */}
      <section id="solutions" className="py-24 md:py-32 px-6 max-w-[1200px] mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto flex flex-col items-center">
          <span 
            className="text-[13px] font-bold text-[#00b495] tracking-widest uppercase mb-3 block"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {isUrdu ? "ہر کردار کے لیے تیار کردہ" : "Built for Every Role"}
          </span>
          <h2 
            className="text-[36px] md:text-[48px] font-extrabold text-[#0f1f2e] tracking-tight leading-tight mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {isUrdu ? "ایک پلیٹ فارم۔ تین پورٹلز۔" : "One Platform. Three Portals."}
          </h2>
          <p 
            className={cn("text-[18px] text-[#4b5563] leading-relaxed max-w-[520px] font-normal", isUrdu && "font-urdu")}
            style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
          >
            {isUrdu 
              ? "چاہے آپ نسخہ لکھ رہے ہوں، اپائنٹمنٹ بک کر رہے ہوں یا انتظام سنبھال رہے ہوں — میڈ ایز آپ کے کام کے مطابق بنایا گیا ہے۔"
              : "Whether you're prescribing, booking, or managing — MedEaz is built for how you actually work."}
          </p>
        </div>

        {/* Bento Grid */}
        <div ref={containerRef} className="space-y-8">
          
          {/* Row 1: Doctor Portal (60%) & Patient Portal (40%) */}
          <div className={cn("flex flex-col lg:flex-row gap-8", isUrdu && "lg:flex-row-reverse")}>
            
            {/* Doctor Portal Card */}
            <motion.div
              custom={0}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              whileHover={{ y: -4 }}
              className="w-full lg:w-[60%] bg-gradient-to-br from-[#0d3b35] to-[#00b495] rounded-[24px] p-8 md:p-12 text-white relative overflow-hidden shadow-lg group transition-all duration-300"
            >
              {/* Custom SVG Stethoscope Icon */}
              <div className="mb-6 opacity-90 text-white">
                <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M38 16v-2a4 4 0 00-8 0v4a4 4 0 008 0zm0 0v4a4 4 0 01-8 0V16m8 0H42m-12 0h2m0 0v14a4 4 0 01-8 0v-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 28h12M12 32h8M12 36h16" />
                </svg>
              </div>

              {/* Floating Widget Mockup */}
              <AudioWaveform />

              <h3 
                className="text-[32px] font-bold mb-4 tracking-tight text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "white" }}
              >
                {isUrdu ? "ڈاکٹر پورٹل" : "Doctor Portal"}
              </h3>
              <p 
                className={cn("text-[16px] text-teal-50 leading-relaxed mb-8 max-w-[420px] font-normal", isUrdu && "font-urdu")}
                style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
              >
                {isUrdu 
                  ? "آواز کے ذریعے نسخہ لکھیں۔ ریکارڈز فوری دیکھیں۔ اور تمام تحریری کام اے آئی پر چھوڑ دیں۔"
                  : "Prescribe by voice. Review records instantly. Let AI handle the transcriptions and summaries."}
              </p>

              {/* Features list */}
              <ul className="space-y-3.5 mb-10 text-teal-50">
                {[
                  isUrdu ? "ایمبیئنٹ وائس پریسکرپشنز" : "Ambient Voice Prescriptions",
                  isUrdu ? "خودکار طبی خلاصہ جات" : "Smart Medical Summaries",
                  isUrdu ? "فوری ای-پریسکرپشنز" : "Instant E-Prescribing",
                  isUrdu ? "مریض کی ہسٹری ایک نظر میں" : "Patient History at a Glance"
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-[14px]">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#00b495]" />
                    </div>
                    <span style={{ fontFamily: "'Inter', sans-serif" }}>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Link */}
              <Link href="/register" className="inline-flex items-center gap-1.5 text-[14px] font-semibold hover:underline group">
                <span style={{ fontFamily: "'Inter', sans-serif" }}>
                  {isUrdu ? "ڈاکٹر پورٹل پر جائیں" : "Access Doctor Portal"}
                </span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            {/* Patient Portal Card */}
            <motion.div
              custom={1}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              whileHover={{ 
                y: -4, 
                borderColor: "#00b495", 
                boxShadow: "0 8px 24px rgba(0,180,149,0.12)" 
              }}
              className="w-full lg:w-[40%] bg-white border border-[#e5e7eb] rounded-[24px] overflow-hidden group transition-all duration-300 flex flex-col justify-between"
            >
              {/* Photo section */}
              <div className="relative w-full h-[200px] overflow-hidden">
                <Image 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80"
                  alt="Patient mobile app usage"
                  fill
                  className="object-cover group-hover:scale-103 transition-transform duration-500"
                />
              </div>

              {/* Body */}
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 
                    className="text-[24px] font-bold text-[#0f1f2e] mb-3 tracking-tight"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {isUrdu ? "پیشنٹ پورٹل" : "Patient Portal"}
                  </h3>
                  
                  <ul className="space-y-3 mb-8">
                    {[
                      isUrdu ? "آسانی سے آن لائن اپائنٹمنٹ بکنگ" : "Ambient booking",
                      isUrdu ? "محفوظ میڈیکل والٹ" : "Secure medical wallet",
                      isUrdu ? "ڈاکٹر کے ساتھ لائیو چیٹ" : "Live doctor chat"
                    ].map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-[#374151] text-[14px]">
                        <Check className="w-4 h-4 text-[#00b495] shrink-0" />
                        <span style={{ fontFamily: "'Inter', sans-serif" }}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href="/register" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#00b495] hover:underline group">
                  <span style={{ fontFamily: "'Inter', sans-serif" }}>
                    {isUrdu ? "پورٹل پر جائیں" : "Access Portal"}
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>

          </div>

          {/* Row 2: Clinic Admin Card (100% width with internal split) */}
          <motion.div
            custom={2}
            variants={cardVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            onMouseEnter={() => setAdminHovered(true)}
            onMouseLeave={() => setAdminHovered(false)}
            whileHover={{ y: -4 }}
            className="w-full bg-[#f8fafc] rounded-[24px] p-8 md:p-12 border border-[#e5e7eb]/80 shadow-sm transition-all duration-300"
          >
            <div className={cn("flex flex-col lg:flex-row gap-12 items-center", isUrdu && "lg:flex-row-reverse")}>
              
              {/* Admin Left Content */}
              <div 
                className={cn(
                  "w-full lg:w-[50%] flex flex-col justify-center",
                  isUrdu ? "items-end text-right" : "items-start text-left"
                )}
              >
                <span 
                  className="text-[12px] font-bold text-[#00b495] tracking-widest uppercase mb-3 block"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {isUrdu ? "ایڈمن انٹیلیجنس" : "Admin Intelligence"}
                </span>
                
                <h3 
                  className="text-[32px] font-extrabold text-[#0f1f2e] mb-4 tracking-tight leading-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {isUrdu ? "اپنے کلینک کو چلائیں — کاغذی کام کو نہیں۔" : "Run your clinic — not paperwork."}
                </h3>
                
                <p 
                  className={cn("text-[15px] text-[#4b5563] leading-relaxed mb-6 font-normal max-w-[440px]", isUrdu && "font-urdu")}
                  style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
                >
                  {isUrdu 
                    ? "انتہائی واضح طور پر آپریشنز کو بہتر بنائیں، قطاروں کو ٹریک کریں اور آمدنی کی نگرانی کریں۔"
                    : "Optimize operations, track queues, and monitor revenue with absolute clarity."}
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    isUrdu ? "قطار کا بہاؤ کنٹرول" : "Queue Flow Control",
                    isUrdu ? "مالیاتی ڈیش بورڈ" : "Financial Dashboard",
                    isUrdu ? "وسائل کی تقسیم" : "Resource Allocation"
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2.5 text-[#374151] text-[14px]">
                      <Check className="w-4 h-4 text-[#00b495] shrink-0" />
                      <span style={{ fontFamily: "'Inter', sans-serif" }}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#00b495] hover:underline group">
                  <span style={{ fontFamily: "'Inter', sans-serif" }}>
                    {isUrdu ? "ایڈمن پورٹل پر جائیں" : "Access Admin Portal"}
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Admin Right Mockup (HTML/CSS Dashboard) */}
              <div className="w-full lg:w-[50%] bg-white rounded-2xl border border-black/[0.04] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] relative">
                
                {/* Dashboard title row */}
                <div className="flex justify-between items-center mb-6 border-b border-black/[0.04] pb-4">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Real-time Metrics</span>
                    <span className="text-[14px] font-bold text-[#0f1f2e]">{isUrdu ? "ہفتہ وار کارکردگی" : "Weekly Performance"}</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#00b495] animate-pulse" />
                </div>

                {/* Counters Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-black/[0.02]">
                    <span className="text-[9px] text-[#6b7280] font-semibold uppercase block mb-1">Checked In</span>
                    <span className="text-[18px] font-extrabold text-[#0f1f2e]" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <AnimatedNumber value={142} trigger={adminHovered} />
                    </span>
                  </div>
                  <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-black/[0.02]">
                    <span className="text-[9px] text-[#6b7280] font-semibold uppercase block mb-1">Revenue</span>
                    <span className="text-[18px] font-extrabold text-[#0f1f2e]" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {isUrdu ? "PKR " : "PKR "}<AnimatedNumber value={45} trigger={adminHovered} />K
                    </span>
                  </div>
                  <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-black/[0.02]">
                    <span className="text-[9px] text-[#6b7280] font-semibold uppercase block mb-1">No-Shows</span>
                    <span className="text-[18px] font-extrabold text-red-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <AnimatedNumber value={4} trigger={adminHovered} />%
                    </span>
                  </div>
                </div>

                {/* Simple Bar Chart Load Visual */}
                <div className="space-y-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">{isUrdu ? "ڈاکٹر ورک لوڈ" : "Doctor Load"}</span>
                  
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span>Dr. Asif Kamal</span>
                      <span>82%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: adminHovered ? "82%" : "0%" }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="bg-[#00b495] h-full rounded-full" 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span>Dr. Sana Malik</span>
                      <span>94%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: adminHovered ? "94%" : "0%" }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="bg-[#00b495] h-full rounded-full" 
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>

        </div>

      </section>

      {/* ── SECTION 2: VOICE PRESCRIPTION SHOWCASE (DARK APPLE MOMENT) ───────── */}
      <motion.section 
        id="voice-showcase" 
        ref={voiceSectionRef}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative py-[120px] bg-[#0d1f1a] text-white overflow-hidden flex items-center justify-center border-y border-white/[0.04]"
      >
        <div 
          className={cn(
            "max-w-[1100px] mx-auto w-full px-6 flex flex-col lg:flex-row items-center gap-16",
            isUrdu ? "lg:flex-row-reverse" : "lg:flex-row"
          )}
        >
          
          {/* LEFT SIDE: Visual Waveform Card (50% width on desktop) */}
          <div className="w-full lg:w-[50%] flex items-center justify-center">
            
            <div 
              className="w-full max-w-[480px] bg-[#0f2e26] rounded-[28px] p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[380px] shadow-2xl border border-white/[0.03]" 
              style={{ 
                boxShadow: "inset 0 0 60px rgba(0,180,149,0.05)" 
              }}
            >
              {/* Animated Waveform */}
              <div className="flex items-end justify-center gap-2.5 h-28 mb-8 select-none">
                {waveformBars.map((bar, idx) => (
                  <motion.div
                    key={idx}
                    animate={{ 
                      height: bar.heights
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: bar.duration,
                      delay: bar.delay,
                      ease: "easeInOut"
                    }}
                    className="w-2.5 bg-[#00b495] rounded-full"
                  />
                ))}
              </div>

              {/* Simulated character-by-character transcript */}
              <div 
                className={cn(
                  "text-[16px] text-[#4ade80] mb-8 min-h-[48px] leading-relaxed",
                  isUrdu ? "text-right font-urdu text-[18px]" : "text-left font-mono"
                )}
                style={!isUrdu ? { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" } : undefined}
              >
                <motion.div
                  initial="hidden"
                  animate={isVoiceSectionInView ? "visible" : "hidden"}
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.04
                      }
                    }
                  }}
                >
                  {transcriptChars.map((char, index) => (
                    <motion.span
                      key={index}
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 }
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.div>
              </div>

              {/* Bottom active status pill */}
              <div className={cn("flex w-full", isUrdu ? "justify-end" : "justify-start")}>
                <div className="flex items-center gap-2 bg-red-500/10 px-3.5 py-1.5 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span 
                    className="text-[12px] font-semibold tracking-wider text-red-400 uppercase"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {isUrdu ? "ریکارڈنگ فعال ہے" : "RECORDING ACTIVE"}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT SIDE: Product Narrative Text Column (50% width on desktop) */}
          <div 
            className={cn(
              "w-full lg:w-[50%] flex flex-col justify-center",
              isUrdu ? "items-end text-right" : "items-start text-left"
            )}
          >
            <span 
              className="text-[12px] font-bold text-[#00b495] tracking-widest uppercase mb-3 block"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {isUrdu ? "وائس کیپچر / اے آئی" : "VOICE CAPTURE / AI"}
            </span>

            <h2 
              className="text-[38px] md:text-[48px] font-extrabold leading-[1.08] tracking-tight mb-5"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "white" }}
            >
              {isUrdu ? "صرف 12 سیکنڈ میں نسخہ تیار۔ بولیں اور مکمل۔" : "Prescribe in 12 seconds. Dictate. Done."}
            </h2>

            <p 
              className={cn("text-[17px] text-[#9ca3af] leading-[1.6] mb-8 font-normal max-w-[480px]", isUrdu && "font-urdu")}
              style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
            >
              {isUrdu 
                ? "معائنے کے دوران عام انداز میں بات کریں۔ میڈ ایز فوراً آپ کی ہدایات کو سمجھے گا، انہیں ایک صاف نسخے کی شکل میں ترتیب دے گا، اور ریئل ٹائم میں مریض کے ساتھ شیئر کرے گا۔"
                : "Speak naturally during your consultation. MedEaz instantly captures your instructions, organizes them into a clean prescription, and shares it with your patient in real time."}
            </p>

            {/* Icon Rows */}
            <div className="space-y-4 mb-8">
              {[
                { 
                  icon: <Mic className="w-5 h-5 text-[#00b495] shrink-0" />, 
                  text: isUrdu ? "انگریزی اور اردو میں ریئل ٹائم ٹرانسکرپشن" : "Real-time transcription in English and Urdu" 
                },
                { 
                  icon: <Brain className="w-5 h-5 text-[#00b495] shrink-0" />, 
                  text: isUrdu ? "اے آئی کے ذریعے خودکار اور منظم طبی معلومات" : "Smart clinical summaries organized automatically" 
                },
                { 
                  icon: <Smartphone className="w-5 h-5 text-[#00b495] shrink-0" />, 
                  text: isUrdu ? "مریض کو فوری ایس ایم ایس کے ذریعے ترسیل" : "Instant SMS delivery to patient" 
                }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className={cn("flex items-center gap-3.5", isUrdu && "flex-row-reverse")}
                >
                  {item.icon}
                  <span 
                    className="text-[15px] text-[#d1d5db] font-medium"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Secondary CTA style Border Button */}
            <Link href="/register" className="no-focus-ring">
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: "rgba(0,180,149,0.15)", borderColor: "#00b495" }}
                whileTap={{ scale: 0.97 }}
                className="border-[1.5px] border-white/25 text-white text-[14px] font-semibold px-7 py-3 rounded-[12px] transition-all duration-200 cursor-pointer no-focus-ring"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {isUrdu ? "طریقہ کار دیکھیں" : "See How It Works"} →
              </motion.button>
            </Link>

          </div>

        </div>
      </motion.section>

      {/* ── SECTION 3: OTHER CLINICAL FEATURES ──────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 bg-[#f8fafc] border-b border-[#e5e7eb]/40">
        
        {/* Feature 1: AI Clinical Assistant (Flipped columns) */}
        <div className="max-w-[1200px] mx-auto px-6 py-12 flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-24">
          <motion.div 
            initial={{ opacity: 0, x: isUrdu ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex-1 w-full max-w-[500px]"
          >
            <span className="text-[#00b495] font-bold uppercase tracking-wider text-[13px]" style={{ fontFamily: "'Inter', sans-serif" }}>
              {isUrdu ? "01 / انٹیلیجنٹ سیفگارڈز" : "01 / Intelligent Guardrails"}
            </span>
            <h2 
              className="text-[36px] md:text-[44px] font-extrabold text-[#0f1f2e] leading-tight mt-3 mb-5"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {isUrdu ? "اے آئی کلینکل اسسٹنٹ۔" : "AI Clinical Assistant."}
            </h2>
            <p 
              className={cn("text-[16px] text-[#4b5563] leading-relaxed mb-6 font-normal", isUrdu && "font-urdu")}
              style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
            >
              {isUrdu 
                ? "معائنے کے دوران اسمارٹ رہنمائی حاصل کریں۔ ہمارا کلینکل اسسٹنٹ علاج کے مختلف طریقوں کا جائزہ لیتا ہے، ادویات کے ممکنہ مضر اثرات کو واضح کرتا ہے، اور بیماریوں کی سادہ اور آسان الفاظ میں تفصیلات فراہم کرتا ہے تاکہ آپ مریض کی دیکھ بھال پر مکمل توجہ دے سکیں۔"
                : "Get smart support during your consultation. Our clinical co-pilot screens treatment options, highlights key patient drug interactions, and proposes clear diagnosis summaries — making sure you can focus fully on the patient's care."}
            </p>
            <Link href="/register" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#00b495] hover:underline group">
              <span style={{ fontFamily: "'Inter', sans-serif" }}>
                {isUrdu ? "انٹیگریشن دریافت کریں" : "Explore Integration"}
              </span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: isUrdu ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex-1 w-full relative group"
          >
            <div className="aspect-[4/3] rounded-[24px] overflow-hidden border border-black/[0.04] shadow-2xl relative">
              <Image 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80" 
                alt="AI Clinical Assistant co-pilot" 
                fill
                className="object-cover group-hover:scale-102 transition-transform duration-700"
              />
            </div>
          </motion.div>
        </div>

        {/* Feature 2: Appointment Automation */}
        <div className="max-w-[1200px] mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          <motion.div 
            initial={{ opacity: 0, x: isUrdu ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex-1 w-full relative group"
          >
            <div className="aspect-[4/3] rounded-[24px] overflow-hidden border border-black/[0.04] shadow-2xl relative">
              <Image 
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80" 
                alt="Smart Queue management interface" 
                fill
                className="object-cover group-hover:scale-102 transition-transform duration-700"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: isUrdu ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex-1 w-full max-w-[500px]"
          >
            <span className="text-[#00b495] font-bold uppercase tracking-wider text-[13px]" style={{ fontFamily: "'Inter', sans-serif" }}>
              {isUrdu ? "02 / آٹومیشن" : "02 / Automation"}
            </span>
            <h2 
              className="text-[36px] md:text-[44px] font-extrabold text-[#0f1f2e] leading-tight mt-3 mb-5"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {isUrdu ? "اپائنٹمنٹس کی آٹومیشن۔" : "Appointment Automation."}
            </h2>
            <p 
              className={cn("text-[16px] text-[#4b5563] leading-relaxed mb-6 font-normal", isUrdu && "font-urdu")}
              style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
            >
              {isUrdu 
                ? "انتظار گاہ کی پریشانیوں کو ختم کریں۔ میڈ ایز مریضوں کے آنے پر خود بخود ان کا اندراج کرتا ہے، انہیں یاد دہانی کے پیغامات بھیجتا ہے، اور انتظار کے وقت کو ریئل ٹائم میں اپ ڈیٹ کرتا ہے تاکہ کلینک کا انتظام سکون سے چل سکے۔"
                : "Say goodbye to waiting room chaos. MedEaz automatically coordinates check-ins, sends warm SMS visit reminders, and updates wait times in real time. Your staff stays happy, and your patients never feel forgotten."}
            </p>
            <Link href="/register" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#00b495] hover:underline group">
              <span style={{ fontFamily: "'Inter', sans-serif" }}>
                {isUrdu ? "شروع کریں" : "Get Started"}
              </span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

      </section>

      {/* ── SECTION 4: HOW MEDEAZ WORKS (TIMELINE) ─────────────────────────── */}
      <section 
        id="how-it-works" 
        ref={workflowContainerRef}
        className="py-24 md:py-32 px-6 max-w-[1100px] mx-auto relative overflow-hidden"
      >
        
        {/* Timeline Header */}
        <div className="text-center mb-24 max-w-2xl mx-auto flex flex-col items-center">
          <span 
            className="text-[12px] font-bold text-[#00b495] tracking-widest uppercase mb-3 block"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {isUrdu ? "طریقہ کار" : "THE WORKFLOW"}
          </span>
          <h2 
            className="text-[36px] md:text-[44px] font-extrabold text-[#0f1f2e] tracking-tight leading-[1.1] mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {isUrdu ? "بکنگ سے لے کر فالو اپ تک — ایک ہی سیشن میں۔" : "From booking to follow-up — in one session."}
          </h2>
        </div>

        {/* Steps container */}
        <div className="relative space-y-16 lg:space-y-0">
          
          {/* Vertical line connector (desktop only) */}
          <div className="absolute left-1/2 top-10 bottom-10 w-[2px] -translate-x-1/2 hidden lg:block z-0">
            <svg className="w-full h-full" preserveAspectRatio="none">
              {/* Background dashed line */}
              <line 
                x1="50%" y1="0" x2="50%" y2="100%" 
                stroke="#00b495" strokeWidth="2" strokeDasharray="8 8" 
                strokeOpacity="0.15" 
              />
              {/* Animated drawing dashed line */}
              <motion.line 
                x1="50%" y1="0" x2="50%" y2="100%" 
                stroke="#00b495" strokeWidth="2" strokeDasharray="8 8" 
                strokeOpacity="0.6"
                style={{ pathLength: scrollProgressSmooth }} 
              />
            </svg>
          </div>

          {/* Step 1 */}
          <WorkflowStep 
            step="01"
            title={isUrdu ? "مریض اپائنٹمنٹ بک کرتا ہے" : "Patient Books Appointment"}
            desc={
              isUrdu
                ? "مریض ویب سائٹ یا واٹس ایپ کے ذریعے آسانی سے بکنگ کرتے ہیں، تبدیل کرتے ہیں یا منسوخ کرتے ہیں۔ یاد دہانیاں خودکار طور پر بھیجی جاتی ہیں۔"
                : "Patients use the web or WhatsApp to book, reschedule, or cancel. Reminders go out automatically."
            }
            visual={
              <div className="bg-white border border-gray-200/80 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] w-full max-w-[380px] relative select-none">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                  <span className="text-[13px] font-bold text-[#0f1f2e]">{isUrdu ? "اپائنٹمنٹ کی بکنگ" : "Appointment Booking"}</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                    {isUrdu ? "تصدیق شدہ ✓" : "Confirmed ✓"}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-[#f8fafc] p-3 rounded-xl border border-black/[0.01]">
                    <Calendar className="w-5 h-5 text-[#00b495] shrink-0" />
                    <div>
                      <span className="text-[11px] text-gray-400 block">{isUrdu ? "تاریخ اور وقت" : "Date & Time"}</span>
                      <span className="text-[13px] font-bold text-[#0f1f2e]">25 June, 2026 at 10:30 AM</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-[#f8fafc] p-3 rounded-xl border border-black/[0.01]">
                    <Users className="w-5 h-5 text-[#00b495] shrink-0" />
                    <div>
                      <span className="text-[11px] text-gray-400 block">{isUrdu ? "ڈاکٹر" : "Specialist"}</span>
                      <span className="text-[13px] font-bold text-[#0f1f2e]">Dr. Asif Kamal (Cardiologist)</span>
                    </div>
                  </div>
                </div>
              </div>
            }
            isEven={false}
            isUrdu={isUrdu}
          />

          {/* Step 2 */}
          <WorkflowStep 
            step="02"
            title={isUrdu ? "ڈاکٹر معائنہ شروع کرتا ہے" : "Doctor Begins Consultation"}
            desc={
              isUrdu
                ? "ڈاکٹر کے کچھ کہنے سے پہلے ہی میڈ ایز مریض کی ہسٹری، گزشتہ نسخے اور علامات سامنے لے آتا ہے۔"
                : "MedEaz pulls up the patient's history, last prescriptions, and vitals before the doctor says a word."
            }
            visual={
              <div className="bg-white border border-gray-200/80 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] w-full max-w-[380px] relative select-none">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Patient</span>
                    <span className="text-[15px] font-bold text-[#0f1f2e]">{isUrdu ? "کامران خان" : "Kamran Khan"}</span>
                  </div>
                  <span className="text-[11px] bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-bold border border-red-100 uppercase tracking-wide">
                    {isUrdu ? "الرجی: پینسلن" : "Allergy: Penicillin"}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{isUrdu ? "حالیہ ادویات" : "Recent Medications"}</span>
                  <div className="space-y-1.5">
                    {["Amoxicillin 500mg", "Panadol 500mg", "Lisinopril 10mg"].map((med, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[#f8fafc] px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#374151] border border-black/[0.01]">
                        <span>{med}</span>
                        <span className="text-gray-400 font-normal">30 days ago</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
            isEven={true}
            isUrdu={isUrdu}
          />

          {/* Step 3 */}
          <WorkflowStep 
            step="03"
            title={isUrdu ? "وائس پریسکرپشن کیپچر" : "Voice Prescription Captured"}
            desc={
              isUrdu
                ? "ڈاکٹر بلند آواز میں بولتا ہے۔ اے آئی حقیقی وقت میں نسخہ تحریر اور ترتیب دیتا ہے — ٹائپنگ کی ضرورت نہیں ہے۔"
                : "The doctor dictates. AI transcribes and structures the prescription in real time — no typing required."
            }
            visual={
              <div className="bg-[#0f2e26] rounded-[20px] p-6 shadow-[0_12px_32px_rgba(0,180,149,0.1)] w-full max-w-[380px] relative select-none border border-white/[0.04]">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <span className="text-[12px] text-teal-200 font-bold uppercase tracking-wider">{isUrdu ? "آڈیو ان پٹ" : "Voice Capture"}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Live</span>
                  </div>
                </div>

                {/* Mini animated bars */}
                <div className="flex items-end justify-center gap-1.5 h-10 mb-4">
                  {[12, 28, 16, 32, 20, 24, 10].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [h/2 + "px", h + "px", h/3 + "px", h + "px"] }}
                      transition={{ repeat: Infinity, duration: 0.7 + i * 0.1, ease: "easeInOut" }}
                      className="w-1.5 bg-[#00b495] rounded-full"
                    />
                  ))}
                </div>

                <div className="bg-black/20 p-2.5 rounded-lg border border-white/[0.02]">
                  <span className="text-[11px] font-mono text-[#4ade80] block truncate">
                    {isUrdu ? "ٹیبلیٹ: پیناڈول 500 ملی گرام..." : "Tab: Panadol 500mg..."}
                  </span>
                </div>
              </div>
            }
            isEven={false}
            isUrdu={isUrdu}
          />

          {/* Step 4 */}
          <WorkflowStep 
            step="04"
            title={isUrdu ? "مریض کو ریکارڈ موصول ہوتا ہے" : "Patient Receives Records"}
            desc={
              isUrdu
                ? "ای نسخہ، معائنے کا خلاصہ، اور یاد دہانی — مریض کی پسندیدہ زبان میں بذریعہ ایس ایم ایس، ای میل، یا ایپ موصول ہوتی ہے۔"
                : "E-prescription, visit summary, and follow-up reminder — delivered via SMS, email, or in-app, in the patient's preferred language."
            }
            visual={
              <div className="bg-gray-950 border border-white/10 rounded-[24px] p-4 shadow-[0_15px_35px_rgba(0,0,0,0.4)] w-full max-w-[300px] relative select-none text-white overflow-hidden">
                {/* Phone top bar */}
                <div className="flex justify-between items-center text-[10px] text-gray-400 mb-3 px-1">
                  <span>10:32 AM</span>
                  <div className="flex gap-1.5">
                    <span>5G</span>
                    <span>100%</span>
                  </div>
                </div>
                
                {/* SMS Bubble */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 relative shadow-md">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-bold text-[#00b495]">MedEaz SMS</span>
                    <span className="text-[9px] text-gray-400">now</span>
                  </div>
                  <p 
                    className={cn("text-[12px] leading-normal text-gray-100", isUrdu && "font-urdu")}
                  >
                    {isUrdu
                      ? "محترم مریض، آپ کا نسخہ تیار ہے۔ لنک پر کلک کریں: medeaz.pk/rx/7829"
                      : "Dear Patient, your e-prescription from Dr. Kamal is ready. View it here: medeaz.pk/rx/7829"}
                  </p>
                </div>

                {/* Home indicator bar */}
                <div className="w-20 h-1 bg-white/20 rounded-full mx-auto mt-6 mb-1" />
              </div>
            }
            isEven={true}
            isUrdu={isUrdu}
          />

        </div>

      </section>

    </div>
  );
}

// ─── Individual Workflow Step Render Component ───────────────────────────────
function WorkflowStep({
  step,
  title,
  desc,
  visual,
  isEven,
  isUrdu
}: {
  step: string;
  title: string;
  desc: string;
  visual: React.ReactNode;
  isEven: boolean;
  isUrdu: boolean;
}) {
  const stepRef = useRef(null);
  const isInView = useInView(stepRef, { once: true, margin: "-100px" });
  
  // Track scroll progress of this step to apply a visual tilt
  const { scrollYProgress } = useScroll({
    target: stepRef,
    offset: ["start end", "end start"]
  });
  
  // Subtle rotation tilt between -6 and 6 degrees
  const tilt = useTransform(scrollYProgress, [0, 1], isEven ? [4, -4] : [-4, 4]);
  const tiltSpring = useSpring(tilt, { stiffness: 90, damping: 25 });

  // Odd items slide in from left, even from right. RTL reverses this.
  const directionMultiplier = isUrdu ? -1 : 1;
  const initialX = isEven ? 35 * directionMultiplier : -35 * directionMultiplier;

  return (
    <div 
      ref={stepRef}
      className={cn(
        "flex flex-col lg:flex-row items-center gap-12 lg:gap-24 w-full relative z-10 py-12 lg:py-16",
        isUrdu
          ? (isEven ? "lg:flex-row" : "lg:flex-row-reverse")
          : (isEven ? "lg:flex-row-reverse" : "lg:flex-row")
      )}
    >
      {/* Centered center badge on vertical line */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border-2 border-[#00b495] flex items-center justify-center font-extrabold text-[#00b495] shadow-[0_4px_16px_rgba(0,180,149,0.15)] z-20 hidden lg:flex select-none">
        {step}
      </div>

      {/* Text Container (50% width on desktop) */}
      <motion.div
        initial={{ opacity: 0, x: initialX }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: initialX }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "w-full lg:w-1/2 flex flex-col relative",
          isUrdu ? "items-end text-right" : "items-start text-left"
        )}
      >
        {/* Large back-number */}
        <div 
          className={cn(
            "absolute -top-14 text-[110px] font-black text-[#00b495]/[0.07] select-none z-0 pointer-events-none leading-none tracking-tighter",
            isUrdu ? "-right-8" : "-left-8"
          )}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {step}
        </div>

        <div className="relative z-10 max-w-[480px]">
          <h3 
            className="text-[26px] md:text-[28px] font-extrabold text-[#0f1f2e] mb-4 tracking-tight leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {title}
          </h3>
          <p 
            className={cn("text-[15.5px] text-[#4b5563] leading-relaxed font-normal", isUrdu && "font-urdu text-[15px]")}
            style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
          >
            {desc}
          </p>
        </div>
      </motion.div>

      {/* Visual Container (50% width on desktop) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
        style={{ rotate: tiltSpring }}
        className="w-full lg:w-1/2 flex items-center justify-center"
      >
        {visual}
      </motion.div>
    </div>
  );
}
