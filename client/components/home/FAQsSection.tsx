"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQsSection() {
  const { language } = useLanguage();
  const isUrdu = language === "ur";
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = isUrdu
    ? [
        {
          question: "کیا میڈ ایز ہپّا (HIPAA) کے اصولوں کے مطابق ہے؟",
          answer: "جی ہاں، میڈ ایز مریضوں کے تمام طبی ڈیٹا اور وائس ریکارڈنگز کو مکمل طور پر محفوظ رکھنے کے لیے جدید ترین اینڈ ٹو اینڈ انکرپشن کا استعمال کرتا ہے۔ تمام ڈیٹا معائنے کے دوران اور اس کے بعد بھی محفوظ رہتا ہے۔"
        },
        {
          question: "کیا یہ اردو نسخہ جات کو سپورٹ کرتا ہے؟",
          answer: "جی بالکل۔ ہمارا نظام انگریزی، اردو یا دونوں زبانوں کے مشترکہ الفاظ کو باآسانی سمجھ کر مریض کے لیے درست نسخہ تیار کرنے کی صلاحیت رکھتا ہے۔ ڈاکٹر معائنے کے دوران قدرتی لہجے میں بات کر سکتے ہیں۔"
        },
        {
          question: "کیا میں اپنے موجودہ EMR سسٹم سے منتقل ہو سکتا ہوں؟",
          answer: "جی ہاں، آپ اپنے پرانے سسٹم سے آسانی سے ڈیٹا منتقل کر سکتے ہیں۔ میڈ ایز آپ کے موجودہ سافٹ ویئر کے اوپر ایک اسمارٹ معاون لیئر کے طور پر کام کر کے اسے مزید بہتر بناتا ہے، تاکہ آپ کو کوئی تبدیلی نہ کرنی پڑے۔"
        },
        {
          question: "کیا فی مریض کوئی فیس ہے؟",
          answer: "بالکل نہیں۔ میڈ ایز فی مریض کوئی فیس یا پوشیدہ چارجز وصول نہیں کرتا۔ ہم ایک فلیٹ ماہانہ یا سالانہ سبسکرپشن ماڈل پیش کرتے ہیں جس میں لامحدود ٹرانسکرپشنز شامل ہیں۔"
        },
        {
          question: "اردو میں طبی اصطلاحات کے لیے وائس ریکگنیشن کیسے کام کرتی ہے؟",
          answer: "ہمارا اے آئی ماڈل خاص طور پر پاکستانی ڈاکٹروں کے بولنے کے انداز اور تلفظ پر تیار کیا گیا ہے۔ یہ ادویات کے برانڈز، ناموں، نسخے کی مقدار اور علامات کو مکمل درستی کے ساتھ سمجھتا ہے۔"
        },
        {
          question: "اگر معائنے کے دوران انٹرنیٹ منقطع ہو جائے تو کیا ہو گا؟",
          answer: "میڈ ایز میں آف لائن سپورٹ موجود ہے۔ انٹرنیٹ منقطع ہونے کی صورت میں ریکارڈنگ جاری رہے گی اور ڈیٹا لوکل ڈیوائس پر محفوظ ہو جائے گا۔ جیسے ہی انٹرنیٹ بحال ہو گا، ڈیٹا خود بخود سنک ہو کر نسخہ تیار کر دے گا۔"
        }
      ]
    : [
        {
          question: "Is MedEaz HIPAA compliant?",
          answer: "Yes, MedEaz is fully HIPAA compliant. All patient data, voice transmissions, and notes are encrypted at rest and in transit using industry-standard protocols to guarantee complete confidentiality."
        },
        {
          question: "Does it support Urdu prescriptions?",
          answer: "Absolutely. Our AI model understands bilingual speech, allowing doctors to dictate in English, Urdu, or a mix of both. The system accurately documents instructions in the selected language."
        },
        {
          question: "Can I switch from my current EMR system?",
          answer: "Yes. MedEaz is designed to play nicely with your existing software. We support data migration and integrate seamlessly as a smart helper layer, meaning you don't have to rebuild your clinical history from scratch."
        },
        {
          question: "Is there a per-patient fee?",
          answer: "No, we do not charge per patient. MedEaz offers flat-rate monthly or annual subscriptions with unlimited voice transcriptions and clinical summaries, keeping your costs predictable."
        },
        {
          question: "How does voice recognition work for medical terms in Urdu?",
          answer: "Our speech recognition models are custom-trained on hundreds of hours of bilingual medical dialogues. They easily recognize local pronunciation of drug names, brand names, and symptoms."
        },
        {
          question: "What happens if my internet goes down mid-consultation?",
          answer: "MedEaz runs a local cache mechanism. The session continues recording offline, and as soon as your connection is restored, the audio files sync and generate your summary automatically."
        }
      ];

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  return (
    <section 
      id="faq" 
      className="py-[100px] bg-white relative overflow-hidden" 
      dir={isUrdu ? "rtl" : "ltr"}
    >
      <div className="max-w-[800px] mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 flex flex-col items-center">
          <h2 
            className="text-[36px] md:text-[44px] font-extrabold text-[#0f1f2e] tracking-tight leading-tight mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {isUrdu ? "وہ سوالات جو کلینکس اکثر پوچھتے ہیں۔" : "Questions clinics actually ask."}
          </h2>
          <p 
            className={cn("text-[17px] text-[#6b7280] leading-relaxed font-normal", isUrdu && "font-urdu")}
            style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
          >
            {isUrdu 
              ? "اگر آپ کو اپنے مطلوبہ سوال کا جواب نہ ملے تو براہِ راست ہم سے رابطہ کریں۔"
              : "If you don't find what you're looking for, reach out directly."}
          </p>
        </div>

        {/* Accordion List with Staggered Entry Animation */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="w-full border-t border-[#f0f0f0]"
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className="border-b border-[#f0f0f0]"
              >
                {/* Accordion Header */}
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className={cn(
                    "w-full py-6 flex items-center justify-between cursor-pointer group text-start",
                    isUrdu ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <span 
                    className={cn(
                      "text-[17px] font-semibold text-[#0f1f2e] transition-colors duration-200 group-hover:text-[#00b495]", 
                      isUrdu && "font-urdu"
                    )}
                    style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
                  >
                    {faq.question}
                  </span>
                  
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="shrink-0 ml-4 mr-4 text-[#00b495]"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </button>
                
                {/* Accordion Answer Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p 
                        className={cn(
                          "pb-6 text-[16px] text-[#4b5563] leading-[1.65] font-normal",
                          isUrdu && "font-urdu text-[15px]"
                        )}
                        style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
                      >
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
