/**
 * Where to go after signing in: the page's ?callbackUrl= when it's a path on
 * this site, otherwise the dashboard. Only same-site paths are allowed, so a
 * crafted login link can't bounce someone to another site.
 */
export function getCallbackUrl(fallback = '/dashboard'): string {
  if (typeof window === 'undefined') return fallback
  const value = new URLSearchParams(window.location.search).get('callbackUrl')
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/\\')
  ) {
    return fallback
  }
  return value
}
