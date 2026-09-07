/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(214 32% 91%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222 47% 11%)",
        primary: {
          DEFAULT: "hsl(221 83% 53%)",
          foreground: "hsl(0 0% 100%)",
        },
        secondary: {
          DEFAULT: "hsl(210 40% 96%)",
          foreground: "hsl(222 47% 11%)",
        },
        muted: {
          DEFAULT: "hsl(210 40% 96%)",
          foreground: "hsl(215 16% 47%)",
        },
        accent: {
          DEFAULT: "hsl(210 40% 96%)",
          foreground: "hsl(222 47% 11%)",
        },
        destructive: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "hsl(0 0% 100%)",
        },
        success: {
          DEFAULT: "hsl(142 71% 45%)",
          foreground: "hsl(0 0% 100%)",
        },
        warning: {
          DEFAULT: "hsl(38 92% 50%)",
          foreground: "hsl(0 0% 100%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222 47% 11%)",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
};
