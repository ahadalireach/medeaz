import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex w-full bg-white font-sans text-text-primary">
      {/* Left side Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white relative">
        <Link
          href="/"
          className="absolute top-8 left-8 text-text-muted hover:text-black transition-colors flex items-center"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>

        <RegisterForm />
      </div>

      {/* Right side - Badge Pattern */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden border-l border-border-light">
        <div
          className="absolute inset-0 opacity-100 mix-blend-multiply animate-scroll"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='160' height='220' viewBox='0 0 160 220' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='10' y='10' width='140' height='200' rx='32' fill='white' stroke='%23f1f5f9' stroke-width='2'/%3E%3Cpath d='M70 10v4a10 10 0 0020 0v-4' fill='white' stroke='%23f1f5f9' stroke-width='2'/%3E%3Ccircle cx='80' cy='85' r='28' fill='%23f1f5f9'/%3E%3Cpath d='M40 155c0-22 18-40 40-40s40 18 40 40v10H40v-10z' fill='%23f1f5f9'/%3E%3Crect x='42' y='175' width='76' height='6' rx='3' fill='%23f1f5f9'/%3E%3Crect x='55' y='188' width='50' height='6' rx='3' fill='%23f1f5f9'/%3E%3C/svg%3E")`,
            backgroundSize: "160px 220px",
            maskImage:
              "radial-gradient(circle at center, black 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(circle at center, black 30%, transparent 80%)",
          }}
        />
      </div>
    </div>
  );
}
