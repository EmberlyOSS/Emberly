/**
 * Hue-based custom themes ("hue:<degrees>").
 *
 * Kept out of the 'use client' theme context so the server-side
 * ThemeInitializer renders exactly the same palette the client previews.
 */

const HUE_BASE_COLORS: Record<string, string> = {
  background: '222.2 84% 4.9%',
  foreground: '210 40% 98%',
  card: '222.2 84% 4.9%',
  cardForeground: '210 40% 98%',
  popover: '222.2 84% 4.9%',
  popoverForeground: '210 40% 98%',
  primary: '210 40% 98%',
  primaryForeground: '222.2 47.4% 11.2%',
  secondary: '217.2 32.6% 17.5%',
  secondaryForeground: '210 40% 98%',
  muted: '217.2 32.6% 17.5%',
  mutedForeground: '215 20.2% 65.1%',
  accent: '217.2 32.6% 17.5%',
  accentForeground: '210 40% 98%',
  destructive: '0 62.8% 30.6%',
  destructiveForeground: '210 40% 98%',
  border: '217.2 32.6% 17.5%',
  input: '217.2 32.6% 17.5%',
  ring: '212.7 26.8% 83.9%',
}

export function generateHueColors(hue: number): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(HUE_BASE_COLORS)) {
    if (key === 'destructive' || key === 'destructiveForeground') {
      result[key] = value
      continue
    }
    const [, s, l] = value.split(' ')
    result[key] = `${hue} ${s} ${l}`
  }
  return result
}

/** Returns the hue for a "hue:<degrees>" theme id (decimals allowed), or null. */
export function parseHueThemeId(themeId: string): number | null {
  const match = themeId.match(/^hue:(\d+(?:\.\d+)?)$/)
  return match ? parseFloat(match[1]) : null
}
