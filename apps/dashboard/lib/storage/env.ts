import type { S3Config } from './types'

const read = (name: string) => process.env[name]?.trim() || undefined

export function envS3Config(): S3Config | null {
  if (read('STORAGE_PROVIDER')?.toLowerCase() !== 's3') return null

  const bucket = read('S3_BUCKET')
  const accessKeyId = read('S3_ACCESS_KEY_ID')
  const secretAccessKey = read('S3_SECRET_ACCESS_KEY')
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'STORAGE_PROVIDER=s3 needs S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY'
    )
  }

  const endpoint = read('S3_ENDPOINT')
  return {
    bucket,
    accessKeyId,
    secretAccessKey,
    region: read('S3_REGION') ?? 'us-east-1',
    endpoint,
    publicEndpoint: read('S3_PUBLIC_ENDPOINT'),
    forcePathStyle: read('S3_FORCE_PATH_STYLE')
      ? read('S3_FORCE_PATH_STYLE') === 'true'
      : !!endpoint,
  }
}

export const isStorageManagedByEnv = () =>
  read('STORAGE_PROVIDER')?.toLowerCase() === 's3'
