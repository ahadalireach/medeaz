"use client";

import { useState } from "react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Activity,
  Book,
  Calendar,
  ChevronRight,
  Database,
  FileText,
  Globe,
  Hospital,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
  Mic,
  BellRing,
  BarChart3,
} from "lucide-react";

type TabId =
  | "intro"
  | "architecture"
  | "patient"
  | "doctor"
  | "clinic"
  | "admin";

export default function DocsPage() {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const tabs: {
    id: TabId;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "intro", title: isUrdu ? "تعارف" : "Introduction", icon: Book },
    {
      id: "architecture",
      title: isUrdu ? "سسٹم آرکیٹیکچر" : "System Architecture",
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

  const [activeTab, setActiveTab] = useState<TabId>("intro");

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#F4F3EE] text-text-primary overflow-x-hidden">
      <Header />

      <main className="flex-1 mt-24 max-w-7xl mx-auto w-full px-6 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          <aside className="w-full md:w-72 flex-shrink-0 sticky top-36 h-fit">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-6 px-4">
              {isUrdu ? "پروڈکٹ ڈاکیومنٹیشن" : "Product Documentation"}
            </h2>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold group ${
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "hover:bg-surface text-text-secondary"
                  }`}
                >
                  <tab.icon
                    className={`w-5 h-5 ${
                      activeTab === tab.id
                        ? "text-white"
                        : "text-text-secondary group-hover:text-primary"
                    }`}
                  />
                  <span>{tab.title}</span>
                  {activeTab === tab.id && (
                    <ChevronRight className="w-4 h-4 ml-auto text-white" />
                  )}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 bg-white rounded-3xl border border-border-light p-8 md:p-12 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/5 blur-3xl rounded-full" />

            <div className="relative z-10 transition-all duration-300">
              {activeTab === "intro" && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-6">
                    <Book className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold mb-6 tracking-tight">
                    {isUrdu
                      ? "Medeaz Records کا تعارف"
                      : "Medeaz Records Overview"}
                  </h1>
                  <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                    {isUrdu
                      ? "Medeaz Records ایک وائس اینیبلڈ ڈیجیٹل ہیلتھ کیئر پروڈکٹ ہے جو ڈاکٹروں، کلینکس اور مریضوں کو ایک متحد سسٹم میں جوڑتا ہے۔ اس کا مقصد کاغذی کام کم کرنا، ریکارڈ کی درستگی بہتر بنانا اور نگہداشت کے تسلسل کو مضبوط بنانا ہے۔"
                      : "Medeaz Records is a voice-enabled digital healthcare product that unifies doctors, clinics, and patients on one platform. It is designed to reduce paperwork, improve record accuracy, and strengthen continuity of care."}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                    <Link
                      href="/about"
                      className="group p-6 rounded-2xl border border-border-light hover:border-primary/30 hover:bg-background transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <Globe className="w-6 h-6 text-primary" />
                        <h3 className="font-bold">
                          {isUrdu ? "پروڈکٹ وژن" : "Product Vision"}
                        </h3>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {isUrdu
                          ? "مارکیٹ مسئلہ، ہماری حکمت عملی، اور طویل مدتی پلان دیکھیں۔"
                          : "Read the market problem, strategic direction, and long-term platform vision."}
                      </p>
                    </Link>

                    <Link
                      href="/support"
                      className="group p-6 rounded-2xl border border-border-light hover:border-primary/30 hover:bg-background transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <MessageSquare className="w-6 h-6 text-primary" />
                        <h3 className="font-bold">
                          {isUrdu ? "عملی مدد" : "Implementation Support"}
                        </h3>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {isUrdu
                          ? "آن بورڈنگ، رول بیسڈ ٹریننگ، اور سپورٹ ورک فلو کے بارے میں معلومات۔"
                          : "Get help with onboarding, role-based usage, and support workflows."}
                      </p>
                    </Link>
                  </div>
                </section>
              )}

              {activeTab === "architecture" && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-6">
                    <Database className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold mb-6 tracking-tight">
                    {isUrdu ? "سسٹم آرکیٹیکچر" : "System Architecture"}
                  </h1>
                  <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                    {isUrdu
                      ? "پلیٹ فارم Next.js فرنٹ اینڈ، Node.js/Express بیک اینڈ، MongoDB + Redis ڈیٹا لیئر، اور AI سروسز (Whisper + Gemini/OpenAI) پر مبنی ہے۔"
                      : "The product architecture uses a Next.js frontend, Node.js/Express APIs, MongoDB + Redis data layers, and AI services such as Whisper and Gemini/OpenAI."}
                  </p>

                  <div className="space-y-6 mt-10">
                    <FeatureRow
                      icon={Mic}
                      title={
                        isUrdu ? "وائس ٹو پریسکرپشن" : "Voice-to-Prescription"
                      }
                      description={
                        isUrdu
                          ? "ڈاکٹر کی آواز سے ساختہ پریسکرپشن ڈرافٹ تیار ہوتا ہے تاکہ دستی تحریر کا وقت کم ہو۔"
                          : "Transforms doctor speech into structured prescription drafts to reduce manual writing time."
                      }
                    />
                    <FeatureRow
                      icon={Activity}
                      title={
                        isUrdu ? "مرکزی ریکارڈ سسٹم" : "Central Record System"
                      }
                      description={
                        isUrdu
                          ? "مجاز کلینکس اور ڈاکٹرز کے لیے مریض کی ہسٹری محفوظ اور قابل تلاش رہتی ہے۔"
                          : "Keeps patient history searchable and securely accessible to authorized providers."
                      }
                    />
                    <FeatureRow
                      icon={BellRing}
                      title={isUrdu ? "آٹومیشن انجن" : "Automation Engine"}
                      description={
                        isUrdu
                          ? "فالو اپس، ریمائنڈرز اور نوٹیفکیشنز خودکار طریقے سے شیڈول اور ڈیلیور ہوتے ہیں۔"
                          : "Automates follow-ups, reminders, and notifications through scheduled workflows."
                      }
                    />
                  </div>
                </section>
              )}

              {activeTab === "patient" && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-6">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold mb-6 tracking-tight">
                    {isUrdu ? "پیشنٹ پورٹل" : "Patient Portal"}
                  </h1>
                  <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                    {isUrdu
                      ? "پیشنٹس اپنی صحت کی ٹائم لائن، فیملی ریکارڈز، اپائنٹمنٹ اور ڈاکٹر چیٹ ایک ہی جگہ مینیج کر سکتے ہیں۔"
                      : "Patients can manage appointments, health timelines, family records, and doctor communication in one interface."}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <InfoCard
                      icon={Calendar}
                      title={isUrdu ? "اپائنٹمنٹ بکنگ" : "Appointment Booking"}
                      text={
                        isUrdu
                          ? "اسپیشلٹی اور لوکیشن کے حساب سے ڈاکٹر تلاش کریں اور سلاٹ بک کریں۔"
                          : "Find doctors by specialty/location and book available slots quickly."
                      }
                    />
                    <InfoCard
                      icon={FileText}
                      title={isUrdu ? "میڈیکل والٹ" : "Medical Vault"}
                      text={
                        isUrdu
                          ? "پریسکرپشنز اور رپورٹس مستقل ڈیجیٹل تاریخ کے ساتھ محفوظ رہتی ہیں۔"
                          : "Prescriptions and reports are preserved in a continuous digital health history."
                      }
                    />
                    <InfoCard
                      icon={MessageSquare}
                      title={isUrdu ? "لائیو چیٹ" : "Live Doctor Chat"}
                      text={
                        isUrdu
                          ? "ڈاکٹرز کے ساتھ فوری رابطہ اور فالو اپ سوالات کی سہولت۔"
                          : "Enables timely communication with doctors for clarifications and follow-ups."
                      }
                    />
                    <InfoCard
                      icon={LayoutDashboard}
                      title={isUrdu ? "پرسنل ڈیش بورڈ" : "Personal Dashboard"}
                      text={
                        isUrdu
                          ? "آنے والی اپائنٹمنٹس، ادویات اور اپڈیٹس ایک نظر میں دیکھیں۔"
                          : "Track upcoming visits, medication status, and activity updates at a glance."
                      }
                    />
                  </div>
                </section>
              )}

              {activeTab === "doctor" && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-6">
                    <Stethoscope className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold mb-6 tracking-tight">
                    {isUrdu ? "ڈاکٹر پورٹل" : "Doctor Portal"}
                  </h1>
                  <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                    {isUrdu
                      ? "ڈاکٹرز کے لیے ایسا کلینیکل ورک اسپیس جس میں مریض ریکارڈ، وائس نوٹس، پریسکرپشن اور فالو اپ ایک ہی فلو میں ہوں۔"
                      : "A clinical workspace where doctors handle records, voice notes, prescriptions, and follow-ups in a single flow."}
                  </p>

                  <div className="space-y-6">
                    <PanelRow
                      icon={Users}
                      title={isUrdu ? "مریض مینجمنٹ" : "Patient Management"}
                      text={
                        isUrdu
                          ? "مریض کی مکمل میڈیکل ہسٹری کنسلٹیشن سے پہلے دستیاب۔"
                          : "Access complete patient history before each consultation."
                      }
                    />
                    <PanelRow
                      icon={Mic}
                      title={isUrdu ? "وائس ڈرافٹنگ" : "Voice Drafting"}
                      text={
                        isUrdu
                          ? "وائس کمانڈز سے پریسکرپشن اور نوٹس بنانے کا تیز طریقہ۔"
                          : "Use voice input to generate prescriptions and notes faster."
                      }
                    />
                    <PanelRow
                      icon={BarChart3}
                      title={
                        isUrdu ? "پرفارمنس اینالیٹکس" : "Performance Analytics"
                      }
                      text={
                        isUrdu
                          ? "کنسلٹیشن رجحانات اور ریونیو سگنلز کے ذریعے بہتر فیصلہ سازی۔"
                          : "Improve decisions with consultation trends and revenue signals."
                      }
                    />
                  </div>
                </section>
              )}

              {activeTab === "clinic" && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-500/10 mb-6">
                    <Hospital className="w-8 h-8 text-red-500" />
                  </div>
                  <h1 className="text-4xl font-bold mb-6 tracking-tight">
                    {isUrdu ? "کلینک پورٹل" : "Clinic Portal"}
                  </h1>
                  <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                    {isUrdu
                      ? "کلینک مالکان اور ایڈمن کے لیے سینٹرل پورٹل، جہاں ڈاکٹرز، سٹاف، اپائنٹمنٹس اور ریونیو ایک جگہ مینیج ہوں۔"
                      : "A central operations portal for clinic owners to manage doctors, staff, appointments, and revenue from one place."}
                  </p>

                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none">
                    {[
                      isUrdu
                        ? "کلینک سے منسلک ڈاکٹرز کی مینجمنٹ"
                        : "Manage clinic-associated doctors",
                      isUrdu
                        ? "شیڈولنگ اور سٹاف کوآرڈینیشن"
                        : "Coordinate schedules and staff assignments",
                      isUrdu
                        ? "ریئل ٹائم ریونیو اور مریض فلو"
                        : "Track real-time revenue and patient flow",
                      isUrdu
                        ? "کلینک پرفارمنس میٹرکس"
                        : "Monitor clinic-wide performance metrics",
                      isUrdu
                        ? "خودکار فالو اپ ریمائنڈرز"
                        : "Automate follow-up reminder workflows",
                      isUrdu
                        ? "ملٹی یوزر آپریشنز"
                        : "Support multi-user clinic operations",
                    ].map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-center space-x-3 text-text-secondary p-3 bg-background/50 rounded-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500" />
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
                    {isUrdu ? "ایڈمن پورٹل" : "Admin Portal"}
                  </h1>
                  <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                    {isUrdu
                      ? "ایڈمن پرت پلیٹ فارم گورننس، یوزر کنٹرول، آڈٹ وژبلٹی اور سسٹم مانیٹرنگ کو مرکزی سطح پر سنبھالتی ہے۔"
                      : "The admin layer manages platform governance, user controls, audit visibility, and operational monitoring."}
                  </p>

                  <div className="bg-ink-soft text-white rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl rounded-full" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
                      <MetricTile
                        title={isUrdu ? "یوزر مینجمنٹ" : "User Management"}
                        value={
                          isUrdu
                            ? "کردار پر مبنی کنٹرول"
                            : "Role-based controls"
                        }
                      />
                      <MetricTile
                        title={isUrdu ? "آڈٹ اور سیکیورٹی" : "Audit & Security"}
                        value={
                          isUrdu ? "رسائی کی نگرانی" : "Access traceability"
                        }
                      />
                      <MetricTile
                        title={isUrdu ? "سسٹم ہیلتھ" : "System Health"}
                        value={
                          isUrdu ? "پرفارمنس سگنلز" : "Performance signals"
                        }
                      />
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

function FeatureRow({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start space-x-6">
      <div className="p-4 rounded-xl bg-primary/10 flex-shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

function PanelRow({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="p-6 rounded-2xl border border-border-light flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Icon className="w-6 h-6 text-primary" />
        <span className="font-bold">{title}</span>
      </div>
      <span className="text-sm text-text-secondary">{text}</span>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-background">
      <Icon className="w-6 h-6 text-primary mb-4" />
      <h4 className="font-bold mb-2">{title}</h4>
      <p className="text-sm text-text-secondary">{text}</p>
    </div>
  );
}

function MetricTile({ title, value }: { title: string; value: string }) {
  return (
    <div className="text-center">
      <h4 className="text-xs font-bold uppercase text-text-secondary tracking-widest mb-2">
        {title}
      </h4>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
