import MedicalBackground from "@/components/ui/MedicalBackground";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative">
      <MedicalBackground />
      {children}
    </div>
  );
}
