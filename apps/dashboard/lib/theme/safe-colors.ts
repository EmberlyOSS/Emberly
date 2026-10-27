const COLOR_KEY = /^[a-zA-Z][a-zA-Z0-9-]{0,47}$/
// HSL triplets, hex and rgb()/hsl() values, and named colors; nothing that can close a <style> tag or a rule
const COLOR_VALUE = /^[a-zA-Z0-9#%.,/()+\- ]{1,64}$/
const THEME_NAME = /^[a-zA-Z0-9:._-]{1,64}$/

export function isSafeThemeName(value: unknown): value is string {
  return typeof value === 'string' && THEME_NAME.test(value)
}

export function isSafeColors(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.entries(value).every(
    ([key, color]) =>
      COLOR_KEY.test(key) &&
      typeof color === 'string' &&
      COLOR_VALUE.test(color)
  )
}

/** Drops any color that isn't a plain value, e.g. ones saved before validation existed. */
export function safeColors(
  colors: Record<string, unknown> | null | undefined
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, color] of Object.entries(colors ?? {})) {
    if (
      COLOR_KEY.test(key) &&
      typeof color === 'string' &&
      COLOR_VALUE.test(color)
    )
      out[key] = color
  }
  return out
}
