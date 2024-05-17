import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "rgb(229 231 235 / 0.1)",
        input: "var(--tg-theme-hint-color)",
        ring: "var(--tg-theme-hint-color)",
        background: "var(--tg-theme-background-color)",
        foreground: "var(--tg-theme-text-color)",
        primary: {
          DEFAULT: "var(--tg-theme-button-color)",
          foreground: "var(--tg-theme-button-text-color)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--tg-theme-destructive-text-color)",
          foreground: "var(--tg-theme-text-color)",
        },
        muted: {
          DEFAULT: "var(--tg-theme-hint-color)",
          foreground: "var(--tg-theme-hint-color)",
        },
        accent: {
          DEFAULT: "var(--tg-theme-button-color)",
          foreground: "var(--tg-theme-button-text-color)",
        },
        popover: {
          DEFAULT: "var(--tg-theme-secondary-bg-color)",
          foreground: "var(--tg-theme-text-color)",
        },
        card: {
          DEFAULT: "var(--tg-theme-secondary-bg-color)",
          foreground: "var(--tg-theme-text-color)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
