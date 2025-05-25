/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        secondary: "#9333EA",
        error: "#FF0D0D",
        dark: "#1e1e1e",
        background:
          "rgba(var(--color-background, 249, 250, 251), <alpha-value>)", // Default to #F9FAFB
      },
    },
  },
  plugins: [],
};
