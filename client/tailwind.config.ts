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
        background: "#F4F3EE",
        ink: {
          DEFAULT: "#111111",
          soft: "#1C1917",
        },
        surface: {
          DEFAULT: "#E3EFF2",
          cream: "#FDF4E7",
          lavender: "#EDE9F7",
          overlay: "lab(9.05128 1.17788 1.97037 / 0.03)",
        },
        accent: {
          purple: "lab(61.0331 19.6306 -38.5632 / 0.2)",
          "purple-strong": "lab(61.0331 19.6306 -38.5632)",
        },
        text: {
          primary: "#1C1917",
          secondary: "#78716C",
          muted: "#78716C",
        },
        border: {
          DEFAULT: "lab(29.2508 -14.7252 -15.1858 / 0.2)",
          light: "lab(29.2508 -14.7252 -15.1858 / 0.1)",
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
