import { z } from 'zod'
import { isSafeUrl } from '@/packages/lib/security/ssrf'

export const CreateUrlSchema = z.object({
  url: z.string().url().refine(isSafeUrl, {
    message: 'URL is not allowed (internal or private address)',
  }),
})

export type CreateUrlRequest = z.infer<typeof CreateUrlSchema>

export interface UrlResponse {
  id: string
  shortCode: string
  targetUrl: string
  createdAt: Date
  clicks: number
  userId: string
}

export interface CreateUrlResponse {
  id: string
  shortCode: string
  targetUrl: string
  createdAt: Date
  clicks: number
  userId: string
}

export interface UrlListResponse {
  urls: UrlResponse[]
}
