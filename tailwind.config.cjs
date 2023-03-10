/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors({ colors }) {
        return {
          primary: "#246A88",
          positive: colors.green["700"],
          "positive-hover": colors.green["800"],
          "positive-content": colors.white,
          danger: colors.rose["700"],
          "danger-hover": colors.rose["800"],
          "danger-content": colors.rose["50"],
          info: colors.sky,
          warning: colors.amber,
        };
      },
      boxShadow: {
        outline: "inset 0 0 0 4px rgb(0 0 0 / 25%)",
      },
    },
  },
  plugins: [],
};
