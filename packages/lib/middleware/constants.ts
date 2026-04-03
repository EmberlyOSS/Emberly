export const FILE_URL_PATTERN =
  /^\/[A-Za-z0-9]{5}\/[^\/]+\.[^\/]+(?:\/raw|\/direct)?$/

export const SUPERADMIN_PATHS = [
  '/admin/logs',
  '/admin/email',
  '/admin/legal',
  '/admin/settings'
]

export const PROTECTED_PAGE_PATHS = [
  '/dashboard',
  '/profile',
]

export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi', 'mkv']
