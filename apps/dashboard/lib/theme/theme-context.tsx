'use client'

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from 'react'
import {
  THEME_METADATA_MAP,
  DEFAULT_THEME_CONFIG,
  type ThemeConfiguration,
  type ThemeMetadata,
} from './theme-types'
import { generateHueColors, parseHueThemeId } from './hue'

export { generateHueColors }

// Storage keys
const EFFECTS_ENABLED_KEY = 'emberly-effects-enabled'

// Theme priority: user > system > default
export type ThemeSource = 'user' | 'system' | 'default'

export interface ThemeState {
  /** Current active theme ID */
  themeId: string
  /** Where the theme came from */
  source: ThemeSource
  /** Full theme configuration including effects */
  config: ThemeConfiguration
  /** Theme metadata from THEME_METADATA_MAP */
  metadata: ThemeMetadata | null
  /** Whether effects are enabled by user preference */
  effectsEnabled: boolean
  /** Custom CSS color variables */
  customColors: Record<string, string>
  /** Whether we're in preview mode (unsaved changes) */
  isPreview: boolean
  /** Original theme before preview started */
  originalTheme: string | null
}

export interface ThemeContextValue extends ThemeState {
  /** Preview a theme without saving (instant visual update) */
  previewTheme: (themeId: string, colors?: Record<string, string>) => void
  /** Apply a hue-based theme (custom color) */
  previewHue: (hue: number) => void
  /** Commit the preview as the user's saved theme */
  saveTheme: () => Promise<boolean>
  /** Cancel preview and revert to original theme */
  cancelPreview: () => void
  /** Toggle effects on/off */
  setEffectsEnabled: (enabled: boolean) => void
  /** Check if a theme ID is valid/known */
  isValidTheme: (themeId: string) => boolean
  /** Get metadata for any theme ID */
  getThemeMetadata: (themeId: string) => ThemeMetadata | null
  /** Preview the system default; saving it clears the user's own theme */
  resetToDefault: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export interface ThemeProviderProps {
  children: React.ReactNode
  /** Initial theme from server (user's saved theme if authenticated) */
  initialUserTheme?: string | null
  /** Initial custom colors from server */
  initialUserColors?: Record<string, string> | null
  /** System default theme from config (used for unauthorized/no-theme users) */
  systemTheme?: string
  /** System custom colors from config */
  systemColors?: Record<string, string>
  /** Callback to persist user theme to database. A null themeId clears it (follow system theme). */
  onSaveUserTheme?: (
    themeId: string | null,
    colors: Record<string, string>
  ) => Promise<boolean>
}

/**
 * Build a ThemeConfiguration from a theme ID
 * IMPORTANT: Only themes with explicit metadata entries will have effects enabled
 */
function buildThemeConfig(themeId: string): ThemeConfiguration {
  const metadata = THEME_METADATA_MAP[themeId]

  if (metadata) {
    // Known theme - use its explicit configuration
    return {
      theme: metadata.id,
      type: metadata.type,
      backgroundEffect: metadata.backgroundEffect,
      animationSpeed: metadata.animationSpeed,
      enableAnimations:
        metadata.supportsFx && metadata.backgroundEffect !== 'none',
      enableBackgroundEffect:
        metadata.supportsFx && metadata.backgroundEffect !== 'none',
      particleCount: metadata.type === 'gaming' ? 80 : 50,
      glitchIntensity: 0.2,
      parallaxFactor: 0.5,
    }
  }

  // Hue-based themes (e.g., "hue:220") - NO effects
  if (themeId.startsWith('hue:')) {
    return {
      ...DEFAULT_THEME_CONFIG,
      theme: themeId,
      type: 'static',
      backgroundEffect: 'none',
      enableAnimations: false,
      enableBackgroundEffect: false,
    }
  }

  // Unknown theme - use defaults with NO effects
  // This prevents random effects from appearing on unknown themes
  return {
    ...DEFAULT_THEME_CONFIG,
    theme: themeId,
    type: 'static',
    backgroundEffect: 'none',
    enableAnimations: false,
    enableBackgroundEffect: false,
  }
}

// Variables we've set inline, so switching themes can clear ones the new theme doesn't define
let appliedColorKeys = new Set<string>()

/**
 * Apply a theme's colors to :root, replacing whatever the previous theme set.
 * Hue themes saved without colors get their palette generated, matching ThemeInitializer.
 */
function applyCSSVariables(themeId: string, colors: Record<string, string>) {
  const root = document.documentElement
  let resolved = colors
  if (Object.keys(resolved).length === 0) {
    const hue = parseHueThemeId(themeId)
    if (hue !== null) resolved = generateHueColors(hue)
  }

  const nextKeys = new Set<string>()
  for (const [key, value] of Object.entries(resolved)) {
    const cssKey = `--${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`
    root.style.setProperty(cssKey, value)
    nextKeys.add(cssKey)
  }
  for (const cssKey of appliedColorKeys) {
    if (!nextKeys.has(cssKey)) root.style.removeProperty(cssKey)
  }
  appliedColorKeys = nextKeys

  // Inline vars now carry the theme; empty the server-rendered colors so
  // variables the new theme omits fall back to globals.css, not the old theme.
  // Emptied rather than removed because React owns the node.
  const serverColors = document.getElementById('theme-initializer-colors')
  if (serverColors?.textContent) serverColors.textContent = ''
}

/**
 * Apply data-theme attribute and dispatch change event
 */
function applyThemeAttribute(themeId: string) {
  document.documentElement.setAttribute('data-theme', themeId)
  try {
    document.documentElement.dispatchEvent(
      new CustomEvent('emberly:theme-changed', { detail: themeId })
    )
  } catch {
    // Ignore errors in event dispatch
  }
}

/**
 * Apply effect classes to the effects root element
 * Only applies classes when theme explicitly supports effects
 */
function applyEffectClasses(
  metadata: ThemeMetadata | null,
  effectsEnabled: boolean
) {
  const rootEl = document.getElementById('theme-effects-root')
  if (!rootEl) return

  // ALWAYS clear existing classes first
  rootEl.classList.remove(
    'theme-glitch',
    'theme-gradient-shift',
    'theme-aurora',
    'theme-arcade'
  )

  // Only add classes if:
  // 1. Effects are enabled
  // 2. We have valid metadata (not an unknown theme)
  // 3. The theme explicitly supports effects (supportsFx: true)
  // 4. The background effect is not 'none'
  if (
    !effectsEnabled ||
    !metadata ||
    !metadata.supportsFx ||
    metadata.backgroundEffect === 'none'
  ) {
    return
  }

  // Add appropriate classes based on the explicit effect type
  switch (metadata.backgroundEffect) {
    case 'glitch':
      rootEl.classList.add('theme-glitch')
      break
    case 'gradient-shift':
      rootEl.classList.add('theme-gradient-shift')
      break
    case 'aurora':
      rootEl.classList.add('theme-aurora')
      break
  }

  if (metadata.isGaming) {
    rootEl.classList.add('theme-arcade')
  }
}

/**
 * Returns a referentially stable copy of a value that only changes when its
 * contents change. Server props arrive as fresh objects on every render (and
 * `systemColors = {}` defaults likewise), which would otherwise re-run the
 * sync effect and wipe in-progress previews.
 */
function useStableValue<T>(value: T): T {
  const ref = useRef(value)
  const key = JSON.stringify(value ?? null)
  const keyRef = useRef(key)
  if (keyRef.current !== key) {
    keyRef.current = key
    ref.current = value
  }
  return ref.current
}

const EMPTY_COLORS: Record<string, string> = {}

export function EmberlyThemeProvider({
  children,
  initialUserTheme,
  initialUserColors: initialUserColorsProp,
  systemTheme = 'default-dark',
  systemColors: systemColorsProp,
  onSaveUserTheme,
}: ThemeProviderProps) {
  const initialUserColors = useStableValue(initialUserColorsProp)
  const systemColors = useStableValue(systemColorsProp ?? EMPTY_COLORS)

  // Determine initial theme based on priority: user > system > hardcoded default
  const getInitialTheme = useCallback((): {
    themeId: string
    source: ThemeSource
    colors: Record<string, string>
  } => {
    // Priority 1: User's saved theme
    if (initialUserTheme) {
      return {
        themeId: initialUserTheme,
        source: 'user',
        colors: initialUserColors || {},
      }
    }
    // Priority 2: System theme from config (always use it, even if it's not explicitly set)
    if (systemTheme) {
      return {
        themeId: systemTheme,
        source: 'system',
        colors: systemColors,
      }
    }
    // Priority 3: Hardcoded fallback (should rarely happen)
    return {
      themeId: 'default-dark',
      source: 'default',
      colors: {},
    }
  }, [initialUserTheme, initialUserColors, systemTheme, systemColors])

  const initial = getInitialTheme()

  // Core state
  const [themeId, setThemeId] = useState(initial.themeId)
  const [source, setSource] = useState<ThemeSource>(initial.source)
  const [customColors, setCustomColors] = useState<Record<string, string>>(
    initial.colors
  )
  const [effectsEnabled, setEffectsEnabledState] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const originalThemeRef = useRef<{
    themeId: string
    colors: Record<string, string>
  } | null>(null)
  // Set while previewing "Reset to Default" so saving clears the user's theme
  const resetPendingRef = useRef(false)
  const isFirstSyncRef = useRef(true)

  // Derived state
  const metadata = useMemo(() => THEME_METADATA_MAP[themeId] || null, [themeId])
  const config = useMemo(() => buildThemeConfig(themeId), [themeId])

  // Load effects preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(EFFECTS_ENABLED_KEY)
    const enabled = stored === null ? true : stored === 'true'
    setEffectsEnabledState(enabled)
    document.documentElement.setAttribute(
      'data-effects-disabled',
      (!enabled).toString()
    )
  }, [])

  // Sync theme when server-provided values change (login/logout, saves elsewhere)
  useEffect(() => {
    if (isFirstSyncRef.current) {
      isFirstSyncRef.current = false
      return
    }
    originalThemeRef.current = null
    resetPendingRef.current = false
    if (initialUserTheme) {
      // User logged in - use their theme
      setThemeId(initialUserTheme)
      setCustomColors(initialUserColors || {})
      setSource('user')
      setIsPreview(false)
    } else {
      // User logged out - revert to system theme
      setThemeId(systemTheme || 'default-dark')
      setCustomColors(systemColors || {})
      setSource(systemTheme ? 'system' : 'default')
      setIsPreview(false)
    }
  }, [initialUserTheme, initialUserColors, systemTheme, systemColors])

  // Apply theme visuals when state changes
  useEffect(() => {
    applyThemeAttribute(themeId)
    applyCSSVariables(themeId, customColors)
    applyEffectClasses(metadata, effectsEnabled)
  }, [themeId, customColors, metadata, effectsEnabled])

  // Preview a theme without saving
  const previewTheme = useCallback(
    (newThemeId: string, colors?: Record<string, string>) => {
      // Store original theme on first preview
      if (!isPreview) {
        originalThemeRef.current = { themeId, colors: customColors }
        setIsPreview(true)
      }

      resetPendingRef.current = false
      setThemeId(newThemeId)
      setCustomColors(colors ?? {})
    },
    [isPreview, themeId, customColors]
  )

  // Preview a hue-based theme
  const previewHue = useCallback(
    (hue: number) => {
      const hueColors = generateHueColors(hue)
      previewTheme(`hue:${hue}`, hueColors)
    },
    [previewTheme]
  )

  // Save the current preview as user's theme
  const saveTheme = useCallback(async (): Promise<boolean> => {
    if (!onSaveUserTheme) {
      console.warn('[Theme] No onSaveUserTheme callback provided')
      return false
    }

    try {
      const clearing = resetPendingRef.current
      const success = await onSaveUserTheme(
        clearing ? null : themeId,
        customColors
      )
      if (success) {
        resetPendingRef.current = false
        setSource(clearing ? (systemTheme ? 'system' : 'default') : 'user')
        setIsPreview(false)
        originalThemeRef.current = null
      }
      return success
    } catch (error) {
      console.error('[Theme] Failed to save user theme:', error)
      return false
    }
  }, [themeId, customColors, onSaveUserTheme, systemTheme])

  // Cancel preview and revert
  const cancelPreview = useCallback(() => {
    if (originalThemeRef.current) {
      setThemeId(originalThemeRef.current.themeId)
      setCustomColors(originalThemeRef.current.colors)
      originalThemeRef.current = null
    }
    resetPendingRef.current = false
    setIsPreview(false)
  }, [])

  // Toggle effects
  const setEffectsEnabled = useCallback(
    (enabled: boolean) => {
      setEffectsEnabledState(enabled)
      localStorage.setItem(EFFECTS_ENABLED_KEY, enabled.toString())
      document.documentElement.setAttribute(
        'data-effects-disabled',
        (!enabled).toString()
      )
      applyEffectClasses(metadata, enabled)
    },
    [metadata]
  )

  // Validate theme ID
  const isValidTheme = useCallback((id: string): boolean => {
    return id in THEME_METADATA_MAP || id.startsWith('hue:')
  }, [])

  // Get metadata for any theme
  const getThemeMetadata = useCallback((id: string): ThemeMetadata | null => {
    return THEME_METADATA_MAP[id] || null
  }, [])

  // Preview the system default; Save then clears the user's own theme
  const resetToDefault = useCallback(() => {
    previewTheme(systemTheme || 'default-dark', systemColors)
    resetPendingRef.current = true
  }, [previewTheme, systemTheme, systemColors])

  const value: ThemeContextValue = {
    themeId,
    source,
    config,
    metadata,
    effectsEnabled,
    customColors,
    isPreview,
    originalTheme: originalThemeRef.current?.themeId || null,
    previewTheme,
    previewHue,
    saveTheme,
    cancelPreview,
    setEffectsEnabled,
    isValidTheme,
    getThemeMetadata,
    resetToDefault,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within EmberlyThemeProvider')
  }
  return context
}

/**
 * Hook for just the theme effects configuration (backwards compatible)
 */
export function useThemeConfig(): ThemeConfiguration | null {
  const context = useContext(ThemeContext)
  return context?.config || null
}
