import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F4C5C",
          hover: "#0A3A47",
          light: "lab(29.2508 -14.7252 -15.1858 / 0.2)",
          muted: "lab(29.2508 -14.7252 -15.1858 / 0.1)",
          bg: "lab(29.2508 -14.7252 -15.1858 / 0.08)",
        },
        "primary-hover": "#0A3A47",
        brand: "#00b495",
        background: "#F4F3EE",
        ink: {
          DEFAULT: "#1E1B4B", // Deep indigo for headings
          soft: "#4B5563", // Gray for body
          muted: "#9CA3AF",
        },
        surface: {
          DEFAULT: "#F9FAFB",
          cream: "#FDF4E7",
          lavender: "#EDE9F7",
          overlay: "lab(9.05128 1.17788 1.97037 / 0.03)",
        },
        accent: {
          purple: "#826AEE", // Mutmiz main purple
          lavender: "#E0D4FF", // Soft purple background
          soft: "#F3F0FF", // Very light purple
          pink: "#FFD6E8", // Accent pink from Mutmiz
          "purple-strong": "#6B4EE6",
        },
        text: {
          primary: "#1C1917",
          secondary: "#78716C",
          muted: "#78716C",
        },
        border: {
          DEFAULT: "rgba(0,0,0,0.1)",
          light: "lab(29.2508 -14.7252 -15.1858 / 0.1)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-figtree)",
          "Figtree",
          "sans-serif",
        ],
        serif: [
          "var(--font-figtree)",
          "Figtree",
          "sans-serif",
        ],
        display: [
          "var(--font-figtree)",
          "Figtree",
          "sans-serif",
        ],
        urdu: [
          "var(--font-baloo-urdu)",
          "Baloo Bhai 2",
          "cursive",
        ],
        hedvig: [
          "var(--font-figtree)",
          "Figtree",
          "sans-serif",
        ],
        inter: [
          "var(--font-figtree)",
          "Figtree",
          "sans-serif",
        ],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
