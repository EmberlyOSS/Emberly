import { headers } from 'next/headers'

import { describeDevice } from '@/lib/utils/user-agent'

export interface RequestLoginContext {
  ip?: string
  userAgent?: string
  geo?: { country?: string; city?: string; region?: string }
  timeZone?: string
}

function validTimeZone(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value || value.length > 64) return undefined
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return value
  } catch {
    return undefined
  }
}

function decode(value: string | null) {
  if (!value) return undefined
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export async function getRequestLoginContext(
  clientTimeZone?: unknown
): Promise<RequestLoginContext> {
  let h: Headers
  try {
    h = await headers()
  } catch {
    return { timeZone: validTimeZone(clientTimeZone) }
  }

  const ip =
    h.get('cf-connecting-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    undefined

  const country =
    h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || undefined
  const city = decode(h.get('cf-ipcity') || h.get('x-vercel-ip-city'))
  const region = decode(
    h.get('cf-region') || h.get('x-vercel-ip-country-region')
  )

  return {
    ip,
    userAgent: h.get('user-agent') || undefined,
    geo:
      country && country !== 'XX' && country !== 'T1'
        ? { country, city, region }
        : undefined,
    timeZone:
      validTimeZone(clientTimeZone) ||
      validTimeZone(h.get('cf-timezone')) ||
      validTimeZone(h.get('x-vercel-ip-timezone')),
  }
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

export function describeLocation(geo: RequestLoginContext['geo']) {
  if (!geo?.country) return null
  let country = geo.country
  try {
    country = regionNames.of(geo.country.toUpperCase()) ?? geo.country
  } catch {}
  return [geo.city, geo.region, country].filter(Boolean).join(', ')
}

export function formatLoginTime(date: Date, timeZone?: string) {
  const format = (zone: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: zone,
      timeZoneName: 'short',
    }).format(date)
  try {
    return format(timeZone || 'UTC')
  } catch {
    return format('UTC')
  }
}

export function isLocalAddress(ip: string | undefined) {
  if (!ip) return false
  const v4 = ip.replace(/^::ffff:/, '')
  return (
    v4 === '::1' ||
    v4 === '127.0.0.1' ||
    /^10\./.test(v4) ||
    /^192\.168\./.test(v4) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(v4) ||
    /^f[cd][0-9a-f]{2}:/i.test(v4)
  )
}

export function describeLoginContext(context: RequestLoginContext, date: Date) {
  return {
    loginDevice: describeDevice(context.userAgent) ?? 'Unknown device',
    loginLocation:
      describeLocation(context.geo) ??
      (isLocalAddress(context.ip) ? 'Local network' : undefined),
    loginTime: formatLoginTime(date, context.timeZone),
    loginIp: context.ip,
  }
}
