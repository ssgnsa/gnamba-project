/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f9f5",
          100: "#e6f1e5",
          200: "#cfe3cc",
          300: "#a7cba0",
          400: "#79ac70",
          500: "#4e8a46",
          600: "#3d6f37",
          700: "#31592d",
          800: "#284824",
          900: "#213c1f",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
