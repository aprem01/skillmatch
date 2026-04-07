import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SkillMatch employer brand — teal/cyan, professional but warm
        teal: {
          light: "#E0F7FA",
          DEFAULT: "#00BFA5",
          dark: "#00A08A",
        },
        coolgray: {
          50: "#F5F5F5",
          100: "#EEEEEE",
          200: "#E0E0E0",
        },
        amber: {
          light: "#FFF8E1",
          DEFAULT: "#F5A623",
          dark: "#D4901E",
        },
        green: {
          light: "#E8F5E9",
          DEFAULT: "#4CAF50",
          dark: "#388E3C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "pill-pop": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.12)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pill-pop": "pill-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
