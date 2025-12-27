export { cn, formatBytes, bytesToMB, formatFileSize } from './formatting'

export { updateProgress, clearProgress, getProgress } from './progress'
export { getFileDescription } from './metadata'

export function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays}d ago`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return `${diffInMonths}mo ago`

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}y ago`
}

export function urlForHost(host: string): string {
  if (!host) return ''
  const cleaned = host.replace(/\/+$/, '')
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://'))
    return cleaned

  // Allow http for localhost or when running in development
  const allowHttp =
    process.env.NODE_ENV === 'development' || process.env.ALLOW_HTTP === '1'
  if (
    cleaned.includes('localhost') ||
    cleaned.startsWith('127.') ||
    allowHttp
  ) {
    return `http://${cleaned}`
  }

  return `https://${cleaned}`
}
