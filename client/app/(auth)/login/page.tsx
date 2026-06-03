import { LoginForm } from "@/components/auth/LoginForm";
import { MedeazLogo } from "@/components/ui/MedeazLogo";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center text-center">
      <MedeazLogo size={56} className="drop-shadow-[0_6px_16px_rgba(15,76,92,0.25)]" />
      <h1 className="mt-5 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] tracking-[-0.02em] text-text-primary">
        Welcome back
      </h1>
      <p className="mt-2 text-sm font-medium text-text-secondary">
        Sign in to your Medeaz account
      </p>
      <div className="mt-8 w-full">
        <LoginForm />
      </div>
    </div>
  );
}
