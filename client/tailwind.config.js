/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "rgb(var(--c-base-950) / <alpha-value>)",
          900: "rgb(var(--c-base-900) / <alpha-value>)",
          800: "rgb(var(--c-base-800) / <alpha-value>)",
          700: "rgb(var(--c-base-700) / <alpha-value>)",
          600: "rgb(var(--c-base-600) / <alpha-value>)",
          500: "rgb(var(--c-base-500) / <alpha-value>)",
        },
        ink: {
          100: "rgb(var(--c-ink-100) / <alpha-value>)",
          300: "rgb(var(--c-ink-300) / <alpha-value>)",
          500: "rgb(var(--c-ink-500) / <alpha-value>)",
          700: "rgb(var(--c-ink-700) / <alpha-value>)",
        },
        amber: {
          400: "rgb(var(--c-amber-400) / <alpha-value>)",
          500: "rgb(var(--c-amber-500) / <alpha-value>)",
        },
        cyan: {
          400: "rgb(var(--c-cyan-400) / <alpha-value>)",
        },
        emerald: {
          400: "rgb(var(--c-emerald-400) / <alpha-value>)",
        },
        rose: {
          400: "rgb(var(--c-rose-400) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
