/**
 * The caller's address, read only from what our own proxies set. Clients can
 * send any X-Forwarded-For they like and proxies append to it, so the leftmost
 * entries can't be trusted. TRUSTED_PROXY is "cloudflare", or the number of
 * proxies in front of the app (default 1).
 */
export function clientIp(headers?: Headers | null): string | undefined {
  if (!headers) return undefined

  const trusted = process.env.TRUSTED_PROXY?.trim().toLowerCase()
  if (trusted === 'cloudflare') {
    return headers.get('cf-connecting-ip')?.trim() || undefined
  }

  const hops = Math.max(1, Number.parseInt(trusted ?? '', 10) || 1)
  const chain = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  return chain[Math.max(0, chain.length - hops)]
}
