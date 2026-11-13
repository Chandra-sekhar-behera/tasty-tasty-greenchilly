// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }



/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#08140e",
        forest: "#11261c",
        heritage: "#183627",
        lime: {
          DEFAULT: "#8bcb35",
          hover: "#9ae03b",
        },
        ivory: "#f4f6f0",
        charcoal: "#121815",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in-up": "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in-left": "fadeInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in-right": "fadeInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spin-slow": "spin 28s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInLeft: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        fadeInRight: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
}