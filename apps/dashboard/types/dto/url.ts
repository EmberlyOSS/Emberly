import { z } from 'zod'
import { isSafeUrl } from '@/lib/security/ssrf'

export const CreateUrlSchema = z.object({
  url: z.string().url().refine(isSafeUrl, {
    message: 'URL is not allowed (internal or private address)',
  }),
  domain: z.string().trim().toLowerCase().max(253).nullable().optional(),
})

export type CreateUrlRequest = z.infer<typeof CreateUrlSchema>

export interface UrlResponse {
  id: string
  shortCode: string
  targetUrl: string
  domain: string | null
  url: string
  createdAt: Date
  clicks: number
  userId: string
}

export type CreateUrlResponse = UrlResponse

export interface UrlListResponse {
  urls: UrlResponse[]
  domains: string[]
  defaultDomain: string | null
}
