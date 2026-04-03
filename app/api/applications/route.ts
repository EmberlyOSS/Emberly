import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'
import { loggers } from '@/packages/lib/logger'
import { ApplicationStatus, ApplicationType } from '@/prisma/generated/prisma/client'

const logger = loggers.api.getChildLogger('applications')

const VALID_STAFF_ROLES = ['moderator', 'developer', 'designer', 'support', 'other'] as const

const StaffAnswersSchema = z.object({
  why: z
    .string()
    .min(200, 'Why must be at least 200 characters')
    .max(2000, 'Why must be at most 2000 characters'),
  experience: z
    .string()
    .min(100, 'Experience must be at least 100 characters')
    .max(2000, 'Experience must be at most 2000 characters'),
  availability: z.union([z.string().min(1, 'Availability is required'), z.number()]),
  role: z.enum(VALID_STAFF_ROLES, {
    errorMap: () => ({ message: 'Role must be one of: moderator, developer, designer, support, other' }),
  }),
})

const PartnerAnswersSchema = z.object({
  website: z.string().url('Website must be a valid URL'),
  description: z
    .string()
    .min(100, 'Description must be at least 100 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  audience: z.union([z.string().min(1, 'Audience is required'), z.number()]),
  collaboration: z
    .string()
    .min(50, 'Collaboration must be at least 50 characters')
    .max(1000, 'Collaboration must be at most 1000 characters'),
})

const VerificationAnswersSchema = z.object({
  reason: z
    .string()
    .min(50, 'Reason must be at least 50 characters')
    .max(500, 'Reason must be at most 500 characters'),
  socialLinks: z.array(z.string()).optional(),
})

const BanAppealAnswersSchema = z.object({
  reason: z
    .string()
    .min(50, 'Reason must be at least 50 characters')
    .max(2000, 'Reason must be at most 2000 characters'),
  evidence: z.string().optional(),
})

const SubmitSchema = z.object({
  type: z.nativeEnum(ApplicationType, {
    errorMap: () => ({ message: 'Invalid application type' }),
  }),
  answers: z.record(z.string(), z.unknown()),
})

function validateAnswers(type: ApplicationType, answers: Record<string, unknown>) {
  switch (type) {
    case ApplicationType.STAFF:
      return StaffAnswersSchema.safeParse(answers)
    case ApplicationType.PARTNER:
      return PartnerAnswersSchema.safeParse(answers)
    case ApplicationType.VERIFICATION:
      return VerificationAnswersSchema.safeParse(answers)
    case ApplicationType.BAN_APPEAL:
      return BanAppealAnswersSchema.safeParse(answers)
  }
}

export async function GET(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return apiResponse(applications)
  } catch (error) {
    logger.error('Error fetching applications', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export async function POST(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const json = await req.json().catch(() => null)
    const parsed = SubmitSchema.safeParse(json)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    const { type, answers } = parsed.data

    // Validate answers for the specific application type
    const answersResult = validateAnswers(type, answers)
    if (!answersResult.success) {
      return apiError(answersResult.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    // BAN_APPEAL: user must actually be banned
    if (type === ApplicationType.BAN_APPEAL) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { bannedAt: true },
      })
      if (!dbUser?.bannedAt) {
        return apiError('You must be banned to submit a ban appeal', HTTP_STATUS.BAD_REQUEST)
      }
    }

    // No duplicate PENDING/REVIEWING application of the same type
    const duplicate = await prisma.application.findFirst({
      where: {
        userId: user.id,
        type,
        status: { in: [ApplicationStatus.PENDING, ApplicationStatus.REVIEWING] },
      },
    })
    if (duplicate) {
      return apiError(
        'You already have a pending application of this type',
        HTTP_STATUS.CONFLICT
      )
    }

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        type,
        answers: answersResult.data,
      },
    })

    void events.emit('application.submitted', {
      applicationId: application.id,
      userId: user.id,
      userName: user.name ?? 'Unknown',
      userEmail: user.email,
      type,
    })

    logger.info('Application submitted', {
      applicationId: application.id,
      userId: user.id,
      type,
    })

    return apiResponse(application)
  } catch (error) {
    logger.error('Error submitting application', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
