export default function MedicalBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#F4F3EE] pointer-events-none select-none overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          {/* Diagonal lines pattern */}
          <pattern
            id="diagonal-lines"
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0" y1="0"
              x2="0" y2="60"
              stroke="#0F4C5C"
              strokeWidth="0.6"
            />
          </pattern>

          {/* Sparse medical icons pattern — large tile so icons appear scattered */}
          <pattern
            id="medical-icons"
            x="0"
            y="0"
            width="300"
            height="300"
            patternUnits="userSpaceOnUse"
          >
            {/* Stethoscope icon — SVG path */}
            <g transform="translate(30, 40) scale(0.7)" opacity="0.6">
              <circle cx="12" cy="6" r="4" fill="none" stroke="#0F4C5C" strokeWidth="1.5"/>
              <path d="M8 6H4a2 2 0 0 0-2 2v6a6 6 0 0 0 12 0V8a2 2 0 0 0-2-2h-4" fill="none" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="3" fill="none" stroke="#0F4C5C" strokeWidth="1.5"/>
            </g>

            {/* Pill icon — SVG path */}
            <g transform="translate(190, 80) scale(0.65)" opacity="0.6">
              <rect x="3" y="9" width="18" height="6" rx="3" fill="none" stroke="#0F4C5C" strokeWidth="1.5" transform="rotate(-45 12 12)"/>
              <line x1="9" y1="15" x2="15" y2="9" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round"/>
            </g>

            {/* Heartbeat / ECG line */}
            <g transform="translate(100, 180)" opacity="0.6">
              <path
                d="M0 12 L8 12 L12 2 L18 22 L24 2 L30 22 L34 12 L44 12"
                fill="none"
                stroke="#0F4C5C"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Medical cross */}
            <g transform="translate(230, 210) scale(0.6)" opacity="0.6">
              <rect x="9" y="3" width="6" height="18" rx="1" fill="none" stroke="#0F4C5C" strokeWidth="1.5"/>
              <rect x="3" y="9" width="18" height="6" rx="1" fill="none" stroke="#0F4C5C" strokeWidth="1.5"/>
            </g>

            {/* Syringe icon */}
            <g transform="translate(50, 220) scale(0.6)" opacity="0.6">
              <line x1="5" y1="19" x2="19" y2="5" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 4l2 2-9.5 9.5-2-2z" fill="none" stroke="#0F4C5C" strokeWidth="1.5" strokeLinejoin="round"/>
              <line x1="9" y1="15" x2="5" y2="19" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
          </pattern>
        </defs>

        {/* Diagonal lines layer */}
        <rect
          width="100%"
          height="100%"
          fill="url(#diagonal-lines)"
          opacity="0.1"
          className=""
        />

        {/* Medical icons layer */}
        <rect
          width="100%"
          height="100%"
          fill="url(#medical-icons)"
          opacity="0.15"
          className=""
        />
      </svg>
    </div>
  );
}
