"use client";

import { motion } from "framer-motion";
import { Users, Building2, Calendar, Lock, Globe2, Bot, Shield, ChevronRight } from "lucide-react";

export function BentoSections() {
  return (
    <div className="bg-[#f8f9fa] px-4 sm:px-6 lg:px-10 py-20 pb-32 space-y-24">
      
      {/* ROW 2: Portals */}
      <section className="mx-auto max-w-[1400px]">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink mb-4">Unified Healthcare Ecosystem</h2>
          <p className="text-lg text-ink-soft max-w-2xl mx-auto">One platform connecting doctors, patients, and clinic administrators seamlessly.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PortalCard 
            title="Doctor Portal" 
            desc="Voice-first EMR, smart queues, and automated prescriptions."
            icon={<StethoscopeIcon />}
            color="bg-primary text-white"
            iconBg="bg-white/10"
          />
          <PortalCard 
            title="Patient Portal" 
            desc="Book appointments, view records, and chat securely."
            icon={<Users className="w-6 h-6 text-brand" />}
            color="bg-white border border-border/50 shadow-xl shadow-black/5"
            iconBg="bg-brand/10"
            textColor="text-ink"
            descColor="text-ink-soft"
          />
          <PortalCard 
            title="Clinic Admin" 
            desc="Manage staff, monitor revenue, and analyze performance."
            icon={<Building2 className="w-6 h-6 text-accent-purple-strong" />}
            color="bg-surface-lavender/30 border border-accent-purple/20 shadow-xl shadow-accent-purple/5"
            iconBg="bg-white shadow-sm"
            textColor="text-ink"
            descColor="text-ink-soft"
          />
        </div>
      </section>

      {/* ROW 3: AI Features */}
      <section className="mx-auto max-w-[1400px]">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FeatureCard 
              colSpan="md:col-span-2"
              title="Predictive AI Assistant"
              desc="Our AI anticipates diagnoses and suggests relevant lab tests based on ongoing patient dialogues."
              icon={<Bot className="w-8 h-8 text-brand" />}
              bg="bg-gradient-to-br from-white to-brand/5"
            />
            <FeatureCard 
              colSpan="md:col-span-1"
              title="Bank-Grade Security"
              desc="End-to-end encryption & HIPAA compliance."
              icon={<Lock className="w-8 h-8 text-primary" />}
              bg="bg-white"
            />
            <FeatureCard 
              colSpan="md:col-span-1"
              title="Bilingual Engine"
              desc="Fluent in English and regional Urdu."
              icon={<Globe2 className="w-8 h-8 text-accent-purple-strong" />}
              bg="bg-white"
            />
         </div>
      </section>
      
      {/* ROW 4: Large Workflows */}
      <section className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <motion.div 
             whileHover={{ y: -5 }}
             className="rounded-[2rem] bg-ink text-white p-10 relative overflow-hidden group shadow-2xl"
           >
             <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 blur-[100px] rounded-full"></div>
             <div className="relative z-10">
               <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wider uppercase mb-6 inline-block">Automation</span>
               <h3 className="font-serif text-4xl font-bold mb-4">Zero-Click Prescriptions</h3>
               <p className="text-lg text-white/70 mb-8 max-w-md">Eliminate after-hours documentation. Medeaz drafts your notes while you consult.</p>
               <button className="flex items-center gap-2 text-brand font-bold hover:text-white transition-colors">Explore Workflow <ChevronRight className="w-5 h-5" /></button>
             </div>
           </motion.div>

           <motion.div 
             whileHover={{ y: -5 }}
             className="rounded-[2rem] bg-gradient-to-br from-surface-lavender to-white border border-accent-purple/20 p-10 relative overflow-hidden group shadow-xl shadow-accent-purple/5"
           >
             <div className="relative z-10 h-full flex flex-col">
               <span className="px-3 py-1 bg-white rounded-full text-xs font-bold tracking-wider uppercase mb-6 inline-block w-max text-accent-purple-strong shadow-sm border border-border/50">Management</span>
               <h3 className="font-serif text-4xl font-bold mb-4 text-ink">Smart Queue System</h3>
               <p className="text-lg text-ink-soft mb-8 max-w-md">Real-time patient tracking and automated appointment reminders to reduce no-shows by 40%.</p>
               <div className="mt-auto flex -space-x-2">
                 <div className="h-10 w-10 rounded-full bg-brand border-2 border-white flex items-center justify-center text-white text-xs font-bold">Q1</div>
                 <div className="h-10 w-10 rounded-full bg-primary border-2 border-white flex items-center justify-center text-white text-xs font-bold">Q2</div>
                 <div className="h-10 w-10 rounded-full bg-accent-purple-strong border-2 border-white flex items-center justify-center text-white text-xs font-bold">+5</div>
               </div>
             </div>
           </motion.div>
        </div>
      </section>

    </div>
  );
}

function PortalCard({ title, desc, icon, color, iconBg, textColor = "text-white", descColor = "text-white/80" }: any) {
  return (
    <motion.div whileHover={{ y: -5 }} className={`p-8 rounded-[2rem] flex flex-col ${color}`}>
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 ${iconBg}`}>
        {icon}
      </div>
      <h3 className={`text-2xl font-bold mb-3 ${textColor}`}>{title}</h3>
      <p className={`font-medium leading-relaxed ${descColor}`}>{desc}</p>
    </motion.div>
  );
}

function FeatureCard({ title, desc, icon, bg, colSpan }: any) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className={`p-8 rounded-[2rem] border border-border/50 shadow-lg flex flex-col group hover:shadow-xl transition-all ${bg} ${colSpan}`}>
      <div className="h-12 w-12 rounded-xl bg-surface flex items-center justify-center mb-6 border border-border/50 group-hover:bg-white transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-ink mb-2">{title}</h3>
      <p className="text-ink-soft font-medium">{desc}</p>
    </motion.div>
  );
}

function StethoscopeIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25V7.5a2.25 2.25 0 00-4.5 0v1.5a2.25 2.25 0 004.5 0zm0 0v1.5a2.25 2.25 0 01-4.5 0V8.25m4.5 0H21m-6 0h1.5m0 0V15a2.25 2.25 0 01-4.5 0v-1.5m4.5 1.5v-1.5m0 0H15m4.5 0h1.5m-1.5 0v1.5a2.25 2.25 0 01-4.5 0V15" />
    </svg>
  );
}
