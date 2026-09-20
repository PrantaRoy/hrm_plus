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
      },
    },
  },
};
