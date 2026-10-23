import { appUrl } from '@/lib/config/env'
import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import { sendTemplateEmail, BucketCredentialsEmail } from '@/lib/emails'
import { loggers } from '@/lib/logger'

const logger = loggers.storage

interface Params {
  params: Promise<{ id: string }>
}

/** Assign or clear a storage bucket for a user. Body: { bucketId: string | null } */
export async function PUT(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id } = await params
    const body = await req.json()
    const bucketId = body?.bucketId ?? null

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (!user) return apiError('User not found', HTTP_STATUS.NOT_FOUND)

    if (bucketId) {
      const bucket = await prisma.storageBucket.findUnique({ where: { id: bucketId }, select: { id: true } })
      if (!bucket) return apiError('Storage bucket not found', HTTP_STATUS.NOT_FOUND)
    }

    await prisma.user.update({
      where: { id },
      data: { storageBucketId: bucketId },
    })

    // Send bucket credentials email when a bucket is assigned (not when cleared)
    if (bucketId) {
      try {
        const [updatedUser, bucket] = await Promise.all([
          prisma.user.findUnique({
            where: { id },
            select: { email: true, name: true },
          }),
          prisma.storageBucket.findUnique({
            where: { id: bucketId },
            select: {
              name: true,
              s3Bucket: true,
              s3Region: true,
              s3AccessKeyId: true,
            },
          }),
        ])

        if (updatedUser?.email && bucket) {
          const appBaseUrl = appUrl()
          sendTemplateEmail({
            to: updatedUser.email,
            subject: 'Your Emberly Storage Bucket is ready',
            template: BucketCredentialsEmail,
            props: {
              recipientName: updatedUser.name ?? undefined,
              bucketName: bucket.name,
              s3Bucket: bucket.s3Bucket,
              s3Region: bucket.s3Region,
              s3AccessKeyId: bucket.s3AccessKeyId,
              dashboardUrl: `${appBaseUrl}/dashboard/bucket`,
            },
          }).catch((err) =>
            logger.warn('Failed to send bucket credentials email', { error: err?.message }),
          )
        }
      } catch (err) {
        logger.warn('Could not send bucket credentials email', { error: (err as Error)?.message })
      }
    }

    return apiResponse({ userId: id, storageBucketId: bucketId })
  } catch (error) {
    logger.error('Failed to assign storage bucket to user', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
