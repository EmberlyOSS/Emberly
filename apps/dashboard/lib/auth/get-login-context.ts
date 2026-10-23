import { headers } from 'next/headers'

/**
 * Extract login context (IP, user agent, geo) from request headers
 * These are set by the middleware
 */
export async function getLoginContextFromHeaders() {
  const headersList = await headers()

  const ip = headersList.get('x-client-ip')
  const userAgent = headersList.get('x-client-user-agent')
  const country = headersList.get('x-client-country')
  const city = headersList.get('x-client-city')

  return {
    ip: ip && ip !== 'unknown' ? ip : undefined,
    userAgent: userAgent || undefined,
    geo:
      country || city
        ? {
            country: country || undefined,
            city: city || undefined,
          }
        : null,
  }
}
