import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        carob: {
          50: "#faf6f1",
          100: "#f0e6d5",
          200: "#e0cba8",
          300: "#cdaa76",
          400: "#be8f50",
          500: "#b07a3b",
          600: "#976131",
          700: "#7a4a2a",
          800: "#653d28",
          900: "#553424",
        },
        forest: {
          50: "#f0f9f1",
          100: "#dbf0dd",
          200: "#b9e1be",
          300: "#8bcb94",
          400: "#5baf67",
          500: "#3a9348",
          600: "#2a7637",
          700: "#225e2d",
          800: "#1e4b27",
          900: "#193e21",
        },
        wr: {
          bg: "#0a0a1a",
          card: "#1a1a2e",
          border: "#2a2a3e",
          muted: "#606070",
          green: "#00ff88",
          red: "#ff4444",
          blue: "#3b82f6",
          yellow: "#fbbf24",
        },
      },
    },
  },
  plugins: [],
};
export default config;
