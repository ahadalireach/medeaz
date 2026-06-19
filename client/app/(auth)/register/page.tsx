import Image from "next/image";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center text-center">
      <Image
        src="/medeaz.jpeg"
        alt="Medeaz Logo"
        width={64}
        height={64}
        priority
        className="h-16 w-16 object-cover rounded-lg drop-shadow-[0_6px_16px_rgba(15,76,92,0.2)]"
      />
      <h1 className="mt-5 font-display text-[clamp(1.6rem,3.5vw,2.2rem)] leading-[1.1] tracking-[-0.02em] text-text-primary">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm font-medium text-text-secondary">
        Join Medeaz — your all-in-one health platform
      </p>
      <div className="mt-6 w-full">
        <RegisterForm />
      </div>
    </div>
  );
}
