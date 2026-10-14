import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F7F5EF",
        charcoal: { DEFAULT: "#20231F", soft: "#2B2F2A", line: "#3A3F38" },
        brand: { DEFAULT: "#F97316", dark: "#EA580C", soft: "#FFF1E6" },
        line: "#E7E3D8",
        ink: { DEFAULT: "#1F2420", muted: "#6B7068" },
        success: { DEFAULT: "#16A34A", soft: "#E8F6EC" },
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      boxShadow: { card: "0 1px 2px rgba(32,35,31,0.05), 0 1px 3px rgba(32,35,31,0.04)" },
      keyframes: {
        "toast-in": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: { "toast-in": "toast-in .2s ease-out", "fade-in": "fade-in .15s ease-out" },
    },
  },
  plugins: [],
};
export default config;
