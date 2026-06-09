import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#05070A",
        panel: "#12161C",
        "panel-alt": "#1A1F27",
        grid: "#1E2630",
        border: "#2A333D",
        accent: {
          DEFAULT: "#39FF14",
          dim: "#1F8A0E",
        },
        warn: "#FF8A00",
        danger: "#FF3B30",
        info: "#2FB8FF",
        "text-primary": "#E6F0E8",
        "text-muted": "#7C8A93",
      },
      fontFamily: {
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "JetBrains Mono",
          "Share Tech Mono",
          "monospace",
        ],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 8px rgba(57,255,20,0.35)",
        "glow-warn": "0 0 8px rgba(255,138,0,0.40)",
        "glow-danger": "0 0 8px rgba(255,59,48,0.45)",
      },
      keyframes: {
        blink: {
          "50%": { opacity: "0.35" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        blink: "blink 1.2s step-start infinite",
        scan: "scan 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
