/**
 * Site identity for the Emberly status page. URLs come from the environment
 * so self-hosted Emberly instances can run their own status page; the
 * defaults are the hosted Emberly ones.
 */

export const SITE = {
    name: 'Emberly',
    statusName: 'Emberly Status',
    company: 'NodeByte LTD',
    description: 'Real-time service status and uptime monitoring for Emberly. Track incidents, scheduled maintenance, and live service health.',
    /** Public URL of this status page */
    statusUrl: (process.env.NEXT_PUBLIC_STATUS_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://emberlystat.us').replace(/\/$/, ''),
    /** The Emberly site this page reports on */
    appUrl: (process.env.NEXT_PUBLIC_EMBERLY_URL || 'https://embrly.ca').replace(/\/$/, ''),
    github: 'https://github.com/EmberlyOSS/Emberly',
    discord: 'https://discord.gg/36spBmzZVB',
    twitter: 'https://x.com/TryEmberly',
    twitterHandle: '@TryEmberly',
} as const;

/** Host-only form of the status URL, for display (e.g. "emberlystat.us"). */
export const STATUS_HOST = SITE.statusUrl.replace(/^https?:\/\//, '');
