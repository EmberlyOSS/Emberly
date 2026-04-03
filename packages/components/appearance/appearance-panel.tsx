'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles, Zap, RotateCcw } from 'lucide-react'
import { Card } from '@/packages/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'
import { Button } from '@/packages/components/ui/button'
import { Switch } from '@/packages/components/ui/switch'
import { Label } from '@/packages/components/ui/label'
import { PRESET_HUES, THEME_PRESETS } from '@/packages/components/theme/theme-customizer'
import { sortCategories, getCategoryLabel, getCategoryIcon } from '@/packages/lib/theme/theme-categories'
import { useTheme, generateHueColors } from '@/packages/lib/theme/theme-context'
import { useToast } from '@/packages/hooks/use-toast'
import { cn } from '@/packages/lib/utils'

interface AppearancePanelProps {
  /**
   * Admin mode: override save destination.
   * When provided, Save button calls this instead of the user-profile API.
   * Receives the currently previewed themeId and its colors.
   */
  onSave?: (themeId: string, colors: Record<string, string>) => Promise<boolean>
  /**
   * Admin mode: called on every theme/hue selection so the parent can track changes
   * (e.g. update workingConfig for the "Modified" badge).
   */
  onThemeChange?: (
    themeId: string,
    colors: Record<string, string>,
    meta?: { backgroundEffect?: string; animationSpeed?: string }
  ) => void
}

/**
 * Unified Appearance Panel using the new theme context
 *
 * Features:
 * - Instant preview with automatic rollback on cancel
 * - Single source of truth via context
 * - Works for both user and admin flows via optional onSave / onThemeChange callbacks
 * - Effects toggle integrated
 */
export function AppearancePanel({ onSave, onThemeChange }: AppearancePanelProps = {}) {
  const router = useRouter()
  const { toast } = useToast()
  const {
    themeId,
    effectsEnabled,
    isPreview,
    previewTheme,
    previewHue,
    saveTheme,
    cancelPreview,
    setEffectsEnabled,
    resetToDefault,
    metadata,
  } = useTheme()

  // Group themes by category
  const themesByCategory = useMemo(() => {
    return THEME_PRESETS.reduce((acc, preset) => {
      const category = preset.category || 'basic'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(preset)
      return acc
    }, {} as Record<string, typeof THEME_PRESETS>)
  }, [])

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: typeof THEME_PRESETS[0]) => {
    const presetThemeId = preset.themeId || preset.name.replace(/[^\w-]/g, '').toLowerCase()
    const presetColors = preset.colors as unknown as Record<string, string>
    previewTheme(presetThemeId, presetColors)
    onThemeChange?.(presetThemeId, presetColors, {
      backgroundEffect: preset.backgroundEffect,
      animationSpeed: preset.animationSpeed,
    })
  }, [previewTheme, onThemeChange])

  // Handle hue selection
  const handleHueSelect = useCallback((hue: number) => {
    previewHue(hue)
    const hueColors = generateHueColors(hue)
    onThemeChange?.(`hue:${hue}`, hueColors)
  }, [previewHue, onThemeChange])

  // Handle cancel preview
  const handleCancelPreview = useCallback(() => {
    cancelPreview()
    toast({
      title: 'Preview cancelled',
      description: 'Reverted to your saved theme',
    })
  }, [cancelPreview, toast])

  // Handle reset to default
  const handleResetToDefault = useCallback(() => {
    resetToDefault()
    toast({
      title: 'Theme reset',
      description: 'Switched to system default theme',
    })
  }, [resetToDefault, toast])

  // Handle effects toggle
  const handleEffectsToggle = useCallback((enabled: boolean) => {
    setEffectsEnabled(enabled)
    toast({
      title: enabled ? 'Effects enabled' : 'Effects disabled',
      description: enabled 
        ? 'Visual effects and animations are now active'
        : 'Visual effects have been turned off',
    })
  }, [setEffectsEnabled, toast])

  // Handle save — admin passes onSave to override the user-profile destination
  const handleSave = useCallback(async () => {
    const success = onSave ? await onSave(themeId, customColors) : await saveTheme()
    if (success) {
      toast({
        title: 'Theme saved',
        description: metadata?.name
          ? `${metadata.name} is now your active theme`
          : 'Your appearance settings have been saved',
      })
      router.refresh()
    } else {
      toast({
        title: 'Failed to save theme',
        description: 'Please try again or check your connection',
        variant: 'destructive',
      })
    }
  }, [saveTheme, router, toast, metadata])

  // Get the theme ID for a preset (for selection matching)
  const getPresetThemeId = (preset: typeof THEME_PRESETS[0]) => {
    return preset.themeId || preset.name.replace(/[^\w-]/g, '').toLowerCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Appearance
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your visual experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelPreview}
              className="text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button
            disabled={!isPreview}
            onClick={handleSave}
            size="sm"
            className="min-w-[100px]"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Current Theme Info */}
      {metadata && (
        <Card className="p-3 glass-subtle">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{metadata.emoji || '🎨'}</div>
            <div className="flex-1">
              <div className="font-medium">{metadata.name}</div>
              <div className="text-xs text-muted-foreground">{metadata.description}</div>
            </div>
            {isPreview && (
              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                Preview
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Theme Presets */}
      <Card className="p-4 glass-subtle">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList 
            className="grid w-full glass-subtle p-1" 
            style={{ gridTemplateColumns: `repeat(${Object.keys(themesByCategory).length}, 1fr)` }}
          >
            {sortCategories(Object.keys(themesByCategory) as any[]).map((category) => (
              <TabsTrigger 
                key={category} 
                value={category} 
                className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-primary/20"
              >
                <span>{getCategoryIcon(category)}</span>
                <span className="hidden sm:inline">{getCategoryLabel(category)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {sortCategories(Object.keys(themesByCategory) as any[]).map((category) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {themesByCategory[category].map((preset) => {
                  const presetId = getPresetThemeId(preset)
                  const isSelected = themeId === presetId
                  
                  return (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border p-4 text-left transition-all",
                        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
                        isSelected
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border/50 bg-muted/30"
                      )}
                    >
                      {/* Gradient Preview Background */}
                      <div
                        className="absolute inset-0 opacity-60"
                        style={{
                          background: `linear-gradient(120deg, hsl(${preset.colors.primary}), hsl(${preset.colors.accent}))`,
                        }}
                      />
                      
                      {/* Theme Info */}
                      <div className="relative space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold leading-tight">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">
                          {preset.description}
                        </p>
                      </div>

                      {/* Gaming/Animated Badge */}
                      {(preset.isGaming || preset.category === 'animated') && (
                        <div className="absolute top-2 right-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 text-white font-medium backdrop-blur-sm">
                            {preset.isGaming ? 'FX' : '✨'}
                          </span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Hue Customizer */}
      <Card className="p-4 glass-subtle">
        <h4 className="text-sm font-semibold mb-3">Custom Hues</h4>
        <p className="text-xs text-muted-foreground mb-4">
          Quick color adjustments based on a single hue value
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {PRESET_HUES.map(({ hue, name, saturation, lightness }) => {
            const isSelected = themeId === `hue:${hue}`
            return (
              <button
                key={hue}
                onClick={() => handleHueSelect(hue)}
                className={cn(
                  "group relative aspect-square rounded-lg border-2 transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg",
                  isSelected
                    ? "border-white ring-2 ring-white/50"
                    : "border-transparent hover:border-border/50"
                )}
                style={{ 
                  background: `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness}%), hsl(${hue}, ${saturation}%, ${lightness - 15}%))` 
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-lg" />
                <span className="absolute bottom-1 left-1 right-1 text-[10px] font-medium text-white text-center truncate">
                  {name}
                </span>
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Effects Toggle */}
      <Card className="p-4 glass-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <Label htmlFor="effects-toggle" className="text-sm font-semibold">
                Theme Effects & Animations
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable visual effects like particles, glitch, and special animations
              </p>
            </div>
          </div>
          <Switch
            id="effects-toggle"
            checked={effectsEnabled}
            onCheckedChange={handleEffectsToggle}
          />
        </div>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetToDefault}
          className="text-muted-foreground text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset to Default
        </Button>
      </div>

      {/* Info Footer */}
      <p className="text-xs text-muted-foreground text-center">
        Changes preview instantly • Click Save to persist your selection
      </p>
    </div>
  )
}
