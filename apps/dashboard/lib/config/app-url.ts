const warned = new Set<string>()

export function read(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

export function readWithLegacy(
  name: string,
  legacy: string[]
): string | undefined {
  const value = read(name)
  if (value) return value
  for (const old of legacy) {
    const legacyValue = read(old)
    if (!legacyValue) continue
    if (!warned.has(old)) {
      warned.add(old)
      console.warn(`[emberly] ${old} is deprecated, set ${name} instead`)
    }
    return legacyValue
  }
  return undefined
}

export function appUrl(): string {
  const configured = readWithLegacy('APP_URL', [
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_APP_URL',
    'APP_BASE_URL',
  ])
  const url = configured ?? `http://localhost:${read('PORT') ?? '3000'}`
  return url.replace(/\/+$/, '')
}
