/**
 * Theme Organization and Categorization
 * 
 * Groups themes into categories for better UI presentation
 * Makes it easy to scale as more themes are added
 */

export type ThemeCategory = 'basic' | 'animated' | 'gaming' | 'seasonal' | 'special'

export interface CategorizedTheme {
  name: string
  category: ThemeCategory
  emoji?: string
  colors: Record<string, string>
  description: string
  isGaming?: boolean
  themeId?: string
  backgroundEffect?: string
  animationSpeed?: string
}

/**
 * Theme category metadata for UI display
 */
export const THEME_CATEGORIES = {
  basic: {
    label: 'Basic',
    description: 'Clean and professional themes',
    icon: '✨',
    order: 1,
  },
  animated: {
    label: 'Animated',
    description: 'Themes with smooth animations',
    icon: '🎬',
    order: 2,
  },
  gaming: {
    label: 'Gaming',
    description: 'Retro and modern gaming aesthetics',
    icon: '🎮',
    order: 3,
  },
  seasonal: {
    label: 'Seasonal',
    description: 'Limited time seasonal themes',
    icon: '🎉',
    order: 4,
  },
  special: {
    label: 'Special',
    description: 'Themed for special occasions and causes',
    icon: '💝',
    order: 5,
  },
} as const

/**
 * Get category label
 */
export function getCategoryLabel(category: ThemeCategory): string {
  return THEME_CATEGORIES[category].label
}

/**
 * Get category description
 */
export function getCategoryDescription(category: ThemeCategory): string {
  return THEME_CATEGORIES[category].description
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: ThemeCategory): string {
  return THEME_CATEGORIES[category].icon
}

/**
 * Get category order for sorting
 */
export function getCategoryOrder(category: ThemeCategory): number {
  return THEME_CATEGORIES[category].order
}

/**
 * Sort categories by order
 */
export function sortCategories(categories: ThemeCategory[]): ThemeCategory[] {
  return [...categories].sort((a, b) => getCategoryOrder(a) - getCategoryOrder(b))
}