/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef1fb",
          100: "#dfe5f7",
          200: "#c3cdef",
          300: "#9daae2",
          400: "#7484d3",
          500: "#5566c4",
          600: "#4453b0",
          700: "#384592",
          800: "#2f3976",
          900: "#283060",
        },
        // Soft, eye-friendly page canvas behind white cards.
        canvas: "#f4f6fa",
        // Deep navy used by the dashboard sidebar.
        sidebar: {
          DEFAULT: "#0f172a",
          hover: "#1e293b",
          border: "#1e293b",
          muted: "#94a3b8",
        },
        ink: "#0f172a",
        // Vivid secondary accent for the AI-feature badge/glow/FABs (bolder than the muted brand scale).
        accent: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        card: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 2px 8px -2px rgb(15 23 42 / 0.06)",
        pop: "0 10px 30px -8px rgb(15 23 42 / 0.18), 0 2px 6px -2px rgb(15 23 42 / 0.08)",
        glow: "0 0 0 1px rgb(99 102 241 / 0.15), 0 4px 24px -4px rgb(236 72 153 / 0.35)",
        fab: "0 8px 24px -6px rgb(15 23 42 / 0.35), 0 2px 8px -2px rgb(15 23 42 / 0.2)",
      },
      backgroundImage: {
        "ai-gradient": "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
      },
    },
  },
};
