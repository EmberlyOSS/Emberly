import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.storage

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id } = await params

    logger.debug('Testing bucket connection', { bucketId: id })
    const bucket = await prisma.storageBucket.findUnique({
      where: { id },
      select: {
        id: true,
        provider: true,
        s3Bucket: true,
        s3Region: true,
        s3AccessKeyId: true,
        s3SecretKey: true,
        s3Endpoint: true,
        s3ForcePathStyle: true,
      },
    })
    logger.debug('Bucket lookup result', { bucketId: id, found: !!bucket })
    if (!bucket) return apiError('Bucket not found', HTTP_STATUS.NOT_FOUND)

    if (bucket.provider !== 's3') {
      return apiResponse({
        ok: true,
        message: 'Local storage — no remote connection to test',
      })
    }

    if (
      !bucket.s3Bucket ||
      !bucket.s3Region ||
      !bucket.s3AccessKeyId ||
      !bucket.s3SecretKey
    ) {
      return apiResponse({
        ok: false,
        message: 'Missing S3 credentials — fill in all required fields first',
      })
    }

    const client = new S3Client({
      region: bucket.s3Region,
      credentials: {
        accessKeyId: bucket.s3AccessKeyId,
        secretAccessKey: bucket.s3SecretKey,
      },
      ...(bucket.s3Endpoint && {
        endpoint: bucket.s3Endpoint,
        forcePathStyle: bucket.s3ForcePathStyle,
      }),
      requestHandler: { requestTimeout: 10000, connectionTimeout: 8000 },
      maxAttempts: 1,
    })

    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket.s3Bucket }))
      return apiResponse({
        ok: true,
        message: `Connected — bucket "${bucket.s3Bucket}" is accessible`,
      })
    } catch (err: any) {
      if (err?.$metadata?.httpStatusCode === 404) {
        return apiResponse({
          ok: false,
          message: `Bucket "${bucket.s3Bucket}" not found`,
        })
      }
      if (err?.$metadata?.httpStatusCode === 403) {
        return apiResponse({
          ok: false,
          message: 'Access denied — check credentials and bucket policy',
        })
      }
      return apiResponse({
        ok: false,
        message: 'S3 connection failed',
        detail: err?.message ?? String(err),
      })
    } finally {
      client.destroy()
    }
  } catch (error) {
    logger.error('Failed to test storage bucket', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
