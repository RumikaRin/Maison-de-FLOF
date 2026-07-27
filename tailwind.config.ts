import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
// @ts-expect-error Tailwind does not expose a public type for this internal helper.
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-noto)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
        bromise: ["var(--font-bromise)", "serif"],
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
        jotun: {
          ivory: "#FAF9F6",
          "ivory-50": "#FDFCFA",
          "ivory-100": "#F7F5F0",
          "ivory-200": "#EDE9E0",
          teal: "#007B8A",
          "teal-dark": "#005A66",
          "teal-light": "#009BAD",
          yellow: "#F9B000",
          "yellow-light": "#FFC940",
        },
        /* Atelier Editorial — the locked system. See design.md.
           Keys are namespaced `atelier` so addVariablesForColors emits
           `--atelier-paper: var(--fl-paper)` rather than a self-reference. */
        atelier: {
          paper: "var(--fl-paper)",
          "paper-2": "var(--fl-paper-2)",
          "paper-3": "var(--fl-paper-3)",
          espresso: "var(--fl-espresso)",
          ink: "var(--fl-ink)",
          "ink-2": "var(--fl-ink-2)",
          "ink-3": "var(--fl-ink-3)",
          "on-dark": "var(--fl-on-dark)",
          rule: "var(--fl-rule)",
          "rule-strong": "var(--fl-rule-strong)",
          "rule-on-dark": "var(--fl-rule-on-dark)",
          accent: "var(--fl-accent)",
          "accent-hover": "var(--fl-accent-hover)",
          "accent-ink": "var(--fl-accent-ink)",
          focus: "var(--fl-focus)",
          danger: "var(--fl-danger)",
          success: "var(--fl-success)",
          sage: "var(--fl-drench-sage)",
          clay: "var(--fl-drench-clay)",
          slate: "var(--fl-drench-slate)",
          ochre: "var(--fl-drench-ochre)",
        },
        warm: {
          50: "#FDFCFA",
          100: "#FAF8F4",
          150: "#F6F3ED",
          200: "#F3EFE8",
          250: "#ECE8DF",
          300: "#E8E2D8",
          350: "#D8CFC2",
          400: "#C9BFB0",
          450: "#B8AC9D",
          500: "#A89B8A",
          550: "#998C7C",
          600: "#8A7D6E",
          650: "#7A6E60",
          700: "#6B5F52",
          750: "#5C5145",
          800: "#4D4339",
          850: "#3E352B",
          900: "#2F2822",
          950: "#1A1510",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        /* Atelier: surfaces are effectively square. See design.md § Shape. */
        surface: "var(--fl-radius-surface)",
        control: "var(--fl-radius-control)",
        swatch: "var(--fl-radius-swatch)",
        /* Filter chips and the cart count badge only. */
        "fl-pill": "var(--fl-radius-pill)",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
        /* Atelier 4-point scale. globals.css declares the values. */
        "fl-3xs": "var(--fl-space-3xs)",
        "fl-2xs": "var(--fl-space-2xs)",
        "fl-xs": "var(--fl-space-xs)",
        "fl-sm": "var(--fl-space-sm)",
        "fl-md": "var(--fl-space-md)",
        "fl-lg": "var(--fl-space-lg)",
        "fl-xl": "var(--fl-space-xl)",
        "fl-2xl": "var(--fl-space-2xl)",
        "fl-3xl": "var(--fl-space-3xl)",
        "fl-4xl": "var(--fl-space-4xl)",
      },
      fontSize: {
        /* Atelier type scale. 14px is the hard floor for customer-facing body. */
        "fl-2xs": ["var(--fl-text-2xs)", { lineHeight: "1.3" }],
        "fl-xs": ["var(--fl-text-xs)", { lineHeight: "1.45" }],
        "fl-sm": ["var(--fl-text-sm)", { lineHeight: "1.55" }],
        "fl-md": ["var(--fl-text-md)", { lineHeight: "1.6" }],
        "fl-lg": ["var(--fl-text-lg)", { lineHeight: "1.6" }],
        "fl-xl": ["var(--fl-text-xl)", { lineHeight: "1.4" }],
        "fl-2xl": ["var(--fl-text-2xl)", { lineHeight: "1.25" }],
        "fl-3xl": ["var(--fl-text-3xl)", { lineHeight: "1.1" }],
        "fl-display-s": ["var(--fl-display-s)", { lineHeight: "1.04" }],
        "fl-display": ["var(--fl-display)", { lineHeight: "0.98" }],
      },
      transitionDuration: {
        "fl-fast": "160ms",
        "fl-base": "240ms",
        "fl-slow": "360ms",
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
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(24px)", filter: "blur(4px)" },
          to: { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in-up": "fadeInUp 0.7s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        aurora: "aurora 60s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.32, 0.72, 0, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fl-out": "var(--fl-ease-out)",
        "fl-in-out": "var(--fl-ease-in-out)",
      },
    },
  },
  plugins: [tailwindcssAnimate, addVariablesForColors],
};

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }: any) {
  const allColors = flattenColorPalette(theme("colors"));
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}

export default config;
