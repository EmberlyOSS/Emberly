import { getConfig } from '@/lib/config'
import { generateHueColors, parseHueThemeId } from '@/lib/theme/hue'
import { safeColors } from '@/lib/theme/safe-colors'

type ThemeInitializerProps = {
  userTheme?: string | null
  userCustomColors?: Record<string, string> | null
  systemTheme?: string
  systemColors?: Record<string, string> | null
}

export async function ThemeInitializer({
  userTheme,
  userCustomColors,
  systemTheme,
  systemColors,
}: ThemeInitializerProps) {
  let themeName: string
  let colorsToUse: Record<string, string> = {}

  // Priority 1: User's saved theme + colors
  if (userTheme) {
    themeName = userTheme
    colorsToUse = userCustomColors || {}
  } else if (systemTheme) {
    // Priority 2: System admin-set theme
    themeName = systemTheme
    colorsToUse = systemColors || {}
  } else {
    // Priority 3: Fallback - get from config
    const config = await getConfig()
    themeName = config.settings.appearance.theme || 'default-dark'
    colorsToUse = config.settings.appearance.customColors || {}
  }

  const hue = parseHueThemeId(themeName)
  if (hue !== null && Object.keys(colorsToUse).length === 0) {
    colorsToUse = generateHueColors(hue)
  }

  const cssVariables = Object.entries(safeColors(colorsToUse))
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
      return `--${cssKey}: ${value};`
    })
    .join('\n')

  // Colors live in their own tag so the client theme provider can drop it
  // once it takes over; otherwise stale server colors leak through whenever
  // a newly picked theme doesn't define every variable.
  return (
    <>
      <style
        id="theme-initializer-colors"
        // Dark-mode browser extensions tag <style> elements before hydration
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: `:root { ${cssVariables} }` }}
      />
      <style
        id="theme-initializer"
        // Dark-mode browser extensions tag <style> elements before hydration
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `:root {
        --radius: 0.75rem;
        --chart-1: 220 70% 50%;
        --chart-2: 160 60% 45%;
        --chart-3: 30 80% 55%;
        --chart-4: 280 65% 60%;
        --chart-5: 340 75% 55%;
      }`,
        }}
      />
    </>
  )
}
