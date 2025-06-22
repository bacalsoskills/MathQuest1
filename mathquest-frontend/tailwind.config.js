/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        primary: "#0B081C",
        secondary: "#9333EA",
        error: "#FF0D0D",
        dark: "#1e1e1e",
        background:
          "rgba(var(--color-background, 249, 250, 251), <alpha-value>)", // Default to #F9FAFB
        "primary-gradient":
          "linear-gradient(180deg, #18C8FF 100%, #933FFE 100%)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        heading: ["Montserrat", "sans-serif"],
        body: ["Open Sans", "sans-serif"],
      },
      screens: {
        xl: "1280px",
        "2xl": "1400px",
        "3xl": "1600px",
        "4xl": "1920px",
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
