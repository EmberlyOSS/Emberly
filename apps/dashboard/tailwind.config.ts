import preset from '@emberly/config/tailwind'
import type { Config } from 'tailwindcss'

export default {
  presets: [preset],
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx,mdx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'radial-gradient': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
      },
    },
  },
} satisfies Config
