import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const stone = colors.stone;

export default {
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        extend: {
            colors: {
                // Emberly palette: warm near-black surfaces with an ember-orange accent
                background: "#0B0908",
                foreground: "#fafaf9",
                border: "#292524",
                "border-muted": "#44403c",
                surface: "#1c1917",
                "surface-raised": "#292524",
                "surface-overlay": "#44403c",
                "accent-blue": "#F97316", // legacy token name, now the brand orange
                "foreground-muted": "#a8a29e",
                "foreground-subtle": "#57534e",
                "brand-ice": "#FED7AA",
                "brand-teal": "#FBBF24",
                "brand-sky": "#FB923C",
                "brand-blue": "#F97316",
                "brand-ink": "#0B0908",
                // Cool grays used throughout the UI are remapped to warm stone
                // so they sit with Emberly's palette without touching every class
                zinc: stone,
                slate: stone,
                neutral: stone,
                gray: stone,
            },
            fontFamily: {
                sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
                mono: ["var(--font-geist-mono)", "Menlo", "Monaco", "Courier New", "monospace"],
            },
            animation: {
                "fade-in": "fade-in 0.4s ease-out",
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
} satisfies Config;
