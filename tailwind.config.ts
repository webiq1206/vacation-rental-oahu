import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Bronze color scale - Luxury metallic system
        bronze: {
          50: "var(--bronze-50)",
          100: "var(--bronze-100)",
          200: "var(--bronze-200)",
          300: "var(--bronze-300)",
          400: "var(--bronze-400)",
          500: "var(--bronze-500)",
          600: "var(--bronze-600)",
          700: "var(--bronze-700)",
          800: "var(--bronze-800)",
          900: "var(--bronze-900)",
          950: "var(--bronze-950)",
        },
        // Tropical color additions inspired by the mural
        coral: {
          50: "hsl(5 84% 97%)",
          100: "hsl(5 84% 94%)",
          200: "hsl(5 84% 86%)",
          300: "hsl(5 84% 77%)",
          400: "hsl(5 84% 67%)",
          500: "hsl(5 84% 60%)",
          600: "hsl(5 84% 53%)",
          700: "hsl(5 84% 46%)",
          800: "hsl(5 84% 39%)",
          900: "hsl(5 84% 32%)",
        },
        emerald: {
          50: "hsl(167 85% 97%)",
          100: "hsl(167 85% 94%)",
          200: "hsl(167 85% 86%)",
          300: "hsl(167 85% 71%)",
          400: "hsl(167 85% 56%)",
          500: "hsl(167 85% 41%)",
          600: "hsl(167 85% 34%)",
          700: "hsl(167 85% 27%)",
          800: "hsl(167 85% 22%)",
          900: "hsl(167 85% 18%)",
        },
        ocean: {
          50: "hsl(187 85% 97%)",
          100: "hsl(187 85% 94%)",
          200: "hsl(187 85% 86%)",
          300: "hsl(187 85% 71%)",
          400: "hsl(187 85% 53%)",
          500: "hsl(187 85% 46%)",
          600: "hsl(187 85% 39%)",
          700: "hsl(187 85% 32%)",
          800: "hsl(187 85% 25%)",
          900: "hsl(187 85% 20%)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        'luxury-xs': ['var(--text-xs)', 'var(--leading-normal)'],
        'luxury-sm': ['var(--text-sm)', 'var(--leading-normal)'],
        'luxury-base': ['var(--text-base)', 'var(--leading-normal)'],
        'luxury-lg': ['var(--text-lg)', 'var(--leading-relaxed)'],
        'luxury-xl': ['var(--text-xl)', 'var(--leading-relaxed)'],
        'luxury-2xl': ['var(--text-2xl)', 'var(--leading-snug)'],
        'luxury-3xl': ['var(--text-3xl)', 'var(--leading-tight)'],
        'luxury-4xl': ['var(--text-4xl)', 'var(--leading-tight)'],
        'luxury-5xl': ['var(--text-5xl)', 'var(--leading-none)'],
        'luxury-6xl': ['var(--text-6xl)', 'var(--leading-none)'],
      },
      letterSpacing: {
        'luxury-tighter': 'var(--tracking-tighter)',
        'luxury-tight': 'var(--tracking-tight)',
        'luxury-normal': 'var(--tracking-normal)',
        'luxury-wide': 'var(--tracking-wide)',
        'luxury-wider': 'var(--tracking-wider)',
        'luxury-widest': 'var(--tracking-widest)',
        'luxury-elegant': 'var(--tracking-luxury)',
        'luxury-paradise': 'var(--tracking-paradise)',
      },
      spacing: {
        'section-mobile': 'var(--section-padding-mobile)',
        'section-mobile-lg': 'var(--section-padding-mobile-lg)',
        'section-desktop': 'var(--section-padding-desktop)',
        'section-desktop-lg': 'var(--section-padding-desktop-lg)',
        'container-mobile': 'var(--container-padding-mobile)',
        'container-tablet': 'var(--container-padding-tablet)',
        'container-desktop': 'var(--container-padding-desktop)',
        'touch-target': 'var(--touch-target-min)',
        'touch-optimal': 'var(--touch-target-optimal)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        shimmer: {
          "0%": {
            "background-position": "-200% 0",
          },
          "100%": {
            "background-position": "200% 0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
      backgroundImage: {
        'tropical-gradient': 'linear-gradient(135deg, hsl(167 85% 41%) 0%, hsl(187 85% 53%) 50%, hsl(5 84% 67%) 100%)',
        'coral-gradient': 'linear-gradient(135deg, hsl(5 84% 67%) 0%, hsl(5 84% 75%) 100%)',
        'ocean-gradient': 'linear-gradient(135deg, hsl(187 85% 53%) 0%, hsl(167 85% 41%) 100%)',
        'emerald-gradient': 'linear-gradient(135deg, hsl(160 84% 39%) 0%, hsl(167 85% 41%) 100%)',
      },
      aspectRatio: {
        '1/1': '1 / 1',
        '3/2': '3 / 2',
        '4/3': '4 / 3',
        '16/9': '16 / 9',
        '21/9': '21 / 9',
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
