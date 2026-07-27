export const FILE_URL_PATTERN =
  /^\/[A-Za-z0-9]{5}\/[^\/]+\.[^\/]+(?:\/raw|\/direct)?\/?$/

export const SUPERADMIN_PATHS = [
  '/admin/logs',
  '/admin/email',
  '/admin/legal',
  '/admin/settings',
]

export const PROTECTED_PAGE_PATHS = ['/dashboard', '/profile']

export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi', 'mkv']

// Cloud-only pages: billing, Nexium (squads/discovery), custom domains, and
// Emberly's own company/marketing content. Hidden and blocked entirely when
// EMBERLY_RUN_CLOUD is not set (self-hosted mode).
export const CLOUD_ONLY_PAGE_PATHS = [
  '/pricing',
  '/about',
  '/press',
  '/blog',
  '/changelogs',
  '/contact',
  '/discord',
  '/leaderboard',
  '/discovery',
  '/applications',
  '/dashboard/discovery',
  '/dashboard/squads',
  '/dashboard/domains',
  '/dashboard/bucket',
  '/legal',
  '/admin/products',
  '/admin/blog',
  '/admin/partners',
  '/admin/testimonials',
  '/admin/applications',
  '/admin/legal',
  '/admin/email',
]

// Mirrors CLOUD_ONLY_PAGE_PATHS for API routes. Note: /api/reports/squad is
// listed (not a blanket /api/reports) since /api/reports/[id] and
// /api/reports/content are the core abuse-report API and must stay available.
// /api/internal/domain-lookup is intentionally excluded — it's infra
// plumbing proxy.ts itself relies on for custom-domain host rewriting.
export const CLOUD_ONLY_API_PATHS = [
  '/api/payments',
  '/api/products',
  '/api/profile/billing-history',
  '/api/discovery',
  '/api/leaderboard',
  '/api/applications',
  '/api/reports/squad',
  '/api/domains',
  '/api/profile/upload-domain',
  '/api/partners',
  '/api/testimonials',
  '/api/admin/applications',
  '/api/legal',
  '/api/admin/email',
  '/api/admin/emails',
  '/api/admin/storage/buckets',
  '/api/admin/storage/linode',
  '/api/admin/storage/ovhcloud',
  '/api/admin/storage/squads',
  '/api/admin/storage/sync-buckets',
  '/api/admin/storage/users',
  '/api/admin/storage/vultr',
]
