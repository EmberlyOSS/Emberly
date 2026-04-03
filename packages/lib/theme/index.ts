/**
 * Theme System Exports
 * 
 * This module provides a unified theme system for Emberly with:
 * - Preset themes with colors and effects
 * - User theme persistence (DB)
 * - System theme configuration
 * - Instant preview with rollback
 * - Effects toggle per user
 */

// Core types
export type {
  ThemeType,
  BackgroundEffect,
  AnimationSpeed,
  ThemeMetadata,
  ThemeConfiguration,
  GamingThemeEffects,
} from './theme-types'

// Constants and maps
export {
  GAMING_THEME_CONFIG,
  DEFAULT_THEME_CONFIG,
  THEME_METADATA_MAP,
} from './theme-types'

// Context and hooks
export {
  EmberlyThemeProvider,
  useTheme,
  useThemeConfig,
  type ThemeSource,
  type ThemeState,
  type ThemeContextValue,
  type ThemeProviderProps,
} from './theme-context'

// Categories
export {
  THEME_CATEGORIES,
  CATEGORY_ORDER,
  sortCategories,
  getCategoryLabel,
  getCategoryIcon,
  type ThemeCategory,
} from './theme-categories'

/**
 * Quick Start:
 * 
 * 1. Wrap your app with EmberlyThemeProvider in the root layout:
 * 
 * ```tsx
 * <EmberlyThemeProvider
 *   initialUserTheme={userTheme}
 *   initialUserColors={userColors}
 *   systemTheme={config.settings.appearance.theme}
 *   systemColors={config.settings.appearance.customColors}
 *   onSaveUserTheme={async (themeId, colors) => {
 *     return await updateProfile({ theme: themeId, customColors: colors })
 *   }}
 *   onSaveSystemTheme={async (themeId, colors) => {
 *     return await saveSystemTheme(themeId, colors)
 *   }}
 * >
 *   {children}
 * </EmberlyThemeProvider>
 * ```
 * 
 * 2. Use the useTheme hook in components:
 * 
 * ```tsx
 * const { 
 *   themeId,           // Current theme ID
 *   metadata,          // Theme metadata (name, effects, etc.)
 *   effectsEnabled,    // Whether effects are on
 *   isPreview,         // Whether in preview mode
 *   previewTheme,      // Preview a theme
 *   saveTheme,         // Save user's theme
 *   cancelPreview,     // Cancel and revert
 *   setEffectsEnabled, // Toggle effects
 * } = useTheme()
 * ```
 */