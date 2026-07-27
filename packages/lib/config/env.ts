import { z } from 'zod'

const envSchema = z.object({
  // OAuth - GitHub
  GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),

  // OAuth - Discord
  DISCORD_OAUTH_CLIENT_ID: z.string().optional(),
  DISCORD_OAUTH_CLIENT_SECRET: z.string().optional(),

  // Deployment mode
  EMBERLY_RUN_CLOUD: z.string().optional(),
})

const envVars = envSchema.parse({
  GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID,
  GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET,
  DISCORD_OAUTH_CLIENT_ID: process.env.DISCORD_OAUTH_CLIENT_ID,
  DISCORD_OAUTH_CLIENT_SECRET: process.env.DISCORD_OAUTH_CLIENT_SECRET,
  EMBERLY_RUN_CLOUD: process.env.EMBERLY_RUN_CLOUD,
})

export const env = {
  GITHUB_OAUTH_CLIENT_ID: envVars.GITHUB_OAUTH_CLIENT_ID || '',
  GITHUB_OAUTH_CLIENT_SECRET: envVars.GITHUB_OAUTH_CLIENT_SECRET || '',
  DISCORD_OAUTH_CLIENT_ID: envVars.DISCORD_OAUTH_CLIENT_ID || '',
  DISCORD_OAUTH_CLIENT_SECRET: envVars.DISCORD_OAUTH_CLIENT_SECRET || '',
  EMBERLY_RUN_CLOUD: envVars.EMBERLY_RUN_CLOUD || '',
}

const TRUTHY_VALUES = new Set(['1', 'true', 'yes'])

export const isCloudEnabled = () =>
  TRUTHY_VALUES.has(env.EMBERLY_RUN_CLOUD.toLowerCase())

export const isCloudEnabledClient = () =>
  TRUTHY_VALUES.has(
    (process.env.NEXT_PUBLIC_EMBERLY_RUN_CLOUD || '').toLowerCase()
  )

// EMBERLY_RUN_CLOUD (server) and NEXT_PUBLIC_EMBERLY_RUN_CLOUD (client) must
// be set together — if they disagree, server-side routing (proxy.ts, page
// guards) and client-rendered nav/UI will disagree about whether cloud mode
// is on, which looks like random/broken gating rather than a config typo.
export const isCloudConfigMismatched = () =>
  isCloudEnabled() !== isCloudEnabledClient()
