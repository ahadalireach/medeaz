import Image from "next/image";

export default function AboutContent() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6 bg-white dark:bg-[#18181b] rounded-2xl border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-4">
               <Image
                 src="/logo-light.svg"
                 alt="MedEaz"
                 width={100}
                 height={34}
                 priority
                 className="dark:hidden"
               />
               <Image
                 src="/logo-dark.svg"
                 alt="MedEaz"
                 width={100}
                 height={34}
                 priority
                 className="hidden dark:block"
               />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">About MedEaz</h1>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Our Mission</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    At MedEaz, our mission is to revolutionize healthcare accessibility by connecting patients, doctors, and clinics seamlessly.  We aim to empower individuals with technology, enabling voice-enabled digital healthcare solutions that prioritize convenience, transparency, and superior patient outcomes.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">What We Do</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    We provide a comprehensive, all-in-one health platform. From AI-assisted symptom checkers and instant appointment bookings to integrated clinical records and remote prescription management, MedEaz digitizes the entire healthcare journey.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Our Team</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    [Team Section Placeholder] - We are a dedicated group of healthcare professionals, software engineers, and patient advocates working tirelessly to build the future of medicine.
                </p>
            </section>
        </div>
    );
}
