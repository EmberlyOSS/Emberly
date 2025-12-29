import { z } from 'zod'

export enum FileVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export const FileUploadSchema = z.object({
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional().default('PUBLIC'),
  password: z.string().optional().nullable(),
})

export type FileUploadRequest = z.infer<typeof FileUploadSchema>

const FileLikeSchema = (() => {
  const globalFile =
    typeof globalThis !== 'undefined' &&
      typeof (globalThis as { File?: typeof File }).File !== 'undefined'
      ? (globalThis as { File: typeof File }).File
      : null

  if (globalFile) {
    return z.instanceof(globalFile, { message: 'No file provided' })
  }

  return z.custom<File>(
    (val): val is File =>
      typeof val === 'object' &&
      val !== null &&
      typeof (val as { arrayBuffer?: unknown }).arrayBuffer === 'function',
    { message: 'No file provided' }
  )
})()

export const FileUploadFormDataSchema = z.object({
  file: FileLikeSchema,
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  password: z.string().optional().nullable(),
})

export type FileUploadFormData = z.infer<typeof FileUploadFormDataSchema>

export interface FileMetadata {
  id: string
  name: string
  urlPath: string
  mimeType: string
  size: number
  uploadedAt: Date
  visibility: string
  views: number
  downloads: number
  hasPassword: boolean
  expiresAt?: Date | null
}

export interface FileUploadResponse {
  url: string
  name: string
  size: number
  type: string
}

export const FileListQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val) || 1)
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val) || 24)
    .optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['newest', 'oldest', 'largest', 'smallest', 'name'])
    .optional(),
  types: z
    .string()
    .transform((val) => val.split(','))
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  visibility: z
    .string()
    .transform((val) => val.split(','))
    .optional(),
})

export type FileListQuery = z.infer<typeof FileListQuerySchema>

export interface FileListResponse {
  files: FileMetadata[]
  pagination: {
    total: number
    pageCount: number
    page: number
    limit: number
  }
}

export interface FileTypesResponse {
  types: string[]
}
