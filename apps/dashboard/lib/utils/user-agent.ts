export interface ParsedUserAgent {
  device: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown'
  browser: string
  os: string
}

export function parseUserAgent(
  userAgent: string | null | undefined
): ParsedUserAgent {
  if (!userAgent)
    return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' }
  const ua = userAgent.toLowerCase()

  let device: ParsedUserAgent['device'] = 'Desktop'
  if (ua.includes('ipad') || ua.includes('tablet')) device = 'Tablet'
  else if (
    ua.includes('mobile') ||
    ua.includes('iphone') ||
    ua.includes('android')
  )
    device = 'Mobile'

  // Phones and tablets first: their user agents also mention Linux or Mac OS
  let os = 'Unknown'
  if (ua.includes('android')) os = 'Android'
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'
  else if (ua.includes('cros')) os = 'ChromeOS'
  else if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac os') || ua.includes('macos')) os = 'macOS'
  else if (ua.includes('linux')) os = 'Linux'

  // Order matters: Edge and Opera also say Chrome, and Chrome also says Safari
  let browser = 'Unknown'
  if (ua.includes('edg/')) browser = 'Edge'
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera'
  else if (ua.includes('firefox') || ua.includes('fxios')) browser = 'Firefox'
  else if (ua.includes('chrome') || ua.includes('crios')) browser = 'Chrome'
  else if (ua.includes('safari')) browser = 'Safari'
  else if (ua.includes('flicker') || ua.includes('tauri')) browser = 'Flicker'

  return { device, browser, os }
}

/** "Chrome on Windows", or null when nothing useful is known. */
export function describeDevice(userAgent: string | null | undefined) {
  const { browser, os } = parseUserAgent(userAgent)
  if (browser === 'Unknown' && os === 'Unknown') return null
  if (browser === 'Unknown') return os
  if (os === 'Unknown') return browser
  return `${browser} on ${os}`
}
