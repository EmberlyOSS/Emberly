import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'

import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/api-auth'
import { getConfig } from '@/lib/config'
import { loggers } from '@/lib/logger'

const logger = loggers.storage

interface S3TestCredentials {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string
  forcePathStyle?: boolean
}

async function testS3Connection(creds: S3TestCredentials): Promise<{ ok: boolean; message: string; detail?: string }> {
  if (!creds.bucket) return { ok: false, message: 'Bucket name is required' }
  if (!creds.region) return { ok: false, message: 'Region is required' }
  if (!creds.accessKeyId) return { ok: false, message: 'Access Key ID is required' }
  if (!creds.secretAccessKey) return { ok: false, message: 'Secret Access Key is required' }

  const client = new S3Client({
    region: creds.region,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
    },
    ...(creds.endpoint && {
      endpoint: creds.endpoint,
      forcePathStyle: creds.forcePathStyle ?? false,
    }),
    requestHandler: { requestTimeout: 10000, connectionTimeout: 8000 },
    maxAttempts: 1,
  })

  try {
    await client.send(new HeadBucketCommand({ Bucket: creds.bucket }))
    return { ok: true, message: `Connected — bucket "${creds.bucket}" is accessible` }
  } catch (err: any) {
    if (err?.name === 'NoSuchBucket' || err?.$metadata?.httpStatusCode === 404) {
      return { ok: false, message: `Bucket "${creds.bucket}" not found` }
    }
    if (err?.$metadata?.httpStatusCode === 403) {
      return { ok: false, message: 'Access denied — check your credentials and bucket policy' }
    }
    if (err?.name === 'InvalidSignatureException' || err?.$metadata?.httpStatusCode === 400) {
      return { ok: false, message: 'Invalid credentials or region' }
    }
    return { ok: false, message: 'Failed to connect to S3', detail: err?.message ?? String(err) }
  } finally {
    client.destroy()
  }
}

export async function POST(req: Request) {
  try {
    const { user, response } = await requireAdmin(req)
    if (response) return response

    const body = await req.json().catch(() => ({}))

    // If credentials are provided in body, test those directly (for "Test before save")
    // If not, test the currently-saved config
    let creds: S3TestCredentials

    if (body?.bucket || body?.region || body?.accessKeyId) {
      creds = body as S3TestCredentials
    } else {
      const config = await getConfig()
      const s = config.settings.general.storage
      if (s.provider !== 's3') {
        return apiResponse({ ok: true, message: 'Local storage is active — no connection test needed' })
      }
      creds = {
        bucket: s.s3.bucket,
        region: s.s3.region,
        accessKeyId: s.s3.accessKeyId,
        secretAccessKey: s.s3.secretAccessKey,
        endpoint: s.s3.endpoint,
        forcePathStyle: s.s3.forcePathStyle,
      }
    }

    const result = await testS3Connection(creds)
    return apiResponse(result)
  } catch (error) {
    logger.error('Storage test failed', error as Error)
    return apiError('Internal server error')
  }
}

