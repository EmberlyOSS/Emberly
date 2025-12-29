import { z } from 'zod'

const envSchema = z.object({
    // OAuth - GitHub
    GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
    GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),
    
    // OAuth - Discord
    DISCORD_OAUTH_CLIENT_ID: z.string().optional(),
    DISCORD_OAUTH_CLIENT_SECRET: z.string().optional(),
})

const envVars = envSchema.parse({
    GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID,
    GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET,
    DISCORD_OAUTH_CLIENT_ID: process.env.DISCORD_OAUTH_CLIENT_ID,
    DISCORD_OAUTH_CLIENT_SECRET: process.env.DISCORD_OAUTH_CLIENT_SECRET,
})

export const env = {
    GITHUB_OAUTH_CLIENT_ID: envVars.GITHUB_OAUTH_CLIENT_ID || '',
    GITHUB_OAUTH_CLIENT_SECRET: envVars.GITHUB_OAUTH_CLIENT_SECRET || '',
    DISCORD_OAUTH_CLIENT_ID: envVars.DISCORD_OAUTH_CLIENT_ID || '',
    DISCORD_OAUTH_CLIENT_SECRET: envVars.DISCORD_OAUTH_CLIENT_SECRET || '',
}
