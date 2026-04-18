import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Nunito Sans'", "sans-serif"],
      },
      fontSize: {
        "2xs": ["10px", "1"],
        xs: ["11px", "1"],
        sm: ["12px", "1.2"],
        base: ["14px", "1.5"],
        md: ["16px", "1.5"],
        lg: ["18px", "1.75"],
        xl: ["20px", "1.75"],
        "2xl": ["24px", "2rem"],
        "3xl": ["32px", "1.2"],
        "4xl": ["40px", "1.2"],
        "5xl": ["48px", "1.1"],
      },
      colors: {
        // ── Brand palette (LDP consigna) ────────────────
        mainBg: "#0F0F0F",
        surface: "#161616",
        card: "#1C1C1C",
        "card-2": "#222222",
        input: "#252525",
        sidebar: "#131313",

        // Borders
        border: "#2C2C2C",
        "border-h": "#3C3C3C",

        // Text
        primary: "#F2F2F2",
        secondary: "#B8B8B8",
        muted: "#717171",

        // Brand colors (LDP)
        green: { DEFAULT: "#00E094", dark: "#00C47F", light: "#33E8A8" },
        blue: { DEFAULT: "#0C65D4", dark: "#094FA6", light: "#2E7FE8" },
        purple: { DEFAULT: "#7533FC", dark: "#5E22D6", light: "#8F56FC" },

        // Semantic
        gold: "#E8A838",
        danger: "#F04444",
        warn: "#F0A04B",
        success: "#00E094",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "20px",
        "2xl": "28px",
      },
      animation: {
        shimmer: "shimmer 1.4s infinite",
        "fade-in": "fadeIn 0.2s ease forwards",
        "slide-up": "slideUp 0.25s ease forwards",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-600px 0" },
          "100%": { backgroundPosition: "600px 0" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "glow-green": "0 0 20px rgba(0,224,148,0.15)",
        "glow-blue": "0 0 20px rgba(12,101,212,0.2)",
        "glow-purple": "0 0 20px rgba(117,51,252,0.2)",
        card: "0 2px 8px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [nextui()],
};
export default config;
