/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // If you're using the `app` directory:
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      gridTemplateColumns: {
        '70/30': '70% 28%',
    },
  },
  plugins: [],
}
};

export default tailwindConfig;
