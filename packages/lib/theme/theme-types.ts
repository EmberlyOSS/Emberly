/**
 * Enhanced theme system supporting animated and gaming themes
 */

export type ThemeType = 'static' | 'animated' | 'gaming' | 'cyberpunk' | 'retro'

export type BackgroundEffect = 
  | 'none'
  | 'particles'
  | 'gradient-shift'
  | 'waves'
  | 'glitch'
  | 'grid'
  | 'parallax'
  | 'aurora'
  | 'stars'
  | 'matrix'
  | 'scanlines'

export type AnimationSpeed = 'slow' | 'medium' | 'fast'

export interface ThemeMetadata {
  id: string
  name: string
  description: string
  type: ThemeType
  backgroundEffect: BackgroundEffect
  animationSpeed: AnimationSpeed
  supportsFx: boolean // Whether theme supports special effects
  isGaming: boolean
  emoji?: string
  author?: string
  createdAt?: Date
}

export interface ThemeConfiguration {
  theme: string
  type: ThemeType
  backgroundEffect: BackgroundEffect
  animationSpeed: AnimationSpeed
  enableAnimations: boolean
  enableBackgroundEffect: boolean
  particleCount?: number // For particle effects
  glitchIntensity?: number // 0-1 for glitch effect
  parallaxFactor?: number // 0-1 for parallax
}

// Gaming theme specific effects
export interface GamingThemeEffects {
  scanlines?: boolean
  curvature?: boolean
  chromaAberration?: boolean
  vignette?: boolean
  pixelate?: boolean
  reflectivity?: number
}

// Preset gaming themes configuration
export const GAMING_THEME_CONFIG: Record<string, GamingThemeEffects> = {
  'retro-arcade': {
    scanlines: true,
    pixelate: true,
    curvature: true,
  },
  'cyberpunk-neon': {
    chromaAberration: true,
    vignette: true,
    glitchIntensity: 0.3,
  },
  'vaporwave': {
    curvature: true,
    chromaAberration: false,
    reflectivity: 0.6,
  },
  'dark-matrix': {
    scanlines: true,
    vignette: true,
  },
}

export const DEFAULT_THEME_CONFIG: ThemeConfiguration = {
  theme: 'default-dark',
  type: 'static',
  backgroundEffect: 'none',
  animationSpeed: 'medium',
  enableAnimations: false,
  enableBackgroundEffect: false,
  particleCount: 50,
  glitchIntensity: 0.2,
  parallaxFactor: 0.5,
}

export const THEME_METADATA_MAP: Record<string, ThemeMetadata> = {
  // Legacy alias for backwards compatibility
  'dark': {
    id: 'default-dark',
    name: 'Default Dark',
    description: 'Clean and professional dark theme',
    type: 'static',
    backgroundEffect: 'none',
    animationSpeed: 'medium',
    supportsFx: false,
    isGaming: false,
  },
  'default-dark': {
    id: 'default-dark',
    name: 'Default Dark',
    description: 'Clean and professional dark theme',
    type: 'static',
    backgroundEffect: 'none',
    animationSpeed: 'medium',
    supportsFx: false,
    isGaming: false,
  },
  'hawkins-neon': {
    id: 'hawkins-neon',
    name: 'Hawkins Neon',
    description: 'Stranger Things inspired with glitch effects',
    type: 'animated',
    backgroundEffect: 'glitch',
    animationSpeed: 'slow',
    supportsFx: true,
    isGaming: false,
    emoji: '🌀',
  },
  'upside-down': {
    id: 'upside-down',
    name: 'The Upside Down',
    description: 'Enter the shadow realm where everything is reversed',
    type: 'animated',
    backgroundEffect: 'particles',
    animationSpeed: 'slow',
    supportsFx: true,
    isGaming: false,
    emoji: '🙃',
  },
  'holly-jolly': {
    id: 'holly-jolly',
    name: 'Holly Jolly',
    description: 'Festive Christmas theme with green and red',
    type: 'static',
    backgroundEffect: 'none',
    animationSpeed: 'medium',
    supportsFx: false,
    isGaming: false,
    emoji: '🎄',
  },
  'pride-bright': {
    id: 'pride-bright',
    name: 'Pride Bright',
    description: 'Vibrant rainbow-inspired Pride theme',
    type: 'static',
    backgroundEffect: 'none',
    animationSpeed: 'medium',
    supportsFx: false,
    isGaming: false,
    emoji: '🏳️‍🌈',
  },
  'every-child-matters': {
    id: 'every-child-matters',
    name: 'Every Child Matters',
    description: 'Orange-themed awareness and remembrance',
    type: 'static',
    backgroundEffect: 'none',
    animationSpeed: 'medium',
    supportsFx: false,
    isGaming: false,
    emoji: '🧡',
  },
  'remembrance': {
    id: 'remembrance',
    name: 'Remembrance',
    description: 'Muted palette with remembrance red',
    type: 'static',
    backgroundEffect: 'none',
    animationSpeed: 'medium',
    supportsFx: false,
    isGaming: false,
    emoji: '🌺',
  },
  'retro-arcade': {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    description: 'Classic 80s arcade gaming aesthetic with scanlines',
    type: 'gaming',
    backgroundEffect: 'scanlines',
    animationSpeed: 'medium',
    supportsFx: true,
    isGaming: true,
    emoji: '🕹️',
  },
  'cyberpunk-neon': {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    description: 'Futuristic cyberpunk theme with neon glow and chroma aberration',
    type: 'gaming',
    backgroundEffect: 'glitch',
    animationSpeed: 'fast',
    supportsFx: true,
    isGaming: true,
    emoji: '🤖',
  },
  'dark-matrix': {
    id: 'dark-matrix',
    name: 'Dark Matrix',
    description: 'The Matrix inspired theme with code rain effect',
    type: 'gaming',
    backgroundEffect: 'matrix',
    animationSpeed: 'slow',
    supportsFx: true,
    isGaming: true,
    emoji: '💚',
  },
  'vaporwave': {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'Aesthetic vaporwave theme with gradient shifts',
    type: 'animated',
    backgroundEffect: 'gradient-shift',
    animationSpeed: 'slow',
    supportsFx: true,
    isGaming: false,
    emoji: '💜',
  },
  'aurora-borealis': {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    description: 'Northern lights inspired with dynamic aurora effects',
    type: 'animated',
    backgroundEffect: 'aurora',
    animationSpeed: 'slow',
    supportsFx: true,
    isGaming: false,
    emoji: '🌌',
  },
  'neon-grid': {
    id: 'neon-grid',
    name: 'Neon Grid',
    description: 'Grid-based neon theme perfect for tech enthusiasts',
    type: 'gaming',
    backgroundEffect: 'grid',
    animationSpeed: 'medium',
    supportsFx: true,
    isGaming: true,
    emoji: '📊',
  },
  'cosmic-space': {
    id: 'cosmic-space',
    name: 'Cosmic Space',
    description: 'Space-themed with starfield parallax effect',
    type: 'gaming',
    backgroundEffect: 'parallax',
    animationSpeed: 'slow',
    supportsFx: true,
    isGaming: true,
    emoji: '🌠',
  },
}

/**
 * List of themes that have canvas/background effects enabled
 * Used for quick reference and validation
 */
export const THEMES_WITH_EFFECTS = Object.entries(THEME_METADATA_MAP)
  .filter(([_, meta]) => meta.supportsFx && meta.backgroundEffect !== 'none')
  .map(([id, meta]) => ({
    id,
    name: meta.name,
    effect: meta.backgroundEffect,
    isGaming: meta.isGaming,
  }))

/**
 * List of static themes without any effects
 */
export const STATIC_THEMES = Object.entries(THEME_METADATA_MAP)
  .filter(([_, meta]) => !meta.supportsFx || meta.backgroundEffect === 'none')
  .map(([id, meta]) => ({
    id,
    name: meta.name,
  }))