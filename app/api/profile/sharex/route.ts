import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'
import { loggers } from '@/lib/logger'
import { urlForHost } from '@/lib/utils'

const logger = loggers.users

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        uploadToken: true,
        name: true,
        preferredUploadDomain: true,
      },
    })

    if (!user) {
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

    const preferredHost = user.preferredUploadDomain
      ? urlForHost(user.preferredUploadDomain).replace(/\/+$/, '')
      : null
    const requestBaseUrl = preferredHost || normalizedBaseUrl

    const config = {
      Version: '15.0.0',
      Name: 'Emberly',
      DestinationType: 'ImageUploader, TextUploader, FileUploader',
      RequestMethod: 'POST',
      RequestURL: `${requestBaseUrl}/api/files`,
      Headers: {
        Authorization: `Bearer ${user.uploadToken}`,
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
