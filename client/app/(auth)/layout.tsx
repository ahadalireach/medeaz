export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen font-sans relative overflow-hidden"
      style={{ background: "#f6f8f8" }}
    >
      {/* Same subtle medical SVG pattern as dashboard */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="auth-diag" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="60" stroke="#0F4C5C" strokeWidth="0.6" />
          </pattern>
          <pattern id="auth-icons" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
            <g transform="translate(30,40) scale(0.7)" opacity="0.45">
              <circle cx="12" cy="6" r="4" fill="none" stroke="#0F4C5C" strokeWidth="1.5" />
              <path d="M8 6H4a2 2 0 0 0-2 2v6a6 6 0 0 0 12 0V8a2 2 0 0 0-2-2h-4" fill="none" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="18" cy="18" r="3" fill="none" stroke="#0F4C5C" strokeWidth="1.5" />
            </g>
            <g transform="translate(190,80) scale(0.65)" opacity="0.45">
              <rect x="3" y="9" width="18" height="6" rx="3" fill="none" stroke="#0F4C5C" strokeWidth="1.5" transform="rotate(-45 12 12)" />
              <line x1="9" y1="15" x2="15" y2="9" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round" />
            </g>
            <g transform="translate(100,180)" opacity="0.45">
              <path d="M0 12 L8 12 L12 2 L18 22 L24 2 L30 22 L34 12 L44 12" fill="none" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <g transform="translate(230,210) scale(0.6)" opacity="0.45">
              <rect x="9" y="3" width="6" height="18" rx="1" fill="none" stroke="#0F4C5C" strokeWidth="1.5" />
              <rect x="3" y="9" width="18" height="6" rx="1" fill="none" stroke="#0F4C5C" strokeWidth="1.5" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-diag)" opacity="0.08" />
        <rect width="100%" height="100%" fill="url(#auth-icons)" opacity="0.14" />
      </svg>

      <main className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}