'use client'

import React from 'react'
import { EmberlyThemeProvider, type ThemeProviderProps } from '@/packages/lib/theme/theme-context'

interface ThemeProviderWrapperProps {
  children: React.ReactNode
  initialUserTheme?: string | null
  initialUserColors?: Record<string, string> | null
  systemTheme?: string
  systemColors?: Record<string, string>
}

/**
 * Client-side wrapper for EmberlyThemeProvider
 * Handles the save callbacks via API calls
 */
export function ThemeProviderWrapper({
  children,
  initialUserTheme,
  initialUserColors,
  systemTheme,
  systemColors,
}: ThemeProviderWrapperProps) {
  // Save user theme via profile API
  const handleSaveUserTheme = async (themeId: string, colors: Record<string, string>): Promise<boolean> => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeId, customColors: colors }),
      })
      return response.ok
    } catch (error) {
      console.error('[ThemeProviderWrapper] Failed to save user theme:', error)
      return false
    }
  }

  return (
    <EmberlyThemeProvider
      initialUserTheme={initialUserTheme}
      initialUserColors={initialUserColors}
      systemTheme={systemTheme}
      systemColors={systemColors}
      onSaveUserTheme={handleSaveUserTheme}
    >
      {children}
    </EmberlyThemeProvider>
  )
}
