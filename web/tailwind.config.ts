import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(224, 71%, 4%)",
        foreground: "hsl(213, 31%, 91%)",
        card: {
          DEFAULT: "hsl(224, 71%, 7%)",
          foreground: "hsl(213, 31%, 91%)",
        },
        border: "hsl(216, 34%, 17%)",
        primary: {
          DEFAULT: "hsl(142, 71%, 45%)", // Bio emerald green
          foreground: "hsl(144, 100%, 97%)",
        },
        accent: {
          DEFAULT: "hsl(199, 89%, 48%)", // Hydro cyan
          foreground: "hsl(200, 100%, 97%)",
        },
        warning: "hsl(38, 92%, 50%)",
        destructive: "hsl(0, 84%, 60%)",
      },
    },
  },
  plugins: [],
};
export default config;

