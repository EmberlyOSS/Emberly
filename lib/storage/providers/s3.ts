import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { Writable as NodeWritable, Readable } from 'node:stream'

import { loggers } from '@/lib/logger'
import { urlForHost } from '@/lib/utils'

import type { RangeOptions, S3Config, StorageProvider } from '../types'

const logger = loggers.storage.getChildLogger('s3')

export class S3StorageProvider implements StorageProvider {
  private client: S3Client
  private bucket: string
  private endpoint?: string
  private forcePathStyle?: boolean

  constructor(config: S3Config) {
    if (!config.bucket) throw new Error('S3 bucket name is required')
    if (!config.region) throw new Error('S3 region is required')
    if (!config.accessKeyId) throw new Error('S3 access key ID is required')
    if (!config.secretAccessKey)
      throw new Error('S3 secret access key is required')

    this.bucket = config.bucket
    this.endpoint = config.endpoint
    const clientConfig: any = {
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      maxAttempts: 3,
      retryMode: 'adaptive',
    }

    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint
      clientConfig.forcePathStyle = config.forcePathStyle ?? false
      this.forcePathStyle = config.forcePathStyle ?? false
    }

    this.client = new S3Client(clientConfig)
    logger.info('S3 client initialized', {
      bucket: this.bucket,
      endpoint: this.endpoint,
      forcePathStyle: this.forcePathStyle ?? false,
      region: config.region,
    })
  }

  // Normalize a filesystem-style path to an S3 key. This fixes Windows
  // backslash paths (e.g. `uploads\\ibNxG\\file.png`) by converting them to
  // forward slashes and removing any leading `uploads/` prefix.
  private normalizeKey(path: string): string {
    return path
      .replace(/^\/+/, '')
      .replace(/^uploads[\\/]/, '')
      .replace(/\\/g, '/')
  }

  async uploadFile(
    file: Buffer,
    path: string,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    const key = this.normalizeKey(path)

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: mimeType,
          ACL: key.startsWith('avatars/') ? 'public-read' : undefined,
          Metadata: metadata,
        })
      )
    } catch (err) {
      const errAny = err as any
      logger.error('S3 put object failed', errAny, {
        key,
        message: errAny?.message,
        awsMetadata: errAny?.$metadata,
      })
      throw err
    }
  }

  async deleteFile(path: string): Promise<void> {
    const key = this.normalizeKey(path)

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    )
  }

  async getFileStream(path: string, range?: RangeOptions): Promise<Readable> {
    const key = this.normalizeKey(path)

    // Diagnostic info: log the effective key and endpoint (no credentials).
    logger.info('S3 GetObject request', {
      key,
      bucket: this.bucket,
      endpoint: this.endpoint,
      forcePathStyle: this.forcePathStyle ?? false,
    })

    const options: { Range?: string } = {}
    if (range) {
      options.Range = `bytes=${range.start || 0}-${typeof range.end !== 'undefined' ? range.end : ''}`
    }

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ...options,
        })
      )

      if (!response.Body) {
        throw new Error('No file body returned from S3')
      }

      const stream = response.Body as Readable

      // Set high water mark to prevent buffering issues
      if (stream.setMaxListeners) {
        stream.setMaxListeners(0)
      }

      // Don't pause/resume - let the stream flow naturally
      stream.on('error', (error) => {
        const err = error as Error & { code?: string }

        // Only log if it's not a client disconnect during active streaming
        if (
          err.code !== 'ECONNRESET' &&
          err.code !== 'ERR_STREAM_PREMATURE_CLOSE' &&
          !err.message?.includes('aborted')
        ) {
          logger.error(`S3 stream error for ${key}`, err, {
            key,
            code: err.code,
          })
        }
      })

      return stream
    } catch (error) {
      const errAny = error as any
      logger.error(`Failed to get S3 stream for ${key}`, errAny, {
        key,
        code: errAny?.code || errAny?.name,
        message: errAny?.message,
        awsMetadata: errAny?.$metadata,
      })
      throw error
    }
  }

  async getFileUrl(
    path: string,
    expiresIn: number = 3600,
    hostOverride?: string
  ): Promise<string> {
    const key = this.normalizeKey(path)

    if (key.startsWith('avatars/')) {
      if (hostOverride) {
        const host = hostOverride.replace(/\/$/, '')
        const base = host.startsWith('http') ? host : urlForHost(host)
        return `${base}/${key}`
      }
      if (this.endpoint) {
        return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`
      }
      return `https://${this.bucket}.s3.amazonaws.com/${key}`
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    const downloadExpiresIn = expiresIn > 3600 ? expiresIn : 21600
    try {
      if (hostOverride) {
        // If caller requests a host override (custom domain), return a
        // non-signed URL using that host. Use `urlForHost` so localhost and
        // development hosts can be served over http when appropriate.
        const host = hostOverride.replace(/\/$/, '')
        const base = host.startsWith('http') ? host : urlForHost(host)
        return `${base}/${key}`
      }

      return await getSignedUrl(this.client, command, {
        expiresIn: downloadExpiresIn,
      })
    } catch (error) {
      const errAny = error as any
      logger.error('Failed to generate signed URL', errAny, {
        key,
        message: errAny?.message,
        awsMetadata: errAny?.$metadata,
      })
      // Last-resort fallback: if an endpoint is configured, return a
      // path-style URL so the app can still return a usable URL instead
      // of failing outright. The caller may still encounter 403s from the
      // object server, but this avoids throwing here.
      if (this.endpoint) {
        return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`
      }
      throw error
    }
  }

  async getDownloadUrl(
    path: string,
    filename?: string,
    hostOverride?: string
  ): Promise<string> {
    const key = this.normalizeKey(path)

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: filename
        ? `attachment; filename="${filename}"`
        : undefined,
    })
    if (hostOverride) {
      const host = hostOverride.replace(/\/$/, '')
      const base = host.startsWith('http') ? host : urlForHost(host)
      return `${base}/${key}`
    }

    return await getSignedUrl(this.client, command, { expiresIn: 21600 })
  }

  async getFileSize(path: string): Promise<number> {
    const key = this.normalizeKey(path)

    // Diagnostic info: log the effective key and endpoint used for HEAD.
    logger.info('S3 HeadObject request', {
      key,
      bucket: this.bucket,
      endpoint: this.endpoint,
      forcePathStyle: this.forcePathStyle ?? false,
    })

    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    const response = await this.client.send(command)
    return response.ContentLength || 0
  }

  async uploadChunkedFile(
    chunksDir: string,
    targetPath: string,
    mimeType: string
  ): Promise<void> {
    const key = this.normalizeKey(targetPath)
    const createResponse = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
      })
    )

    const uploadId = createResponse.UploadId
    if (!uploadId) {
      throw new Error('Failed to create multipart upload')
    }

    try {
      const { readdir, readFile } = await import('fs/promises')
      const { join } = await import('path')

      const chunkFiles = await readdir(chunksDir)
      const sortedChunks = chunkFiles
        .filter((file) => file.startsWith('chunk-'))
        .sort((a, b) => {
          const numA = parseInt(a.split('-')[1])
          const numB = parseInt(b.split('-')[1])
          return numA - numB
        })

      const uploadPromises = sortedChunks.map(async (chunkFile, index) => {
        const chunkPath = join(chunksDir, chunkFile)
        const chunkData = await readFile(chunkPath)
        const response = await this.client.send(
          new UploadPartCommand({
            Bucket: this.bucket,
            Key: key,
            PartNumber: index + 1,
            UploadId: uploadId,
            Body: chunkData,
          })
        )

        if (!response.ETag) {
          throw new Error('Missing ETag in upload part response')
        }

        return {
          ETag: response.ETag,
          PartNumber: index + 1,
        }
      })

      const parts = await Promise.all(uploadPromises)

      await this.client.send(
        new CompleteMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: { Parts: parts },
        })
      )
    } catch (error) {
      await this.client.send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
        })
      )
      throw error
    }
  }

  async createWriteStream(
    path: string,
    mimeType: string
  ): Promise<NodeWritable> {
    const key = this.normalizeKey(path)
    const { PassThrough } = await import('stream')
    const passThrough = new PassThrough()

    const createResponse = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
      })
    )

    const uploadId = createResponse.UploadId
    if (!uploadId) {
      throw new Error('Failed to create multipart upload')
    }

    let currentPartBuffer = Buffer.alloc(0)
    let currentPartNumber = 1
    let totalBytesUploaded = 0
    let isUploading = false
    let hasEnded = false
    let uploadError: Error | null = null
    const parts: { ETag: string; PartNumber: number }[] = []
    const maxPartSize = 5 * 1024 * 1024
    const maxConcurrentUploads = 3
    let activeUploads = 0

    const getPresignedUrl = async (partNumber: number): Promise<string> => {
      const command = new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      })
      return getSignedUrl(this.client, command, { expiresIn: 3600 })
    }

    const uploadPart = async (data: Buffer, partNum: number): Promise<void> => {
      try {
        activeUploads++

        const presignedUrl = await getPresignedUrl(partNum)

        // Retry transient failures (network / 5xx / some 4xx) with exponential backoff
        let attempt = 0
        let response: Response | null = null
        const maxAttempts = 3
        while (attempt < maxAttempts) {
          try {
            response = await fetch(presignedUrl, {
              method: 'PUT',
              body: data as BodyInit,
            })

            if (response.ok) break

            const bodyText = await response.text().catch(() => '')
            logger.warn('Presigned upload part non-ok response', {
              key,
              part: partNum,
              attempt,
              status: response.status,
              statusText: response.statusText,
              body: bodyText.slice(0, 200),
            })
            // Retry on server errors and some client errors (502, 503, 504, 429)
            if ([502, 503, 504, 429].includes(response.status)) {
              attempt++
              const backoff =
                Math.pow(2, attempt) * 100 + Math.floor(Math.random() * 100)
              await new Promise((r) => setTimeout(r, backoff))
              continue
            }

            // otherwise, do not retry
            break
          } catch (err) {
            logger.warn('Presigned upload part fetch error', {
              key,
              part: partNum,
              attempt,
              error: err,
            })
            attempt++
            const backoff =
              Math.pow(2, attempt) * 100 + Math.floor(Math.random() * 100)
            await new Promise((r) => setTimeout(r, backoff))
            continue
          }
        }

        if (!response || !response.ok) {
          const status = response ? response.status : 'NO_RESPONSE'
          const statusText = response ? response.statusText : ''
          throw new Error(
            `Failed to upload part ${partNum}: ${status} ${statusText}`
          )
        }

        const etag = response.headers.get('ETag')
        if (!etag) {
          throw new Error('Missing ETag in upload part response')
        }

        parts.push({
          ETag: etag.replace(/['"]/g, ''),
          PartNumber: partNum,
        })

        totalBytesUploaded += data.length

        passThrough.emit('s3Progress', {
          part: partNum,
          uploaded: totalBytesUploaded,
          etag,
        })
      } catch (error) {
        uploadError = error as Error
        throw error
      } finally {
        activeUploads--
        if (hasEnded && activeUploads === 0) {
          completeUpload().catch((error) => {
            passThrough.destroy(error as Error)
          })
        }
      }
    }

    passThrough.on('data', async (chunk: Buffer) => {
      if (uploadError) {
        passThrough.destroy(uploadError)
        return
      }

      currentPartBuffer = Buffer.concat([currentPartBuffer, chunk])

      while (
        currentPartBuffer.length >= maxPartSize &&
        activeUploads < maxConcurrentUploads &&
        !isUploading
      ) {
        isUploading = true
        const partData = currentPartBuffer.subarray(0, maxPartSize)
        currentPartBuffer = currentPartBuffer.subarray(maxPartSize)

        try {
          await uploadPart(partData, currentPartNumber++)
        } finally {
          isUploading = false
        }
      }
    })

    passThrough.on('end', () => {
      hasEnded = true
      if (activeUploads === 0) {
        completeUpload().catch((error) => {
          passThrough.destroy(error as Error)
        })
      }
    })

    const completeUpload = async () => {
      try {
        if (currentPartBuffer.length > 0) {
          await uploadPart(currentPartBuffer, currentPartNumber)
          currentPartBuffer = Buffer.alloc(0)
        }

        while (activeUploads > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        const sortedParts = parts.sort((a, b) => a.PartNumber - b.PartNumber)

        await this.client.send(
          new CompleteMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: {
              Parts: sortedParts,
            },
          })
        )

        await this.client.send(
          new HeadObjectCommand({
            Bucket: this.bucket,
            Key: key,
          })
        )
        passThrough.emit('s3Complete')
      } catch (error) {
        try {
          await this.client.send(
            new AbortMultipartUploadCommand({
              Bucket: this.bucket,
              Key: key,
              UploadId: uploadId,
            })
          )
        } catch (abortError) {
          logger.error('Error aborting multipart upload', abortError as Error, {
            key,
            uploadId,
          })
        }
        uploadError = error as Error
        passThrough.destroy(error as Error)
      }
    }

    passThrough.on('error', async (error) => {
      logger.error('Stream error during multipart upload', error as Error, {
        key,
      })
      try {
        await this.client.send(
          new AbortMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
          })
        )
      } catch (abortError) {
        logger.error(
          'Error aborting multipart upload after stream error',
          abortError as Error,
          {
            key,
            uploadId,
          }
        )
      }
    })

    return passThrough
  }

  async renameFolder(oldPath: string, newPath: string): Promise<void> {
    const oldPrefix = this.normalizeKey(oldPath).replace(/\/$/, '') + '/'
    const newPrefix = this.normalizeKey(newPath).replace(/\/$/, '') + '/'

    let continuationToken: string | undefined

    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: oldPrefix,
        ContinuationToken: continuationToken,
      })

      const response = await this.client.send(listCommand)
      const objects = response.Contents || []

      await Promise.all(
        objects.map(async (object) => {
          if (!object.Key) return

          const newKey = object.Key.replace(oldPrefix, newPrefix)
          await this.client.send(
            new CopyObjectCommand({
              Bucket: this.bucket,
              CopySource: `${this.bucket}/${object.Key}`,
              Key: newKey,
            })
          )

          await this.client.send(
            new DeleteObjectCommand({
              Bucket: this.bucket,
              Key: object.Key,
            })
          )
        })
      )

      continuationToken = response.NextContinuationToken
    } while (continuationToken)
  }

  async initializeMultipartUpload(
    path: string,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const key = this.normalizeKey(path)

    let response
    try {
      response = await this.client.send(
        new CreateMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: mimeType,
          Metadata: metadata,
        })
      )
    } catch (err) {
      const errAny = err as any
      logger.error('S3 initialize multipart upload failed', errAny, {
        key,
        message: errAny?.message,
        awsMetadata: errAny?.$metadata,
      })
      throw err
    }

    if (!response.UploadId) {
      throw new Error('Failed to initialize multipart upload')
    }

    return response.UploadId
  }

  async getPresignedPartUploadUrl(
    path: string,
    uploadId: string,
    partNumber: number
  ): Promise<string> {
    const key = this.normalizeKey(path)

    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    })

    return getSignedUrl(this.client, command, { expiresIn: 3600 })
  }

  async completeMultipartUpload(
    path: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[]
  ): Promise<void> {
    const key = this.normalizeKey(path)

    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
        },
      })
    )
  }

  async uploadPart(
    path: string,
    uploadId: string,
    partNumber: number,
    data: Buffer
  ): Promise<{ ETag: string }> {
    const key = this.normalizeKey(path)

    const response = await this.client.send(
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: data,
      })
    )

    if (!response.ETag) {
      throw new Error('Missing ETag in upload part response')
    }

    return { ETag: response.ETag }
  }
}
