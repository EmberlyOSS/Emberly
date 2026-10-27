import { humanize } from '@/lib/utils/humanize'

import { formatEmailDate } from './components'
import type { AccountNoticeEmailProps } from './templates/account-notice'

type Vars = Record<string, unknown>

const text = (value: unknown) =>
  typeof value === 'string' && value.trim() && value !== 'Unknown'
    ? value.trim()
    : undefined

const when = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number'
    ? formatEmailDate(value)
    : undefined

function rows(...entries: Array<[string, string | undefined]>) {
  return entries.filter((row): row is [string, string] => !!row[1])
}

const ROLE_RANK: Record<string, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  SUPERADMIN: 3,
}

const REVOKED_BY: Record<string, string> = {
  user: 'You',
  admin: 'An administrator',
  system: 'Automatically',
}

const SECURITY_REASON =
  'We email you about security changes to your account so you can spot anything you didn’t do.'
const ACCOUNT_REASON = 'We email you about important changes to your account.'

/**
 * Builds the account and security notices that share one layout. Returns null
 * for templates that aren't notices.
 */
export function buildAccountNotice(
  template: string,
  v: Vars,
  siteUrl: string
): AccountNoticeEmailProps | null {
  const security = `${siteUrl}/me?tab=security`
  const apiKeys = `${siteUrl}/me?tab=api`

  switch (template) {
    case 'role-changed': {
      const oldRole = String(v.oldRole ?? 'USER')
      const newRole = String(v.newRole ?? 'USER')
      const promoted = (ROLE_RANK[newRole] ?? 0) > (ROLE_RANK[oldRole] ?? 0)
      return {
        preview: `Your role is now ${humanize(newRole)}`,
        heading: 'Your role has changed',
        intro: `An administrator changed your account’s role from ${humanize(oldRole)} to ${humanize(newRole)}.`,
        details: rows(
          ['Previous role', humanize(oldRole)],
          ['New role', humanize(newRole)],
          ['Changed', when(v.changedAt)]
        ),
        callout:
          promoted && (ROLE_RANK[newRole] ?? 0) >= ROLE_RANK.ADMIN
            ? {
                tone: 'info',
                title: 'You can now open the admin area',
                text: 'Your account can change other people’s accounts and the site’s settings, so keep it safe: use a strong password and turn on two-factor authentication.',
              }
            : undefined,
        button: { label: 'Open your dashboard', href: `${siteUrl}/dashboard` },
        reason: ACCOUNT_REASON,
      }
    }

    case 'account-suspended': {
      const until = v.isPermanent ? 'Until further notice' : when(v.expiresAt)
      return {
        preview: 'Your account has been suspended',
        heading: 'Your account has been suspended',
        intro:
          'An administrator suspended your account. While it’s suspended you can’t sign in, upload or share files.',
        details: rows(
          ['Reason', text(v.reason)],
          ['Suspended until', until],
          ['Suspended', when(v.suspendedAt)]
        ),
        callout: {
          tone: 'info',
          title: 'Think this is a mistake?',
          text: 'Contact us and tell us why, and we’ll review the suspension.',
        },
        button: text(v.appealUrl)
          ? { label: 'Contact support', href: String(v.appealUrl) }
          : undefined,
        reason: ACCOUNT_REASON,
      }
    }

    case 'account-unsuspended':
      return {
        preview: 'Your account is active again',
        heading: 'Your account has been restored',
        intro:
          'Your account is active again. You can sign in and use it as normal.',
        details: rows(['Restored', when(v.restoredAt)]),
        button: { label: 'Sign in', href: `${siteUrl}/auth/login` },
        reason: ACCOUNT_REASON,
      }

    case 'api-key-created':
      return {
        preview: `API key “${text(v.keyName) ?? 'Untitled'}” was created`,
        heading: 'New API key created',
        intro: 'An API key was just created for your account.',
        details: rows(
          ['Name', text(v.keyName)],
          ['Permissions', text(v.scopes)],
          [
            'Expires',
            v.expiresAt === 'Never' ? 'Never' : (when(v.expiresAt) ?? 'Never'),
          ],
          ['IP address', text(v.ip)],
          ['Created', when(v.createdAt)]
        ),
        callout: {
          tone: 'warning',
          title: 'Didn’t create this key?',
          text: 'Revoke it in your API settings and change your password straight away.',
        },
        button: { label: 'Manage API keys', href: apiKeys },
        reason: SECURITY_REASON,
      }

    case 'api-key-revoked':
      return {
        preview: `API key “${text(v.keyName) ?? 'Untitled'}” was revoked`,
        heading: 'API key revoked',
        intro:
          'An API key on your account was revoked. Anything still using it will stop working.',
        details: rows(
          ['Name', text(v.keyName)],
          ['Revoked by', REVOKED_BY[String(v.revokedBy)]],
          ['Reason', text(v.reason)],
          ['Revoked', when(v.revokedAt)]
        ),
        button: { label: 'Manage API keys', href: apiKeys },
        reason: SECURITY_REASON,
      }

    case 'backup-codes-generated':
      return {
        preview: 'New two-factor backup codes were created',
        heading: 'New backup codes created',
        intro:
          'New two-factor backup codes were created for your account. Your old codes no longer work.',
        details: rows(
          ['Codes', v.codesCount != null ? String(v.codesCount) : undefined],
          ['Created', when(v.generatedAt)]
        ),
        callout: {
          tone: 'warning',
          title: 'Didn’t do this?',
          text: 'Change your password and create new backup codes straight away.',
        },
        button: { label: 'Security settings', href: security },
        reason: SECURITY_REASON,
      }

    case 'backup-code-used': {
      const left = Number(v.codesRemaining)
      return {
        preview: 'A backup code was used to sign in',
        heading: 'A backup code was used to sign in',
        intro:
          'Someone signed in to your account using one of your two-factor backup codes.',
        details: rows(
          ['Codes left', Number.isFinite(left) ? String(left) : undefined],
          ['IP address', text(v.ip)],
          ['When', when(v.usedAt)]
        ),
        callout: {
          tone: 'danger',
          title: 'Wasn’t you?',
          text: 'Change your password and create new backup codes straight away.',
        },
        button: {
          label:
            Number.isFinite(left) && left <= 2
              ? 'Create new backup codes'
              : 'Security settings',
          href: security,
        },
        reason: SECURITY_REASON,
      }
    }

    case 'session-revoked':
      return {
        preview: 'A session was signed out of your account',
        heading: 'A session was signed out',
        intro: 'One of the sessions signed in to your account was signed out.',
        details: rows(
          ['Signed out by', REVOKED_BY[String(v.revokedBy)]],
          ['Reason', text(v.reason)],
          ['When', when(v.revokedAt)]
        ),
        button: { label: 'Review your devices', href: security },
        reason: SECURITY_REASON,
      }

    case 'suspicious-activity':
      return {
        preview: 'We noticed unusual activity on your account',
        heading: 'Unusual activity on your account',
        intro: `We noticed something unusual on your account: ${humanize(String(v.activityType ?? 'unusual activity')).toLowerCase()}.`,
        details: rows(
          ['Details', text(v.details)],
          ['Location', text(v.location)],
          ['IP address', text(v.ip)],
          ['When', when(v.detectedAt)]
        ),
        callout: {
          tone: 'danger',
          title: 'Wasn’t you?',
          text: 'Change your password, sign out your other devices and turn on two-factor authentication.',
        },
        button: { label: 'Review your security', href: security },
        reason: SECURITY_REASON,
      }

    default:
      return null
  }
}
