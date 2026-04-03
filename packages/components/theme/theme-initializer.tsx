import { getConfig } from '@/packages/lib/config'

type ThemeInitializerProps = {
  userTheme?: string | null
  userCustomColors?: Record<string, string> | null
  systemTheme?: string
  systemColors?: Record<string, string> | null
}

/** Generate hue-based colors for dynamic themes */
function generateHueColors(hue: number): Record<string, string> {
  const BASE_COLORS: Record<string, string> = {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    cardForeground: '210 40% 98%',
    popover: '222.2 84% 4.9%',
    popoverForeground: '210 40% 98%',
    primary: '217.2 91.2% 59.8%',
    primaryForeground: '222.2 47.4% 11.2%',
    secondary: '217.2 32.6% 17.5%',
    secondaryForeground: '210 40% 98%',
    muted: '215 16.3% 46.9%',
    mutedForeground: '217.9 10.3% 64.9%',
    accent: '216 34% 53%',
    accentForeground: '210 40% 98%',
    destructive: '0 62.8% 40%',
    destructiveForeground: '210 40% 98%',
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 17.5%',
    ring: '217.2 91.2% 59.8%',
  }

  const result: Record<string, string> = {}

  Object.entries(BASE_COLORS).forEach(([key, value]) => {
    // Keep destructive colors red
    if (key === 'destructive' || key === 'destructiveForeground') {
      result[key] = value
      return
    }
    const [, s, l] = value.split(' ')
    result[key] = `${hue} ${s} ${l}`
  })

  return result
}

export async function ThemeInitializer({ 
  userTheme, 
  userCustomColors,
  systemTheme,
  systemColors 
}: ThemeInitializerProps) {
  let cssVariables: string
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

    // If system theme is hue-based but no colors provided, generate them
    if (systemTheme.startsWith('hue:') && Object.keys(colorsToUse).length === 0) {
      const hueMatch = systemTheme.match(/hue:(\d+)/)
      if (hueMatch) {
        const hue = parseInt(hueMatch[1], 10)
        colorsToUse = generateHueColors(hue)
      }
    }
  } else {
    // Priority 3: Fallback - get from config
    const config = await getConfig()
    themeName = config.settings.appearance.theme || 'default-dark'
    colorsToUse = config.settings.appearance.customColors || {}

    // Generate hue colors if needed
    if (themeName.startsWith('hue:') && Object.keys(colorsToUse).length === 0) {
      const hueMatch = themeName.match(/hue:(\d+)/)
      if (hueMatch) {
        const hue = parseInt(hueMatch[1], 10)
        colorsToUse = generateHueColors(hue)
      }
    }
  }

  cssVariables = Object.entries(colorsToUse)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
      return `--${cssKey}: ${value};`
    })
    .join('\n')

  return (
    <style
      id="theme-initializer"
      dangerouslySetInnerHTML={{
        __html: `:root {
        ${cssVariables}
        --radius: 0.75rem;
        --chart-1: 220 70% 50%;
        --chart-2: 160 60% 45%;
        --chart-3: 30 80% 55%;
        --chart-4: 280 65% 60%;
        --chart-5: 340 75% 55%;
      }`,
      }}
    />
  )
}