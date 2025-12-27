import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { loggers } from '@/packages/lib/logger'

const logger = loggers.middleware

export interface LoggingContext {
  userId?: string
  sessionId?: string
  requestId?: string
  [key: string]: unknown
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export async function withLogging<T>(
  req: NextRequest,
  handler: (context: LoggingContext) => Promise<NextResponse<T>>
): Promise<NextResponse<T>> {
  const startTime = Date.now()
  const requestId = generateRequestId()

  let userId: string | undefined
  let sessionId: string | undefined

  try {
    // Optimization: Only try to get session if a session cookie exists in headers
    // This avoids expensive DB/token calls on public non-auth routes
    const cookieHeader = req.headers.get('cookie') || ''
    const hasSessionCookie = cookieHeader.includes('next-auth.session-token') || cookieHeader.includes('__Secure-next-auth.session-token')

    if (hasSessionCookie) {
        const session = await getServerSession()
        if (session?.user) {
          userId = (session.user as { id?: string }).id
          sessionId = (session as { sessionToken?: string }).sessionToken
        }
    }
  } catch (error) {
    // Silently fail session fetching for simple logging to avoid blocking response
    // logger.debug('Could not get session for logging', { error })
  }

  const context: LoggingContext = {
    requestId,
    userId,
    sessionId,
  }

  logger.logRequest(req, context)

  try {
    const response = await handler(context)
    const duration = Date.now() - startTime

    logger.logResponse(req, response.status, duration, {
      requestId,
      userId,
    })

    response.headers.set('X-Request-Id', requestId)

    return response
  } catch (error) {
    const duration = Date.now() - startTime

    logger.error('Request handler error', error as Error, {
      requestId,
      userId,
      duration,
      method: req.method,
      url: req.url,
    })

    const statusCode = (error as { statusCode?: number })?.statusCode || 500
    const message =
      error instanceof Error ? error.message : 'Internal server error'

    logger.logResponse(req, statusCode, duration, {
      requestId,
      userId,
      error: message,
    })

    return NextResponse.json(
      {
        error: message,
        requestId,
      },
      {
        status: statusCode,
        headers: {
          'X-Request-Id': requestId,
        },
      }
    ) as NextResponse<T>
  }
}

export function createApiLogger(routeName: string) {
  return loggers.api.getChildLogger(routeName)
}
