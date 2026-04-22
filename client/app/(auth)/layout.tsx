export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-text-primary font-sans">
      <main className="flex min-h-screen w-full items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
