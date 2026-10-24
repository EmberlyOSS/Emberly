import { appUrl } from '@/lib/config/env'
import type { MetadataRoute } from 'next'

import { listPosts } from '@/lib/blog'
import { isBillingEnabled } from '@/lib/features'
import { LEGAL_DOCUMENTS } from '@/lib/legal/documents'

export const dynamic = 'force-dynamic'

const BASE_URL = appUrl()

/** Static routes with priority + changefreq hints */
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: '/',
    priority: 1.0,
    changeFrequency: 'weekly',
    lastModified: new Date(),
  },
  {
    url: '/pricing',
    priority: 0.9,
    changeFrequency: 'weekly',
    lastModified: new Date(),
  },
  {
    url: '/about',
    priority: 0.8,
    changeFrequency: 'monthly',
    lastModified: new Date(),
  },
  {
    url: '/blog',
    priority: 0.8,
    changeFrequency: 'daily',
    lastModified: new Date(),
  },
  {
    url: '/legal',
    priority: 0.6,
    changeFrequency: 'monthly',
    lastModified: new Date(),
  },
  {
    url: '/downloads',
    priority: 0.8,
    changeFrequency: 'weekly',
    lastModified: new Date(),
  },
  {
    url: '/changelogs',
    priority: 0.7,
    changeFrequency: 'weekly',
    lastModified: new Date(),
  },
  {
    url: '/leaderboard',
    priority: 0.7,
    changeFrequency: 'daily',
    lastModified: new Date(),
  },
  {
    url: '/discovery',
    priority: 0.7,
    changeFrequency: 'daily',
    lastModified: new Date(),
  },
  {
    url: '/press',
    priority: 0.5,
    changeFrequency: 'monthly',
    lastModified: new Date(),
  },
  {
    url: '/contact',
    priority: 0.5,
    changeFrequency: 'monthly',
    lastModified: new Date(),
  },
  {
    url: '/discord',
    priority: 0.5,
    changeFrequency: 'monthly',
    lastModified: new Date(),
  },
  {
    url: '/auth/login',
    priority: 0.4,
    changeFrequency: 'yearly',
    lastModified: new Date(),
  },
  {
    url: '/auth/register',
    priority: 0.4,
    changeFrequency: 'yearly',
    lastModified: new Date(),
  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const billingEnabled = await isBillingEnabled()
  const abs = (path: string) => `${BASE_URL}${path}`

  // Blog posts
  let blogRoutes: MetadataRoute.Sitemap = []
  try {
    const posts = await listPosts({
      publishedOnly: true,
      limit: 500,
      offset: 0,
    })
    blogRoutes = posts.map((post) => ({
      url: abs(`/blog/${post.slug}`),
      lastModified: post.updatedAt ?? post.publishedAt ?? new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {
    // non-fatal — omit blog routes if DB unavailable at build
  }

  // Legal pages
  const legalRoutes: MetadataRoute.Sitemap = LEGAL_DOCUMENTS.map((doc) => ({
    url: abs(`/legal/${doc.slug}`),
    lastModified: new Date(`${doc.updatedAt}T00:00:00Z`),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [
    ...STATIC_ROUTES.filter((r) => billingEnabled || r.url !== '/pricing').map(
      (r) => ({ ...r, url: abs(r.url as string) })
    ),
    ...blogRoutes,
    ...legalRoutes,
  ]
}
