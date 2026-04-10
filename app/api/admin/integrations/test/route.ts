import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { loggers } from '@/packages/lib/logger'
import nodemailer from 'nodemailer'

const logger = loggers.config

type IntegrationKey = 'stripe' | 'resend' | 'cloudflare' | 'discord' | 'github' | 'kener' | 'smtp'

interface TestIntegrationBody {
  integration: IntegrationKey
  // Credentials to test — use currently-saved values from the config
  credentials: Record<string, string>
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
      const res = await fetch(webhookUrl, { method: 'GET' })
      if (res.status === 401) return { ok: false, message: 'Invalid webhook URL' }
      if (!res.ok) return { ok: false, message: `Discord webhook error (${res.status})` }
      return { ok: true, message: 'Discord webhook is valid' }
    } catch (err) {
      return { ok: false, message: 'Failed to reach Discord webhook', detail: String(err) }
    }
  }

  return { ok: false, message: 'No credentials configured' }
}

async function testGitHub(pat: string, org?: string): Promise<TestResult> {
  if (!pat) return { ok: false, message: 'Personal access token is not configured' }
  try {
    const endpoint = org
      ? `https://api.github.com/orgs/${org}`
      : 'https://api.github.com/user'
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (res.status === 401) return { ok: false, message: 'Invalid personal access token' }
    if (res.status === 404) return { ok: false, message: `Organization "${org}" not found` }
    if (!res.ok) return { ok: false, message: `GitHub API error (${res.status})` }
    const json = await res.json().catch(() => null)
    return { ok: true, message: `Connected to GitHub${org ? ` — org: ${json?.name ?? org}` : ` — user: ${json?.login}`}` }
  } catch (err) {
    return { ok: false, message: 'Failed to reach GitHub API', detail: String(err) }
  }
}

async function testKener(apiKey: string, baseUrl?: string): Promise<TestResult> {
  const url = (baseUrl || 'https://emberlystat.us').replace(/\/$/, '')
  try {
    const res = await fetch(`${url}/api/v4/monitors`, {
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
      default:
        return apiError('Unknown integration', HTTP_STATUS.BAD_REQUEST)
    }

    return apiResponse(result)
  } catch (error) {
    logger.error('Integration test failed', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
