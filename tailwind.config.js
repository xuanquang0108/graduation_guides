/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#B09DD6",
        ink: "#2a1260",
        brand: "#7335e8",
        hero: "#5b149c",
        lilac: "#d9c9ff",
        signal: "#dfff57",
        mist: "#6d6380",
      },
      fontFamily: {
        display: ["var(--font-archivo)", "sans-serif"],
        archivo: ["var(--font-archivo)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        custom: ["var(--font-nova)", "sans-serif"],
      },
      minHeight: {
        svh: "100svh",
      },
    },
  },
  plugins: [],
};
