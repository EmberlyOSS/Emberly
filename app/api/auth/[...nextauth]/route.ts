import { headers } from 'next/headers'
import NextAuth from 'next-auth/next'

import { authOptions } from '@/packages/lib/auth'

const handler = NextAuth(authOptions)

async function GET(req: Request, context: any) {
  // Capture request metadata for login tracking
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
             headersList.get('x-real-ip') ||
             headersList.get('cf-connecting-ip') ||
             null
  const userAgent = headersList.get('user-agent')
  
  // Store in global context for signIn callback to access
  globalThis.__nextAuthLoginContext = {
    ip,
    userAgent,
    geo: null, // Could be populated from IP geolocation service
  }

  return handler(req, context)
}

async function POST(req: Request, context: any) {
  // Capture request metadata for login tracking
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
             headersList.get('x-real-ip') ||
             headersList.get('cf-connecting-ip') ||
             null
  const userAgent = headersList.get('user-agent')
  
  // Store in global context for signIn callback to access
  globalThis.__nextAuthLoginContext = {
    ip,
    userAgent,
    geo: null, // Could be populated from IP geolocation service
  }

  return handler(req, context)
}

export { GET, POST }
