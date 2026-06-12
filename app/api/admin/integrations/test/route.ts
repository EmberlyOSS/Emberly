import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { loggers } from '@/packages/lib/logger'
import nodemailer from 'nodemailer'

const logger = loggers.config

type IntegrationKey = 'stripe' | 'resend' | 'cloudflare' | 'discord' | 'github' | 'kener' | 'smtp' | 'vultr'

interface TestIntegrationBody {
  integration: IntegrationKey
  // Credentials to test — use currently-saved values from the config
  credentials: Record<string, string>
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase()

  if (host === 'localhost' || host === '::1' || host === '[::1]') return true
  if (host.endsWith('.localhost') || host.endsWith('.local')) return true

  // IPv4 checks
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map((n) => Number(n))
    if (octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) return true

    const [a, b] = octets
    if (a === 10) return true
    if (a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 0) return true
  }

  // Common IPv6 local/private forms
  const normalized = host.replace(/^\[|\]$/g, '')
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true // ULA
  if (normalized.startsWith('fe80:')) return true // link-local

  return false
}

function getSafeKenerOrigin(baseUrl?: string): string | null {
  const candidate = (baseUrl && baseUrl.trim()) || 'https://emberlystat.us'

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return null
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  if (parsed.username || parsed.password) return null
  if (isPrivateOrLocalHost(parsed.hostname)) return null

  const allowedOrigins = new Set(['https://emberlystat.us'])
  if (!allowedOrigins.has(parsed.origin)) return null

  return parsed.origin
}

interface TestResult {
  ok: boolean
  message: string
  detail?: string
}

async function testStripe(secretKey: string): Promise<TestResult> {
  if (!secretKey) return { ok: false, message: 'Secret key is not configured' }
  try {
    const res = await fetch('https://api.stripe.com/v1/customers?limit=1', {
      headers: { Authorization: `Bearer ${secretKey}` },
    })
    if (res.status === 401) return { ok: false, message: 'Invalid secret key', detail: 'Authentication failed' }
    if (!res.ok) return { ok: false, message: `Stripe API error (${res.status})` }
    return { ok: true, message: 'Connected to Stripe successfully' }
  } catch (err) {
    return { ok: false, message: 'Failed to reach Stripe API', detail: String(err) }
  }
}

async function testResend(apiKey: string): Promise<TestResult> {
  if (!apiKey) return { ok: false, message: 'API key is not configured' }
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.status === 401 || res.status === 403) return { ok: false, message: 'Invalid API key' }
    if (!res.ok) return { ok: false, message: `Resend API error (${res.status})` }
    return { ok: true, message: 'Connected to Resend successfully' }
  } catch (err) {
    return { ok: false, message: 'Failed to reach Resend API', detail: String(err) }
  }
}

async function testCloudflare(apiToken: string, accountId?: string): Promise<TestResult> {
  if (!apiToken) return { ok: false, message: 'API token is not configured' }
  try {
    const url = accountId
      ? `https://api.cloudflare.com/client/v4/accounts/${accountId}`
      : 'https://api.cloudflare.com/client/v4/user'
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.success === false) {
      return { ok: false, message: 'Invalid Cloudflare API token', detail: json?.errors?.[0]?.message }
    }
    return { ok: true, message: 'Connected to Cloudflare successfully' }
  } catch (err) {
    return { ok: false, message: 'Failed to reach Cloudflare API', detail: String(err) }
  }
}

async function testDiscord(webhookUrl: string, botToken?: string, serverId?: string): Promise<TestResult> {
  // Try bot token first (more informative)
  if (botToken && serverId) {
    try {
      const res = await fetch(`https://discord.com/api/v10/guilds/${serverId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      })
      if (res.status === 401) return { ok: false, message: 'Invalid bot token' }
      if (res.status === 404) return { ok: false, message: 'Server not found or bot not in server' }
      if (!res.ok) return { ok: false, message: `Discord API error (${res.status})` }
      const json = await res.json().catch(() => null)
      return { ok: true, message: `Connected to Discord — server: ${json?.name ?? serverId}` }
    } catch (err) {
      return { ok: false, message: 'Failed to reach Discord API', detail: String(err) }
    }
  }

  // Fall back to webhook validation
  if (webhookUrl) {
    try {
      let parsed: URL
      try {
        parsed = new URL(webhookUrl)
      } catch {
        return { ok: false, message: 'Invalid webhook URL format' }
      }

      const hostname = parsed.hostname.toLowerCase()
      const isDiscordHost = hostname === 'discord.com' || hostname === 'discordapp.com'
      if (parsed.protocol !== 'https:' || !isDiscordHost || isPrivateOrLocalHost(hostname)) {
        return { ok: false, message: 'Webhook URL must be a valid Discord HTTPS URL' }
      }

      const match = parsed.pathname.match(/^\/api\/webhooks\/(\d+)\/([A-Za-z0-9._-]+)$/)
      if (!match) {
        return { ok: false, message: 'Webhook URL must match Discord webhook format' }
      }

      const [, webhookId, webhookToken] = match
      const safeWebhookUrl = `https://${hostname}/api/webhooks/${webhookId}/${webhookToken}`

      const res = await fetch(safeWebhookUrl, { method: 'GET' })
      if (res.status === 401) return { ok: false, message: 'Invalid webhook URL' }
      if (!res.ok) return { ok: false, message: `Discord webhook error (${res.status})` }
      return { ok: true, message: 'Discord webhook is valid' }
    } catch (err) {
      return { ok: false, message: 'Failed to reach Discord webhook', detail: String(err) }
    }
  }

  return { ok: false, message: 'No credentials configured' }
}

function sanitizeGitHubOrg(org?: string): string | null {
  if (!org) return null
  const trimmed = org.trim()
  // GitHub org/user name rules: alphanumeric or single hyphens, no leading/trailing hyphen, max 39 chars.
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(trimmed)) return null
  return trimmed
}

async function testGitHub(pat: string, org?: string): Promise<TestResult> {
  if (!pat) return { ok: false, message: 'Personal access token is not configured' }
  const safeOrg = sanitizeGitHubOrg(org)
  if (org && !safeOrg) {
    return { ok: false, message: 'Invalid GitHub organization name format' }
  }
  try {
    const endpoint = safeOrg
      ? `https://api.github.com/orgs/${safeOrg}`
      : 'https://api.github.com/user'
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (res.status === 401) return { ok: false, message: 'Invalid personal access token' }
    if (res.status === 404) return { ok: false, message: `Organization "${safeOrg ?? org}" not found` }
    if (!res.ok) return { ok: false, message: `GitHub API error (${res.status})` }
    const json = await res.json().catch(() => null)
    return { ok: true, message: `Connected to GitHub${safeOrg ? ` — org: ${json?.name ?? safeOrg}` : ` — user: ${json?.login}`}` }
  } catch (err) {
    return { ok: false, message: 'Failed to reach GitHub API', detail: String(err) }
  }
}

async function testKener(apiKey: string, baseUrl?: string): Promise<TestResult> {
  const origin = getSafeKenerOrigin(baseUrl)
  if (!origin) {
    return { ok: false, message: 'Invalid Kener base URL' }
  }

  try {
    const res = await fetch(`${origin}/api/v4/monitors`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(8000),
    })
    if (res.status === 401 || res.status === 403) return { ok: false, message: 'Invalid API key' }
    if (!res.ok) return { ok: false, message: `Kener API error (${res.status})` }
    const json = await res.json().catch(() => null)
    const count = (json?.monitors as unknown[])?.length ?? 0
    return { ok: true, message: `Connected to Kener — ${count} monitor${count !== 1 ? 's' : ''} found` }
  } catch (err) {
    return { ok: false, message: 'Failed to reach Kener instance', detail: String(err) }
  }
}

async function testVultr(apiKey: string): Promise<TestResult> {
  if (!apiKey) return { ok: false, message: 'API key is not configured' }
  try {
    const res = await fetch('https://api.vultr.com/v2/account', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    })
    if (res.status === 401 || res.status === 403) return { ok: false, message: 'Invalid API key' }
    if (!res.ok) return { ok: false, message: `Vultr API error (${res.status})` }
    const json = await res.json().catch(() => null)
    const email = json?.account?.email
    return { ok: true, message: `Connected to Vultr${email ? ` — ${email}` : ''}` }
  } catch (err) {
    return { ok: false, message: 'Failed to reach Vultr API', detail: String(err) }
  }
}

async function testSmtp(host: string, port: number, secure: boolean, user: string, password: string): Promise<TestResult> {
  if (!host) return { ok: false, message: 'SMTP host is not configured' }
  try {
    const transport = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: secure ?? false,
      auth: user ? { user, pass: password } : undefined,
      connectionTimeout: 8000,
      greetingTimeout: 5000,
    })
    await transport.verify()
    transport.close()
    return { ok: true, message: `Connected to SMTP server at ${host}:${port}` }
  } catch (err) {
    return { ok: false, message: 'Failed to connect to SMTP server', detail: String(err) }
  }
}

export async function POST(req: Request) {
  try {
    const { user, response } = await requireAdmin(req)
    if (response) return response

    const body = (await req.json()) as TestIntegrationBody
    const { integration, credentials } = body

    let result: TestResult

    switch (integration) {
      case 'stripe':
        result = await testStripe(credentials.secretKey)
        break
      case 'resend':
        result = await testResend(credentials.apiKey)
        break
      case 'cloudflare':
        result = await testCloudflare(credentials.apiToken, credentials.accountId)
        break
      case 'discord':
        result = await testDiscord(credentials.webhookUrl, credentials.botToken, credentials.serverId)
        break
      case 'github':
        result = await testGitHub(credentials.pat, credentials.org)
        break
      case 'kener':
        result = await testKener(credentials.apiKey, credentials.baseUrl)
        break
      case 'smtp':
        result = await testSmtp(
          credentials.host,
          Number(credentials.port) || 587,
          credentials.secure === 'true',
          credentials.user,
          credentials.password,
        )
        break
      case 'vultr':
        result = await testVultr(credentials.apiKey)
        break
      default:
        return apiError('Unknown integration', HTTP_STATUS.BAD_REQUEST)
    }

    return apiResponse(result)
  } catch (error) {
    logger.error('Integration test failed', error as Error)
    return apiError('Internal server error')
  }
}

