import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00b495",
          hover: "#19bca0",
          light: "#4dcbb5",
          muted: "#b3e9df",
          bg: "#e6f8f4",
        },
        surface: "#E5E5E5",
        text: {
          primary: "#48494C",
          secondary: "#858687",
          muted: "#9E9FA0",
        },
        border: {
          DEFAULT: "#ACACB4",
          light: "#B8B8B9",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
