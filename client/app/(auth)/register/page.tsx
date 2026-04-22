import Image from "next/image";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center text-center">
      <Image
        src="/logo.png"
        alt="medeaz"
        width={56}
        height={56}
        priority
        className="h-14 w-14 object-contain drop-shadow-[0_10px_24px_rgba(94,77,156,0.25)]"
      />
      <h1 className="mt-6 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] tracking-[-0.02em] text-text-primary">
        Create your Medeaz account
      </h1>
      <div className="mt-8 w-full">
        <RegisterForm />
      </div>
    </div>
  );
}
