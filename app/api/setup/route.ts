import { NextResponse } from 'next/server'

import { hash } from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { updateConfig } from '@/packages/lib/config'
import { prisma } from '@/packages/lib/database/prisma'
import { invalidateSetupCache } from '@/packages/lib/database/setup'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.startup

function generateUrlId() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  return Array.from({ length: 5 }, () => {
    return alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  }).join('')
}

const setupSchema = z.object({
  admin: z.object({
    name: z.string()
      .min(2, 'Username must be at least 2 characters')
      .max(50, 'Username must be at most 50 characters')
      .refine(
        (name) => !name.includes('@'),
        'Username cannot contain @ symbol (looks like an email)'
      )
      .refine(
        (name) => name.trim().length >= 2,
        'Username cannot be only whitespace'
      ),
    email: z.string().email(),
    password: z.string().min(8),
  }),
  storage: z.object({
    provider: z.enum(['local', 's3']),
    s3: z.object({
      bucket: z.string(),
      region: z.string(),
      accessKeyId: z.string(),
      secretAccessKey: z.string(),
      endpoint: z.string().optional(),
      forcePathStyle: z.boolean().default(false),
    }),
  }),
  registrations: z.object({
    enabled: z.boolean(),
    disabledMessage: z.string().optional(),
  }),
})

export async function POST(req: Request) {
  try {
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Setup already completed' },
        { status: 400 }
      )
    }

    const data = await req.json()
    const validatedData = setupSchema.parse(data)

    let urlId = generateUrlId()
    let isUnique = false
    while (!isUnique) {
      const existing = await prisma.user.findUnique({
        where: { urlId },
      })
      if (!existing) {
        isUnique = true
      } else {
        urlId = generateUrlId()
      }
    }

    const hashedPassword = await hash(validatedData.admin.password, 10)
    const user = await prisma.user.create({
      data: {
        name: validatedData.admin.name,
        email: validatedData.admin.email,
        password: hashedPassword,
        role: 'SUPERADMIN',
        emailVerified: new Date(),
        urlId,
        uploadToken: uuidv4(),
      },
    })

    await updateConfig({
      settings: {
        general: {
          setup: {
            completed: true,
            completedAt: new Date().toISOString(),
          },
          storage: {
            provider: validatedData.storage.provider,
            s3: validatedData.storage.s3,
            quotas: {
              enabled: false,
              default: {
                value: 10,
                unit: 'GB',
              },
            },
            maxUploadSize: {
              value: 100,
              unit: 'MB',
            },
          },
          registrations: {
            enabled: validatedData.registrations.enabled,
            disabledMessage: validatedData.registrations.disabledMessage || '',
          },
          credits: {
            showFooter: true,
          },
          ocr: {
            enabled: true,
          },
        },
        appearance: {
          theme: 'default-dark',
          favicon: null,
          customColors: {},
        },
        advanced: {
          customCSS: '',
          customHead: '',
        },
      },
    })

    // Invalidate the setup cache so the next check reflects the new state
    invalidateSetupCache()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    logger.error('Setup error', error as Error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to complete setup' },
      { status: 500 }
    )
  }
}
