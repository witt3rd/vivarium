/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    fontFamily: {
      sans: [
        "Space Grotesk",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "sans-serif",
      ],
    },
    extend: {
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }], // 10px
        "3xs": ["0.5rem", { lineHeight: "0.625rem" }], // 8px
      },
      typography: {
        xs: {
          css: {
            fontSize: "0.75rem", // 12px base
            lineHeight: "1rem",
            fontWeight: 300, // Light weight for base text
            h1: {
              fontSize: "1.25rem",
              lineHeight: "1.75rem",
              fontWeight: 500, // Medium weight for headings
            },
            h2: {
              fontSize: "1.125rem",
              lineHeight: "1.5rem",
              fontWeight: 500,
            },
            h3: {
              fontSize: "1rem",
              lineHeight: "1.5rem",
              fontWeight: 500,
            },
            h4: {
              fontSize: "0.875rem",
              lineHeight: "1.25rem",
              fontWeight: 500,
            },
            p: {
              marginTop: "0.75rem",
              marginBottom: "0.75rem",
              fontWeight: 300,
            },
            strong: {
              fontWeight: 500,
            },
            code: {
              fontSize: "0.75rem",
              fontWeight: 400,
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            pre: {
              fontSize: "0.75rem",
              lineHeight: "1rem",
              padding: "0.5rem",
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
              fontWeight: 400,
            },
          },
        },
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
