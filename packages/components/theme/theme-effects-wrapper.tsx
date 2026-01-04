'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme, useThemeConfig } from '@/packages/lib/theme/theme-context'
import { AnimatedBackground } from '@/packages/components/theme/animated-background'
import { GamingBackground } from '@/packages/components/theme/gaming-background'

const CANVAS_EFFECTS = ['particles', 'gradient-shift', 'waves', 'glitch', 'grid', 'parallax', 'aurora', 'stars', 'matrix', 'scanlines']

/**
 * Client-only container for theme effects.
 * This component renders nothing on the server and creates the container div
 * only after hydration to avoid hydration mismatches caused by browser extensions.
 */
export const ThemeEffectsContainer: React.FC = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Render nothing on server and initial client render
  if (!mounted) return null

  return (
    <div 
      id="theme-effects-root" 
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none" 
      style={{ width: '100vw', height: '100vh', top: 0, left: 0 }} 
    />
  )
}

/**
 * Wrapper component that renders theme effects (particles, animations, etc.)
 * Uses the unified theme context for cleaner state management
 */
export const ThemeEffectsWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config, effectsEnabled, metadata } = useTheme()
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Find server-rendered container on mount
  useEffect(() => {
    const el = document.getElementById('theme-effects-root')
    setContainer(el)
    // Mark as hydrated after mount
    setIsHydrated(true)
  }, [])

  // Determine what effects to render - ONLY if metadata explicitly supports it
  const effect = config?.backgroundEffect || 'none'
  
  // Only show effects if:
  // 1. Component is hydrated (prevents flash during SSR/hydration)
  // 2. Effects are enabled by user preference
  // 3. The theme has a known metadata entry (not unknown theme)
  // 4. The metadata explicitly supports effects (supportsFx: true)
  // 5. The background effect is not 'none'
  const shouldShowEffects = isHydrated &&
    effectsEnabled && 
    metadata !== null && 
    metadata.supportsFx === true && 
    effect !== 'none' &&
    CANVAS_EFFECTS.includes(effect)
  
  const hasCanvasEffect = shouldShowEffects
  const hasGamingEffect = shouldShowEffects && metadata?.isGaming === true

  // Debug logging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ThemeEffectsWrapper] Theme:', config?.theme)
      console.log('[ThemeEffectsWrapper] Metadata:', metadata?.id, 'supportsFx:', metadata?.supportsFx)
      console.log('[ThemeEffectsWrapper] Effect:', effect)
      console.log('[ThemeEffectsWrapper] effectsEnabled:', effectsEnabled)
      console.log('[ThemeEffectsWrapper] isHydrated:', isHydrated)
      console.log('[ThemeEffectsWrapper] shouldShowEffects:', shouldShowEffects)
      console.log('[ThemeEffectsWrapper] hasCanvasEffect:', hasCanvasEffect)
      console.log('[ThemeEffectsWrapper] hasGamingEffect:', hasGamingEffect)
    }
  }, [config, metadata, effect, effectsEnabled, isHydrated, shouldShowEffects, hasCanvasEffect, hasGamingEffect])

  return (
    <>
      {container && (hasCanvasEffect || hasGamingEffect) && createPortal(
        <>
          {hasCanvasEffect && (
            <AnimatedBackground 
              key={`${config?.theme}-${effect}`} 
              type={effect as any} 
              intensity={1} 
              speed={config?.animationSpeed as any} 
            />
          )}
          {hasGamingEffect && (
            <GamingBackground 
              key={`gaming-${config?.theme}`} 
              theme={config?.theme as any} 
              intensity={0.6} 
            />
          )}
        </>,
        container
      )}
      <div className="relative z-10">{children}</div>
    </>
  )
}

/**
 * Fallback wrapper that works without the context (for backwards compatibility)
 * Uses the legacy useThemeEffects hook behavior
 */
export const ThemeEffectsWrapperLegacy: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = useThemeConfig()
  const [effectsEnabled, setEffectsEnabled] = useState(true)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  // Listen for effects toggle changes
  useEffect(() => {
    const checkEffectsState = () => {
      const stored = localStorage.getItem('emberly-effects-enabled')
      setEffectsEnabled(stored === null ? true : stored === 'true')
    }

    checkEffectsState()
    window.addEventListener('storage', checkEffectsState)
    
    const observer = new MutationObserver(() => {
      const disabled = document.documentElement.getAttribute('data-effects-disabled')
      setEffectsEnabled(disabled !== 'true')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-effects-disabled'] })

    return () => {
      window.removeEventListener('storage', checkEffectsState)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const el = document.getElementById('theme-effects-root')
    setContainer(el)
  }, [])

  const effect = config?.backgroundEffect || 'none'
  const hasCanvasEffect = effectsEnabled && effect !== 'none' && CANVAS_EFFECTS.includes(effect)
  const hasGamingEffect = effectsEnabled && config?.type === 'gaming' && effect !== 'none'

  return (
    <>
      {container && (hasCanvasEffect || hasGamingEffect) && createPortal(
        <>
          {hasCanvasEffect && (
            <AnimatedBackground 
              key={`${config?.theme}-${effect}`} 
              type={effect as any} 
              intensity={1} 
              speed={config?.animationSpeed as any} 
            />
          )}
          {hasGamingEffect && (
            <GamingBackground 
              key={`gaming-${config?.theme}`} 
              theme={config?.theme as any} 
              intensity={0.6} 
            />
          )}
        </>,
        container
      )}
      <div className="relative z-10">{children}</div>
    </>
  )
}
