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
        safe: {
          bottom: "env(safe-area-inset-bottom, 0px)",
          top: "env(safe-area-inset-top, 0px)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
