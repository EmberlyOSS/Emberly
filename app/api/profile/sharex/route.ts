import { NextResponse } from 'next/server'
import { requireAuth } from '@/packages/lib/auth/api-auth'


import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { urlForHost } from '@/packages/lib/utils'

const logger = loggers.users

export async function GET(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        uploadToken: true,
        name: true,
        preferredUploadDomain: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : process.env.NEXTAUTH_URL?.replace(/\/$/, '') || ''

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')

    try {
      new URL(normalizedBaseUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid server URL configuration' },
        { status: 500 }
      )
    }

    const preferredHost = dbUser.preferredUploadDomain
      ? urlForHost(dbUser.preferredUploadDomain).replace(/\/+$/, '')
      : null
    const requestBaseUrl = preferredHost || normalizedBaseUrl

    const config = {
      Version: '15.0.0',
      Name: 'Emberly',
      DestinationType: 'ImageUploader, TextUploader, FileUploader',
      RequestMethod: 'POST',
      RequestURL: `${requestBaseUrl}/api/files`,
      Headers: {
        Authorization: `Bearer ${dbUser.uploadToken}`,
      },
      Body: 'MultipartFormData',
      FileFormName: 'file',
      URL: '{json:data.url}',
      ThumbnailURL: '{json:data.url}',
      DeletionURL: '',
      ErrorMessage: '{json:error}',
    }

    // If the request came from a verified custom domain owned by the user,
    // override the generated RequestURL so ShareX uses that domain.
    try {
      const reqHost = (request.headers && (request.headers as Headers).get('host')) || null
      if (reqHost) {
        const hostNoPort = reqHost.replace(/:\d+$/, '')
        if (hostNoPort) {
          const hostRecord = await prisma.customDomain.findFirst({
            where: { domain: hostNoPort, userId: user.id, verified: true },
          })
          if (hostRecord) {
            const hostBase = urlForHost(hostNoPort).replace(/\/+$|\/$/g, '')
            config.RequestURL = `${hostBase}/api/files`
            logger.info('Overriding ShareX RequestURL to request host', {
              userId: user.id,
              requestHost: hostNoPort,
            })
          }
        }
      }
    } catch (err) {
      // ignore and keep default
    }

    const sanitizedName = (user.name || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')

    return new NextResponse(JSON.stringify(config, null, 2), {
      headers: {
        'Content-Disposition': `attachment; filename="${sanitizedName}-sharex.sxcu"`,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    logger.error('ShareX config generation error:', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
