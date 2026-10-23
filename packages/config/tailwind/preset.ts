import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const color = (name: string) => `hsl(var(--${name}) / <alpha-value>)`

const proseColors = {
  color: 'hsl(var(--foreground))',
  a: {
    color: 'hsl(var(--primary))',
    '&:hover': { color: 'hsl(var(--primary))', textDecoration: 'underline' },
  },
  'h1, h2, h3, h4, strong, code': { color: 'hsl(var(--foreground))' },
}

export default {
  darkMode: ['class'],
  content: [],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: color('background'),
        foreground: color('foreground'),
        card: { DEFAULT: color('card'), foreground: color('card-foreground') },
        popover: {
          DEFAULT: color('popover'),
          foreground: color('popover-foreground'),
        },
        primary: {
          DEFAULT: color('primary'),
          foreground: color('primary-foreground'),
        },
        secondary: {
          DEFAULT: color('secondary'),
          foreground: color('secondary-foreground'),
        },
        muted: { DEFAULT: color('muted'), foreground: color('muted-foreground') },
        accent: { DEFAULT: color('accent'), foreground: color('accent-foreground') },
        destructive: {
          DEFAULT: color('destructive'),
          foreground: color('destructive-foreground'),
        },
        border: color('border'),
        input: color('input'),
        ring: color('ring'),
        chart: {
          '1': color('chart-1'),
          '2': color('chart-2'),
          '3': color('chart-3'),
          '4': color('chart-4'),
          '5': color('chart-5'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      typography: {
        DEFAULT: { css: proseColors },
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [animate, typography],
} satisfies Config
