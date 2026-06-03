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
          hover:   "#0A3A47",
          light:   "rgba(15,76,92,0.15)",
          muted:   "rgba(15,76,92,0.08)",
          bg:      "rgba(15,76,92,0.06)",
        },
        background: "#F9FAFB",
        ink: {
          DEFAULT: "#111827",
          soft:    "#1F2937",
        },
        surface: {
          DEFAULT: "#F3F4F6",
          cream:   "#FAFAFA",
          tint:    "#e6f8f4",
          overlay: "rgba(15,76,92,0.03)",
        },
        accent: {
          purple:        "rgba(139,92,246,0.18)",
          "purple-strong": "#7C3AED",
        },
        text: {
          primary:   "#111827",
          secondary: "#6B7280",
          muted:     "#9CA3AF",
        },
        border: {
          DEFAULT: "rgba(0,0,0,0.1)",
          light:   "rgba(0,0,0,0.06)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter Fallback",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          "var(--font-fraunces)",
          "Fraunces Fallback",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        display: [
          "var(--font-fraunces)",
          "Fraunces Fallback",
          "ui-serif",
          "Georgia",
          "serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
