import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Emergency Code Colors - FIXED: Use direct HSL values
        'code-red': 'hsl(0 84% 60%)',
        'code-red-light': 'hsl(0 91% 71%)',
        'code-blue': 'hsl(217 91% 60%)',
        'code-blue-light': 'hsl(217 91% 80%)',
        'code-pink': 'hsl(330 81% 60%)',
        'code-amber': 'hsl(38 92% 50%)',
        'code-orange': 'hsl(25 95% 53%)',
        'code-yellow': 'hsl(47 96% 53%)',
        'code-black': 'hsl(0 0% 9%)',
        'code-white': 'hsl(0 0% 98%)',
        'code-green': 'hsl(142 71% 45%)',
        'code-brown': 'hsl(25 75% 47%)',
        'code-grey': 'hsl(215 16% 47%)',
        'code-purple': 'hsl(262 83% 58%)',

        // Base colors - FIXED: Use direct values instead of CSS variables
        border: "hsl(214.3 31.8% 91.4%)",
        input: "hsl(214.3 31.8% 91.4%)",
        ring: "hsl(217 91% 60%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222.2 84% 4.9%)",
        
        // Primary
        primary: {
          DEFAULT: "hsl(217 91% 60%)",
          foreground: "hsl(0 0% 100%)",
        },

        // Secondary
        secondary: {
          DEFAULT: "hsl(142 71% 45%)",
          foreground: "hsl(0 0% 100%)",
        },

        // Accent
        accent: {
          DEFAULT: "hsl(330 81% 60%)",
          foreground: "hsl(0 0% 100%)",
        },

        // Destructive/Error
        destructive: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "hsl(0 0% 100%)",
        },
        error: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "hsl(0 0% 100%)",
        },

        // Success
        success: {
          DEFAULT: "hsl(142 71% 45%)",
          foreground: "hsl(0 0% 100%)",
        },

        // Warning
        warning: {
          DEFAULT: "hsl(45 93% 47%)",
          foreground: "hsl(0 0% 0%)",
        },

        // Info
        info: {
          DEFAULT: "hsl(217 91% 60%)",
          foreground: "hsl(0 0% 100%)",
        },

        // Muted
        muted: {
          DEFAULT: "hsl(210 40% 96.1%)",
          foreground: "hsl(215.4 16.3% 46.9%)",
        },

        // Card
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222.2 84% 4.9%)",
        },

        // Popover
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222.2 84% 4.9%)",
        },
      },
      borderColor: {
        DEFAULT: "hsl(214.3 31.8% 91.4%)",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
      },
      keyframes: {
        "pulse-emergency": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 20px rgba(239, 68, 68, 0.6)",
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 40px rgba(239, 68, 68, 1)",
          },
        },
        "pulse-critical": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 15px rgba(0, 0, 0, 0.6)",
          },
          "50%": {
            opacity: "0.7",
            boxShadow: "0 0 25px rgba(0, 0, 0, 0.9)",
          },
        },
        "pulse-medical": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.6)",
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 30px rgba(59, 130, 246, 1)",
          },
        },
        "pulse-red": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 20px rgba(239, 68, 68, 0.8)",
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 30px rgba(239, 68, 68, 1)",
          },
        },
        "pulse-blue": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.8)",
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 30px rgba(59, 130, 246, 1)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      animation: {
        "pulse-emergency": "pulse-emergency 1.5s infinite",
        "pulse-critical": "pulse-critical 1s infinite",
        "pulse-medical": "pulse-medical 2s infinite",
        "pulse-red": "pulse-red 2s infinite",
        "pulse-blue": "pulse-blue 2s infinite",
        shimmer: "shimmer 2s infinite",
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;