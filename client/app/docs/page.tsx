"use client";

import { useState } from "react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";

import {
  Book,
  User,
  Stethoscope,
  Hospital,
  ShieldCheck,
  Database,
  ChevronRight,
  LayoutDashboard,
  Calendar,
  MessageSquare,
  FileText,
  Activity,
  Zap,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function DocsPage() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const categories = [
    { id: "intro", title: isUrdu ? "تعارف" : "Introduction", icon: Book },
    {
      id: "centralized",
      title: isUrdu ? "مرکزی نظام" : "Centralized System",
      icon: Database,
    },
    {
      id: "patient",
      title: isUrdu ? "پیشنٹ پورٹل" : "Patient Portal",
      icon: User,
    },
    {
      id: "doctor",
      title: isUrdu ? "ڈاکٹر پورٹل" : "Doctor Portal",
      icon: Stethoscope,
    },
    {
      id: "clinic",
      title: isUrdu ? "کلینک پورٹل" : "Clinic Portal",
      icon: Hospital,
    },
    {
      id: "admin",
      title: isUrdu ? "ایڈمن پورٹل" : "Admin Portal",
      icon: ShieldCheck,
    },
  ];
  const [activeTab, setActiveTab] = useState("intro");

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#F4F3EE] text-text-primary overflow-x-hidden">
      <Header />

      <main className="flex-1 mt-24 max-w-7xl mx-auto w-full px-6 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Documentation Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 sticky top-36 h-fit">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-6 px-4">
              {isUrdu ? "دستاویزات" : "Documentation"}
            </h2>
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold group ${
                    activeTab === cat.id
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "hover:bg-surface :bg-ink-soft text-text-secondary "
                  }`}
                >
                  <cat.icon
                    className={`w-5 h-5 ${activeTab === cat.id ? "text-white" : "text-text-secondary group-hover:text-primary"}`}
                  />
                  <span>{cat.title}</span>
                  {activeTab === cat.id && (
                    <ChevronRight className="w-4 h-4 ml-auto text-white" />
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 bg-white rounded-3xl border border-border-light p-8 md:p-12 shadow-sm relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/5 blur-3xl rounded-full"></div>

            <div className="relative z-10 transition-all duration-300">
              {activeTab === "intro" && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-6">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold mb-6 tracking-tight">
                    {isUrdu ? "تعارف" : "Introduction"}
                  </h1>
                  <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                    {isUrdu
                      ? "MedEaz ڈاکیومنٹیشن سینٹر میں خوش آمدید۔ MedEaz ایک جدید ہیلتھ کیئر پلیٹ فارم ہے جو مریض، ڈاکٹر، کلینک اور ایڈمن کے درمیان رابطہ آسان بناتا ہے۔"
                      : "Welcome to the MedEaz Documentation Center. MedEaz is a cutting-edge healthcare platform designed to simplify the connection between patients, doctors, clinics, and administrators. Our goal is to digitize health records and provide a centralized medical history that travels with the patient across diverse healthcare facilities."}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                    <Link
                      href="/about"
                      className="group p-6 rounded-2xl border border-border-light hover:border-primary/30 hover:bg-background :bg-ink-soft/50 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <Globe className="w-6 h-6 text-primary" />
                        <h3 className="font-bold">
                          {isUrdu ? "ہمارے بارے میں" : "About Our Story"}
                        </h3>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {isUrdu
                          ? "MedEaz کے وژن اور ٹیم کے بارے میں جانیں۔"
                          : "Discover the vision and the team behind MedEaz."}
                      </p>
                    </Link>
                    <Link
                      href="/support"
                      className="group p-6 rounded-2xl border border-border-light hover:border-primary/30 hover:bg-background :bg-ink-soft/50 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <MessageSquare className="w-6 h-6 text-primary" />
                        <h3 className="font-bold">
                          {isUrdu ? "سپورٹ حاصل کریں" : "Get Support"}
                        </h3>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {isUrdu
                          ? "مدد درکار ہے؟ ہماری سپورٹ ٹیم سے رابطہ کریں۔"
                          : "Can't find what you need? Reach out to our 24/7 help center."}
                      </p>
                    </Link>
                  </div>
                </section>
              )}

              {activeTab === "centralized" && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-6">
                    <Database className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold mb-6 tracking-tight">
                    {isUrdu ? "مرکزی ایکوسسٹم" : "Centralized Ecosystem"}
                  </h1>
                  <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                    {isUrdu
                      ? "MedEaz کی اصل طاقت اس کا متحد ڈیٹا سسٹم ہے، جہاں مریض کی میڈیکل ہسٹری مجاز ڈاکٹروں اور کلینکس کو دستیاب رہتی ہے۔"
                      : "The core strength of MedEaz is its unified data architecture. We believe that medical history belongs to the patient, but should be accessible to authorized healthcare providers regardless of the facility."}
                  </p>

                  <div className="space-y-8 mt-12">
                    <div className="flex items-start space-x-6">
                      <div className="p-4 rounded-xl bg-primary/10 flex-shrink-0">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">
                          {isUrdu
                            ? "محفوظ انٹرآپریبلٹی"
                            : "Secure Interoperability"}
                        </h3>
                        <p className="text-text-secondary">
                          {isUrdu
                            ? "کلینکس اور ڈاکٹرز ایک محفوظ مرکزی ڈیٹابیس کے ذریعے مریض کی سابقہ ہسٹری تک رسائی حاصل کرتے ہیں۔"
                            : "Clinics and individual doctors share a central secure database. When a patient visits a new clinic, their previous history is instantly available with permission."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-6">
                      <div className="p-4 rounded-xl bg-primary/10 flex-shrink-0">
                        <Activity className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">
                          {isUrdu
                            ? "لائیو سنکرونائزیشن"
                            : "Live Synchronization"}
                        </h3>
                        <p className="text-text-secondary">
                          {isUrdu
                            ? "نسخے، لیب رپورٹس اور دیگر ریکارڈ فوری طور پر تمام مجاز پورٹلز میں سنک ہو جاتے ہیں۔"
                            : "Prescriptions, lab reports, and vitals recorded in one portal are instantly synchronized across all authorized access points."}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "patient" && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-6">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold mb-6 tracking-tight">
                    Patient Portal
                  </h1>
                  <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                    Designed to give patients ultimate control over their
                    health. Access everything from booking to medical history in
                    one simple interface.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="p-6 rounded-2xl bg-background">
                      <Calendar className="w-6 h-6 text-primary mb-4" />
                      <h4 className="font-bold mb-2">Booking Appointments</h4>
                      <p className="text-sm text-text-secondary">
                        Search for doctors by specialty or location and book in
                        a few clicks.
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-background">
                      <FileText className="w-6 h-6 text-primary mb-4" />
                      <h4 className="font-bold mb-2">Medical Records</h4>
                      <p className="text-sm text-text-secondary">
                        Store and view all prescriptions and lab reports
                        digitally.
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-background">
                      <MessageSquare className="w-6 h-6 text-primary mb-4" />
                      <h4 className="font-bold mb-2">AI Health Assistant</h4>
                      <p className="text-sm text-text-secondary">
                        Chat with MedEaz AI for pre-diagnosis and general health
                        guidance.
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-background">
                      <LayoutDashboard className="w-6 h-6 text-[#B45309] mb-4" />
                      <h4 className="font-bold mb-2">Patient Dashboard</h4>
                      <p className="text-sm text-text-secondary">
                        Monitor your active medication and upcoming check-ups
                        easily.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "doctor" && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-6">
                    <Stethoscope className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold mb-6 tracking-tight">
                    Doctor Portal
                  </h1>
                  <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                    A clinical workspace empowering doctors with patient data
                    insights and efficient practice management tools.
                  </p>

                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl border border-border-light flex items-center justify-between group cursor-default">
                      <div className="flex items-center space-x-4">
                        <Users className="w-6 h-6 text-primary" />
                        <span className="font-bold">Patient Management</span>
                      </div>
                      <span className="text-sm text-text-secondary">
                        View complete patient history before consultation.
                      </span>
                    </div>
                    <div className="p-6 rounded-2xl border border-border-light flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        <span className="font-bold">Analytics & Revenue</span>
                      </div>
                      <span className="text-sm text-text-secondary">
                        Track consultation growth and monthly earnings charts.
                      </span>
                    </div>
                    <div className="p-6 rounded-2xl border border-border-light flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <ClipboardCheck className="w-6 h-6 text-[#B45309]" />
                        <span className="font-bold">Digital Prescriptions</span>
                      </div>
                      <span className="text-sm text-text-secondary">
                        Fast digital prescriptions that sync to user mobile app.
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "clinic" && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-500/10 mb-6">
                    <Hospital className="w-8 h-8 text-red-500" />
                  </div>
                  <h1 className="text-4xl font-bold mb-6 tracking-tight">
                    Clinic Portal
                  </h1>
                  <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                    A sophisticated portal for healthcare facility managers to
                    coordinate multiple doctors and analyze overall patient
                    inflow and revenue performance.
                  </p>

                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none">
                    {[
                      "Manage clinic-associated doctors",
                      "Assign shifts and consultancies",
                      "Monitor central revenue flows",
                      "Analyze clinic-wide performance metrics",
                      "Global patient flow analytics",
                      "Multi-user clinic coordination",
                    ].map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-center space-x-3 text-text-secondary p-3 bg-background/50 rounded-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {activeTab === "admin" && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-surface-lavender/10 mb-6">
                    <ShieldCheck className="w-8 h-8 text-text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold mb-6 tracking-tight">
                    Admin Portal
                  </h1>
                  <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                    The command center for platform health. Administrators
                    manage the entire scale of the MedEaz platform securely.
                  </p>

                  <div className="bg-ink-soft text-white rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl rounded-full"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
                      <div className="text-center">
                        <h4 className="text-xs font-bold uppercase text-text-secondary tracking-widest mb-2">
                          Central Node
                        </h4>
                        <p className="text-lg font-bold">User Mgmt</p>
                      </div>
                      <div className="text-center">
                        <h4 className="text-xs font-bold uppercase text-text-secondary tracking-widest mb-2">
                          Audit Logs
                        </h4>
                        <p className="text-lg font-bold">Security</p>
                      </div>
                      <div className="text-center">
                        <h4 className="text-xs font-bold uppercase text-text-secondary tracking-widest mb-2">
                          Metrics
                        </h4>
                        <p className="text-lg font-bold">System Health</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function ClipboardCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}
