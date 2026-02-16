import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#2563eb", dark: "#1d4ed8" },
        accent: { DEFAULT: "#f59e0b", dark: "#d97706" },
      },
    },
  },
  plugins: [],
};

export default config;
