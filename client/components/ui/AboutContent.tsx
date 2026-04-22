import Image from "next/image";

export default function AboutContent() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 bg-white rounded-2xl border border-black/5">
      <div className="flex items-center gap-4">
        <Image
          src="/logo-light.svg"
          alt="Medeaz"
          width={100}
          height={34}
          priority
          className=""
        />
        <Image
          src="/logo-dark.svg"
          alt="Medeaz"
          width={100}
          height={34}
          priority
          className="hidden"
        />
      </div>
      <h1 className="text-3xl font-bold text-text-primary">About Medeaz</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">Our Mission</h2>
        <p className="text-text-secondary leading-relaxed">
          At Medeaz, our mission is to revolutionize healthcare accessibility by
          connecting patients, doctors, and clinics seamlessly. We aim to
          empower individuals with technology, enabling voice-enabled digital
          healthcare solutions that prioritize convenience, transparency, and
          superior patient outcomes.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">What We Do</h2>
        <p className="text-text-secondary leading-relaxed">
          We provide a comprehensive, all-in-one health platform. From
          AI-assisted symptom checkers and instant appointment bookings to
          integrated clinical records and remote prescription management, Medeaz
          digitizes the entire healthcare journey.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">Our Team</h2>
        <p className="text-text-secondary leading-relaxed">
          [Team Section Placeholder] - We are a dedicated group of healthcare
          professionals, software engineers, and patient advocates working
          tirelessly to build the future of medicine.
        </p>
      </section>
    </div>
  );
}
