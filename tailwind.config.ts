import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#F5A000",
          "orange-dark": "#D48A00",
          "orange-light": "#FFB81C",
          dark: "#1A1A1A",
          gray: "#F5F5F5",
          "gray-mid": "#E0E0E0",
          "gray-text": "#666666",
        },
      },
    },
  },
  plugins: [],
};

export default config;
