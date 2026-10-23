/**
 * Built-in theme presets and quick hue swatches shown in the appearance panel.
 */

export interface ColorConfig {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
}

// Emberly default: warm near-black surfaces with an ember-orange accent
export const DEFAULT_COLORS: ColorConfig = {
  background: '20 14% 4%',
  foreground: '30 20% 96%',
  card: '20 12% 6.5%',
  cardForeground: '30 20% 96%',
  popover: '20 12% 7%',
  popoverForeground: '30 20% 96%',
  primary: '24.6 95% 53.1%',
  primaryForeground: '20 30% 8%',
  secondary: '20 10% 13%',
  secondaryForeground: '30 20% 96%',
  muted: '20 10% 13%',
  mutedForeground: '25 8% 64%',
  accent: '20 10% 14%',
  accentForeground: '30 20% 96%',
  destructive: '0 72% 51%',
  destructiveForeground: '0 0% 98%',
  border: '20 9% 15%',
  input: '20 9% 17%',
  ring: '24.6 95% 53.1%',
}

// The pre-2.7 default (navy surfaces, near-white primary). Instances and users
// still storing exactly this palette are moved onto DEFAULT_COLORS.
const LEGACY_DEFAULT_COLORS: Pick<
  ColorConfig,
  'background' | 'primary' | 'border'
> = {
  background: '222.2 84% 4.9%',
  primary: '210 40% 98%',
  border: '217.2 32.6% 17.5%',
}

export function upgradeLegacyDefaultColors<
  T extends Record<string, string> | null | undefined,
>(colors: T): T | Record<string, string> {
  if (
    colors &&
    colors.background === LEGACY_DEFAULT_COLORS.background &&
    colors.primary === LEGACY_DEFAULT_COLORS.primary &&
    colors.border === LEGACY_DEFAULT_COLORS.border
  ) {
    return { ...DEFAULT_COLORS }
  }
  return colors
}

const STRANGER_THINGS_THEME: ColorConfig = {
  background: '232 36% 6%',
  foreground: '210 40% 96%',
  card: '230 32% 8%',
  cardForeground: '210 40% 96%',
  popover: '230 32% 8%',
  popoverForeground: '210 40% 96%',
  primary: '354 82% 52%',
  primaryForeground: '210 40% 98%',
  secondary: '230 28% 16%',
  secondaryForeground: '210 40% 96%',
  muted: '232 20% 24%',
  mutedForeground: '215 16% 72%',
  accent: '197 92% 54%',
  accentForeground: '222 47% 12%',
  destructive: '0 65% 46%',
  destructiveForeground: '210 40% 98%',
  border: '230 22% 18%',
  input: '230 22% 18%',
  ring: '354 82% 56%',
}

const UPSIDE_DOWN_THEME: ColorConfig = {
  background: '270 30% 4%',
  foreground: '280 15% 85%',
  card: '270 28% 6%',
  cardForeground: '280 15% 85%',
  popover: '270 28% 6%',
  popoverForeground: '280 15% 85%',
  primary: '354 70% 45%',
  primaryForeground: '280 15% 95%',
  secondary: '270 25% 12%',
  secondaryForeground: '280 15% 85%',
  muted: '270 20% 18%',
  mutedForeground: '280 10% 60%',
  accent: '200 60% 35%',
  accentForeground: '280 15% 95%',
  destructive: '0 55% 40%',
  destructiveForeground: '280 15% 95%',
  border: '270 20% 14%',
  input: '270 20% 14%',
  ring: '354 70% 50%',
}

const TALES_FROM_86_THEME: ColorConfig = {
  background: '232 38% 5%',
  foreground: '52 90% 94%',
  card: '232 34% 8%',
  cardForeground: '52 90% 94%',
  popover: '232 34% 8%',
  popoverForeground: '52 90% 94%',
  primary: '326 96% 58%',
  primaryForeground: '232 38% 8%',
  secondary: '38 98% 54%',
  secondaryForeground: '232 38% 8%',
  muted: '232 26% 16%',
  mutedForeground: '80 34% 74%',
  accent: '78 92% 50%',
  accentForeground: '232 38% 8%',
  destructive: '0 80% 52%',
  destructiveForeground: '210 40% 98%',
  border: '232 24% 18%',
  input: '232 24% 18%',
  ring: '326 96% 62%',
}

const CHRISTMAS_THEME: ColorConfig = {
  background: '140 40% 6%',
  foreground: '210 40% 98%',
  card: '140 36% 8%',
  cardForeground: '210 40% 98%',
  popover: '140 36% 8%',
  popoverForeground: '210 40% 98%',
  primary: '0 75% 48%',
  primaryForeground: '210 40% 98%',
  secondary: '45 90% 45%',
  secondaryForeground: '210 40% 98%',
  muted: '140 30% 18%',
  mutedForeground: '215 20% 65.1%',
  accent: '30 90% 48%',
  accentForeground: '222 47% 12%',
  destructive: '0 65% 46%',
  destructiveForeground: '210 40% 98%',
  border: '140 30% 14%',
  input: '140 30% 14%',
  ring: '45 90% 60%',
}

const PRIDE_THEME: ColorConfig = {
  background: '220 18% 10%',
  foreground: '210 40% 98%',
  card: '220 18% 12%',
  cardForeground: '210 40% 98%',
  popover: '220 18% 12%',
  popoverForeground: '210 40% 98%',
  primary: '300 82% 55%',
  primaryForeground: '210 40% 98%',
  secondary: '50 95% 48%',
  secondaryForeground: '210 40% 98%',
  muted: '200 90% 16%',
  mutedForeground: '215 20% 65.1%',
  accent: '0 85% 48%',
  accentForeground: '210 40% 98%',
  destructive: '345 80% 45%',
  destructiveForeground: '210 40% 98%',
  border: '220 18% 14%',
  input: '220 18% 14%',
  ring: '300 82% 60%',
}

const EVERY_CHILD_THEME: ColorConfig = {
  background: '18 40% 6%',
  foreground: '210 40% 98%',
  card: '18 36% 8%',
  cardForeground: '210 40% 98%',
  popover: '18 36% 8%',
  popoverForeground: '210 40% 98%',
  primary: '18 85% 48%',
  primaryForeground: '210 40% 98%',
  secondary: '45 90% 45%',
  secondaryForeground: '210 40% 98%',
  muted: '18 30% 18%',
  mutedForeground: '215 20% 65.1%',
  accent: '200 90% 48%',
  accentForeground: '210 40% 98%',
  destructive: '0 65% 46%',
  destructiveForeground: '210 40% 98%',
  border: '18 30% 14%',
  input: '18 30% 14%',
  ring: '18 85% 60%',
}

const REMEMBRANCE_THEME: ColorConfig = {
  background: '220 20% 8%',
  foreground: '210 40% 98%',
  card: '220 18% 10%',
  cardForeground: '210 40% 98%',
  popover: '220 18% 10%',
  popoverForeground: '210 40% 98%',
  primary: '345 82% 45%',
  primaryForeground: '210 40% 98%',
  secondary: '210 32% 18%',
  secondaryForeground: '210 40% 98%',
  muted: '220 20% 16%',
  mutedForeground: '215 20% 65.1%',
  accent: '45 90% 45%',
  accentForeground: '210 40% 98%',
  destructive: '345 82% 45%',
  destructiveForeground: '210 40% 98%',
  border: '220 15% 12%',
  input: '220 15% 12%',
  ring: '345 82% 56%',
}

const RETRO_ARCADE_THEME: ColorConfig = {
  background: '280 25% 8%',
  foreground: '210 40% 98%',
  card: '280 30% 10%',
  cardForeground: '210 40% 98%',
  popover: '280 30% 10%',
  popoverForeground: '210 40% 98%',
  primary: '300 100% 50%',
  primaryForeground: '280 25% 8%',
  secondary: '45 100% 50%',
  secondaryForeground: '280 25% 8%',
  muted: '280 20% 20%',
  mutedForeground: '215 20% 65.1%',
  accent: '0 100% 50%',
  accentForeground: '280 25% 8%',
  destructive: '0 100% 50%',
  destructiveForeground: '210 40% 98%',
  border: '280 20% 16%',
  input: '280 20% 16%',
  ring: '300 100% 60%',
}

const CYBERPUNK_NEON_THEME: ColorConfig = {
  background: '270 20% 5%',
  foreground: '210 40% 98%',
  card: '270 25% 8%',
  cardForeground: '210 40% 98%',
  popover: '270 25% 8%',
  popoverForeground: '210 40% 98%',
  primary: '180 100% 45%',
  primaryForeground: '270 20% 5%',
  secondary: '300 100% 48%',
  secondaryForeground: '270 20% 5%',
  muted: '270 20% 18%',
  mutedForeground: '215 20% 65.1%',
  accent: '0 100% 50%',
  accentForeground: '270 20% 5%',
  destructive: '0 100% 50%',
  destructiveForeground: '210 40% 98%',
  border: '270 20% 14%',
  input: '270 20% 14%',
  ring: '180 100% 55%',
}

const VAPORWAVE_THEME: ColorConfig = {
  background: '300 40% 8%',
  foreground: '210 40% 98%',
  card: '300 35% 10%',
  cardForeground: '210 40% 98%',
  popover: '300 35% 10%',
  popoverForeground: '210 40% 98%',
  primary: '280 80% 50%',
  primaryForeground: '300 40% 8%',
  secondary: '40 100% 50%',
  secondaryForeground: '300 40% 8%',
  muted: '300 30% 20%',
  mutedForeground: '215 20% 65.1%',
  accent: '200 100% 50%',
  accentForeground: '300 40% 8%',
  destructive: '20 100% 50%',
  destructiveForeground: '210 40% 98%',
  border: '300 30% 16%',
  input: '300 30% 16%',
  ring: '280 80% 60%',
}

const DARK_MATRIX_THEME: ColorConfig = {
  background: '120 40% 5%',
  foreground: '120 100% 90%',
  card: '120 35% 7%',
  cardForeground: '120 100% 90%',
  popover: '120 35% 7%',
  popoverForeground: '120 100% 90%',
  primary: '120 100% 50%',
  primaryForeground: '120 40% 5%',
  secondary: '220 30% 15%',
  secondaryForeground: '120 100% 90%',
  muted: '120 30% 16%',
  mutedForeground: '120 80% 70%',
  accent: '60 100% 50%',
  accentForeground: '120 40% 5%',
  destructive: '0 100% 45%',
  destructiveForeground: '120 100% 90%',
  border: '120 30% 12%',
  input: '120 30% 12%',
  ring: '120 100% 60%',
}

const NEON_GRID_THEME: ColorConfig = {
  background: '200 30% 6%',
  foreground: '210 40% 98%',
  card: '200 35% 8%',
  cardForeground: '210 40% 98%',
  popover: '200 35% 8%',
  popoverForeground: '210 40% 98%',
  primary: '180 100% 45%',
  primaryForeground: '200 30% 6%',
  secondary: '280 100% 50%',
  secondaryForeground: '200 30% 6%',
  muted: '200 25% 18%',
  mutedForeground: '215 20% 65.1%',
  accent: '60 100% 50%',
  accentForeground: '200 30% 6%',
  destructive: '0 100% 50%',
  destructiveForeground: '210 40% 98%',
  border: '200 25% 14%',
  input: '200 25% 14%',
  ring: '180 100% 55%',
}

const COSMIC_SPACE_THEME: ColorConfig = {
  background: '260 40% 6%',
  foreground: '210 40% 98%',
  card: '260 35% 8%',
  cardForeground: '210 40% 98%',
  popover: '260 35% 8%',
  popoverForeground: '210 40% 98%',
  primary: '270 100% 50%',
  primaryForeground: '260 40% 6%',
  secondary: '280 80% 45%',
  secondaryForeground: '210 40% 98%',
  muted: '260 30% 18%',
  mutedForeground: '215 20% 65.1%',
  accent: '50 100% 50%',
  accentForeground: '260 40% 6%',
  destructive: '0 100% 50%',
  destructiveForeground: '210 40% 98%',
  border: '260 30% 14%',
  input: '260 30% 14%',
  ring: '270 100% 60%',
}

const AURORA_BOREALIS_THEME: ColorConfig = {
  background: '240 40% 6%',
  foreground: '210 40% 98%',
  card: '240 38% 8%',
  cardForeground: '210 40% 98%',
  popover: '240 38% 8%',
  popoverForeground: '210 40% 98%',
  primary: '180 100% 45%',
  primaryForeground: '240 40% 6%',
  secondary: '120 100% 48%',
  secondaryForeground: '240 40% 6%',
  muted: '240 30% 18%',
  mutedForeground: '215 20% 65.1%',
  accent: '300 100% 50%',
  accentForeground: '240 40% 6%',
  destructive: '0 100% 50%',
  destructiveForeground: '210 40% 98%',
  border: '240 30% 14%',
  input: '240 30% 14%',
  ring: '180 100% 55%',
}

const SUNSET_GLOW_THEME: ColorConfig = {
  background: '25 35% 7%',
  foreground: '210 40% 98%',
  card: '25 32% 9%',
  cardForeground: '210 40% 98%',
  popover: '25 32% 9%',
  popoverForeground: '210 40% 98%',
  primary: '35 95% 55%',
  primaryForeground: '25 35% 7%',
  secondary: '280 80% 50%',
  secondaryForeground: '210 40% 98%',
  muted: '25 25% 18%',
  mutedForeground: '215 20% 65.1%',
  accent: '310 90% 50%',
  accentForeground: '25 35% 7%',
  destructive: '0 85% 50%',
  destructiveForeground: '210 40% 98%',
  border: '25 25% 14%',
  input: '25 25% 14%',
  ring: '35 95% 60%',
}

const FOREST_DEEP_THEME: ColorConfig = {
  background: '145 35% 5%',
  foreground: '210 40% 98%',
  card: '145 32% 7%',
  cardForeground: '210 40% 98%',
  popover: '145 32% 7%',
  popoverForeground: '210 40% 98%',
  primary: '135 80% 45%',
  primaryForeground: '145 35% 5%',
  secondary: '200 85% 50%',
  secondaryForeground: '145 35% 5%',
  muted: '145 25% 16%',
  mutedForeground: '215 20% 65.1%',
  accent: '280 70% 50%',
  accentForeground: '145 35% 5%',
  destructive: '0 80% 50%',
  destructiveForeground: '210 40% 98%',
  border: '145 25% 12%',
  input: '145 25% 12%',
  ring: '135 80% 55%',
}

const OCEAN_DEPTH_THEME: ColorConfig = {
  background: '210 40% 5%',
  foreground: '210 40% 98%',
  card: '210 38% 7%',
  cardForeground: '210 40% 98%',
  popover: '210 38% 7%',
  popoverForeground: '210 40% 98%',
  primary: '190 95% 45%',
  primaryForeground: '210 40% 5%',
  secondary: '350 100% 50%',
  secondaryForeground: '210 40% 5%',
  muted: '210 30% 16%',
  mutedForeground: '215 20% 65.1%',
  accent: '50 100% 50%',
  accentForeground: '210 40% 5%',
  destructive: '0 85% 50%',
  destructiveForeground: '210 40% 98%',
  border: '210 30% 12%',
  input: '210 30% 12%',
  ring: '190 95% 55%',
}

const MIDNIGHT_PURPLE_THEME: ColorConfig = {
  background: '270 35% 5%',
  foreground: '210 40% 98%',
  card: '270 33% 7%',
  cardForeground: '210 40% 98%',
  popover: '270 33% 7%',
  popoverForeground: '210 40% 98%',
  primary: '280 100% 55%',
  primaryForeground: '270 35% 5%',
  secondary: '40 95% 50%',
  secondaryForeground: '270 35% 5%',
  muted: '270 25% 18%',
  mutedForeground: '215 20% 65.1%',
  accent: '180 90% 50%',
  accentForeground: '270 35% 5%',
  destructive: '0 90% 50%',
  destructiveForeground: '210 40% 98%',
  border: '270 25% 14%',
  input: '270 25% 14%',
  ring: '280 100% 60%',
}

const SLATE_STONE_THEME: ColorConfig = {
  background: '215 18% 6%',
  foreground: '210 40% 98%',
  card: '215 16% 8%',
  cardForeground: '210 40% 98%',
  popover: '215 16% 8%',
  popoverForeground: '210 40% 98%',
  primary: '200 90% 50%',
  primaryForeground: '215 18% 6%',
  secondary: '320 85% 50%',
  secondaryForeground: '215 18% 6%',
  muted: '215 15% 18%',
  mutedForeground: '215 20% 65.1%',
  accent: '50 90% 50%',
  accentForeground: '215 18% 6%',
  destructive: '0 85% 50%',
  destructiveForeground: '210 40% 98%',
  border: '215 15% 14%',
  input: '215 15% 14%',
  ring: '200 90% 55%',
}

const TROPICAL_BREEZE_THEME: ColorConfig = {
  background: '160 40% 6%',
  foreground: '210 40% 98%',
  card: '160 36% 8%',
  cardForeground: '210 40% 98%',
  popover: '160 36% 8%',
  popoverForeground: '210 40% 98%',
  primary: '170 100% 45%',
  primaryForeground: '160 40% 6%',
  secondary: '45 100% 50%',
  secondaryForeground: '160 40% 6%',
  muted: '160 30% 18%',
  mutedForeground: '215 20% 65.1%',
  accent: '320 90% 50%',
  accentForeground: '160 40% 6%',
  destructive: '0 85% 50%',
  destructiveForeground: '210 40% 98%',
  border: '160 30% 14%',
  input: '160 30% 14%',
  ring: '170 100% 55%',
}

const LAVENDER_DREAM_THEME: ColorConfig = {
  background: '280 25% 8%',
  foreground: '210 40% 98%',
  card: '280 23% 10%',
  cardForeground: '210 40% 98%',
  popover: '280 23% 10%',
  popoverForeground: '210 40% 98%',
  primary: '270 80% 60%',
  primaryForeground: '280 25% 8%',
  secondary: '210 90% 50%',
  secondaryForeground: '280 25% 8%',
  muted: '280 20% 20%',
  mutedForeground: '215 20% 65.1%',
  accent: '30 95% 50%',
  accentForeground: '280 25% 8%',
  destructive: '0 85% 50%',
  destructiveForeground: '210 40% 98%',
  border: '280 20% 16%',
  input: '280 20% 16%',
  ring: '270 80% 65%',
}

export const THEME_PRESETS: Array<{
  name: string
  colors: ColorConfig
  description: string
  category?: 'basic' | 'animated' | 'gaming' | 'seasonal' | 'special'
  isGaming?: boolean
  themeId?: string
  backgroundEffect?: string
  animationSpeed?: string
}> = [
  // Basic themes
  {
    name: 'Default Dark',
    colors: DEFAULT_COLORS,
    description: 'Baseline Emberly palette with balanced contrast.',
    category: 'basic',
    themeId: 'default-dark',
  },
  {
    name: 'Hawkins Neon',
    colors: STRANGER_THINGS_THEME,
    description: 'Stranger Things-inspired deep midnight with neon red + blue.',
    category: 'basic',
    themeId: 'hawkins-neon',
    backgroundEffect: 'glitch',
    animationSpeed: 'slow',
  },
  {
    name: '🙃 The Upside Down',
    colors: UPSIDE_DOWN_THEME,
    description: 'Enter the shadow realm where everything is reversed.',
    category: 'animated',
    isGaming: false,
    themeId: 'upside-down',
    backgroundEffect: 'particles',
    animationSpeed: 'slow',
  },
  {
    name: '📼 Tales from 86',
    colors: TALES_FROM_86_THEME,
    description: 'Retro horror neon inspired by 80s title-card glow gradients.',
    category: 'animated',
    isGaming: false,
    themeId: 'tales-from-86',
    backgroundEffect: 'gradient-shift',
    animationSpeed: 'slow',
  },
  // Seasonal themes
  {
    name: 'Holly Jolly (Christmas)',
    colors: CHRISTMAS_THEME,
    description: 'Festive green + red with gold accents for the holidays.',
    category: 'seasonal',
    themeId: 'holly-jolly',
  },
  // Special cause themes
  {
    name: 'Pride Bright',
    colors: PRIDE_THEME,
    description: 'Vibrant accents inspired by the Pride rainbow.',
    category: 'special',
    themeId: 'pride-bright',
  },
  {
    name: 'Every Child Matters',
    colors: EVERY_CHILD_THEME,
    description:
      'A respectful orange-themed palette to mark awareness and remembrance.',
    category: 'special',
    themeId: 'every-child-matters',
  },
  {
    name: 'Remembrance',
    colors: REMEMBRANCE_THEME,
    description: 'A muted palette with remembrance red highlights.',
    category: 'special',
    themeId: 'remembrance',
  },
  // Gaming themes
  {
    name: '🕹️ Retro Arcade',
    colors: RETRO_ARCADE_THEME,
    description: 'Classic 80s arcade aesthetic with magenta and yellow neon.',
    category: 'gaming',
    isGaming: true,
    themeId: 'retro-arcade',
    backgroundEffect: 'scanlines',
    animationSpeed: 'medium',
  },
  {
    name: '🤖 Cyberpunk Neon',
    colors: CYBERPUNK_NEON_THEME,
    description:
      'Futuristic cyberpunk with cyan and magenta chroma aberration.',
    category: 'gaming',
    isGaming: true,
    themeId: 'cyberpunk-neon',
    backgroundEffect: 'glitch',
    animationSpeed: 'fast',
  },
  {
    name: '💜 Vaporwave',
    colors: VAPORWAVE_THEME,
    description: 'Aesthetic vaporwave with purple, pink, and cyan pastels.',
    category: 'gaming',
    isGaming: false,
    themeId: 'vaporwave',
    backgroundEffect: 'gradient-shift',
    animationSpeed: 'slow',
  },
  {
    name: '💚 Dark Matrix',
    colors: DARK_MATRIX_THEME,
    description: 'The Matrix inspired with green code rain effects.',
    category: 'gaming',
    isGaming: true,
    themeId: 'dark-matrix',
    backgroundEffect: 'matrix',
    animationSpeed: 'slow',
  },
  {
    name: '📊 Neon Grid',
    colors: NEON_GRID_THEME,
    description: 'Grid-based interface with cyan and magenta neon accents.',
    category: 'gaming',
    isGaming: true,
    themeId: 'neon-grid',
    backgroundEffect: 'none',
    animationSpeed: 'medium',
  },
  {
    name: '🌠 Cosmic Space',
    colors: COSMIC_SPACE_THEME,
    description: 'Space exploration theme with purple and gold starfield.',
    category: 'gaming',
    isGaming: true,
    themeId: 'cosmic-space',
    backgroundEffect: 'parallax',
    animationSpeed: 'slow',
  },
  // Animated themes
  {
    name: '🌌 Aurora Borealis',
    colors: AURORA_BOREALIS_THEME,
    description:
      'Northern lights inspired theme with cyan and purple aurora effects.',
    category: 'animated',
    isGaming: false,
    themeId: 'aurora-borealis',
    backgroundEffect: 'aurora',
    animationSpeed: 'slow',
  },
  // Additional animated themes
  {
    name: '🌅 Sunset Glow',
    colors: SUNSET_GLOW_THEME,
    description:
      'Warm sunset palette with gradient orange and deep purple accents.',
    category: 'animated',
    isGaming: false,
    themeId: 'sunset-glow',
    backgroundEffect: 'gradient-shift',
    animationSpeed: 'slow',
  },
  {
    name: '🌲 Forest Deep',
    colors: FOREST_DEEP_THEME,
    description: 'Natural forest theme with deep green and teal accents.',
    category: 'animated',
    isGaming: false,
    themeId: 'forest-deep',
    backgroundEffect: 'particles',
    animationSpeed: 'medium',
  },
  {
    name: '🌊 Ocean Depth',
    colors: OCEAN_DEPTH_THEME,
    description: 'Deep ocean blues with coral and golden accents.',
    category: 'animated',
    isGaming: false,
    themeId: 'ocean-depth',
    backgroundEffect: 'waves',
    animationSpeed: 'slow',
  },
  // Additional gaming themes
  {
    name: '🌙 Midnight Purple',
    colors: MIDNIGHT_PURPLE_THEME,
    description: 'Deep purple gaming aesthetic with golden highlights.',
    category: 'gaming',
    isGaming: true,
    themeId: 'midnight-purple',
    backgroundEffect: 'glitch',
    animationSpeed: 'medium',
  },
  {
    name: '🏔️ Slate Stone',
    colors: SLATE_STONE_THEME,
    description:
      'Minimalist slate and stone palette with cyan and magenta pops.',
    category: 'gaming',
    isGaming: true,
    themeId: 'slate-stone',
    backgroundEffect: 'grid',
    animationSpeed: 'medium',
  },
  {
    name: '🏝️ Tropical Breeze',
    colors: TROPICAL_BREEZE_THEME,
    description: 'Beach vibes with turquoise, gold, and tropical pink.',
    category: 'gaming',
    isGaming: false,
    themeId: 'tropical-breeze',
    backgroundEffect: 'particles',
    animationSpeed: 'medium',
  },
  // Additional special themes
  {
    name: '💜 Lavender Dream',
    colors: LAVENDER_DREAM_THEME,
    description: 'Calming lavender with soft purple and sky blue accents.',
    category: 'special',
    themeId: 'lavender-dream',
    backgroundEffect: 'aurora',
    animationSpeed: 'slow',
  },
]

export const PRESET_HUES = [
  { hue: 222.2, name: 'Midnight Blue', saturation: 84, lightness: 45 },
  { hue: 260, name: 'Royal', saturation: 80, lightness: 45 },
  { hue: 280, name: 'Amethyst', saturation: 75, lightness: 45 },
  { hue: 325, name: 'Rose', saturation: 85, lightness: 45 },
  { hue: 0, name: 'Ruby', saturation: 85, lightness: 45 },
  { hue: 15, name: 'Coral', saturation: 85, lightness: 45 },
  { hue: 22, name: 'Amber', saturation: 90, lightness: 45 },
  { hue: 45, name: 'Marigold', saturation: 95, lightness: 45 },
  { hue: 60, name: 'Lime', saturation: 90, lightness: 48 },
  { hue: 90, name: 'Spring', saturation: 85, lightness: 50 },
  { hue: 120, name: 'Mint', saturation: 80, lightness: 48 },
  { hue: 145, name: 'Emerald', saturation: 75, lightness: 40 },
  { hue: 160, name: 'Teal', saturation: 85, lightness: 42 },
  { hue: 170, name: 'Jade', saturation: 80, lightness: 40 },
  { hue: 190, name: 'Turquoise', saturation: 88, lightness: 46 },
  { hue: 195, name: 'Azure', saturation: 85, lightness: 45 },
  { hue: 210, name: 'Ocean', saturation: 85, lightness: 45 },
  { hue: 240, name: 'Sky', saturation: 80, lightness: 50 },
  { hue: 270, name: 'Purple', saturation: 80, lightness: 48 },
  { hue: 290, name: 'Violet', saturation: 78, lightness: 46 },
  { hue: 310, name: 'Magenta', saturation: 85, lightness: 50 },
  { hue: 340, name: 'Crimson', saturation: 88, lightness: 48 },
]
