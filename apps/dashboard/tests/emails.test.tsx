import { describe, expect, test } from 'bun:test'
import { createElement, type ReactElement } from 'react'

import { render } from '@react-email/render'

import {
  type EmailBrand,
  formatEmailDate,
  formatEmailMoney,
  plainTextOptions,
  withEmailBrand,
} from '@/lib/emails/components'
import { buildAccountNotice } from '@/lib/emails/notices'
import { AccountNoticeEmail } from '@/lib/emails/templates/account-notice'
import { AdminBroadcastEmail } from '@/lib/emails/templates/admin-broadcast'
import { NewLoginEmail } from '@/lib/emails/templates/new-login'
import { VerificationCodeEmail } from '@/lib/emails/templates/verification-code'

const selfHosted: EmailBrand = {
  name: 'Acme Files',
  logoUrl: 'https://files.acme.test/logo.png',
  siteUrl: 'https://files.acme.test',
  manageUrl: 'https://files.acme.test/me?tab=notifications',
  showCredit: true,
}

const html = (el: ReactElement, brand = selfHosted) =>
  withEmailBrand(brand, () => render(el))
const text = (el: ReactElement, brand = selfHosted) =>
  withEmailBrand(brand, () =>
    render(el, { plainText: true, htmlToTextOptions: plainTextOptions })
  )

describe('email branding', () => {
  test('self-hosted instances get their own name and links', async () => {
    const out = await html(
      createElement(NewLoginEmail, { loginDevice: 'Firefox on Linux' })
    )
    expect(out).toContain('Acme Files')
    expect(out).toContain('https://files.acme.test/me?tab=security')
    expect(out).not.toContain('embrly.ca/me')
  })

  test('the default brand is Emberly', async () => {
    const out = await render(
      createElement(VerificationCodeEmail, { code: '482913' })
    )
    expect(out).toContain('Emberly')
    expect(out).toContain('482913')
  })
})

describe('plain text emails', () => {
  test('lay details out as readable lines', async () => {
    const out = await text(
      createElement(NewLoginEmail, {
        loginDevice: 'Chrome on Windows',
        loginLocation: 'Calgary, Canada',
      })
    )
    expect(out).toMatch(/Device\s+Chrome on Windows/)
    expect(out).toMatch(/Location\s+Calgary, Canada/)
  })
})

describe('admin announcements', () => {
  const body = [
    'Hello **everyone**',
    '',
    '<script>alert(1)</script>',
    '',
    '[good](https://status.example.com) and [bad](javascript:alert(1))',
  ].join('\n')

  test('escape HTML and drop unsafe links', async () => {
    const out = await html(
      createElement(AdminBroadcastEmail, { subject: 'Maintenance', body })
    )
    expect(out).not.toContain('<script>')
    expect(out).toContain('&lt;script&gt;')
    expect(out).not.toContain('javascript:')
    expect(out).toContain('href="https://status.example.com"')
    expect(out).toContain('<strong')
  })
})

describe('formatting', () => {
  test('money uses the currency symbol', () => {
    expect(formatEmailMoney(799, 'usd')).toBe('$7.99')
    expect(formatEmailMoney(500, 'EUR')).toBe('€5.00')
    expect(formatEmailMoney(100, 'notacurrency')).toBe('1.00 NOTACURRENCY')
  })

  test('dates are UTC and survive bad input', () => {
    expect(formatEmailDate('2026-10-24T12:46:00Z')).toBe(
      'Oct 24, 2026, 12:46 PM UTC'
    )
    expect(formatEmailDate('not a date')).toBe('not a date')
  })
})

describe('account notices', () => {
  const site = 'https://files.acme.test'
  const templates = {
    'role-changed': { oldRole: 'USER', newRole: 'ADMIN' },
    'account-suspended': {
      reason: 'Spam',
      isPermanent: true,
      appealUrl: `${site}/contact`,
    },
    'account-unsuspended': {},
    'api-key-created': {
      keyName: 'CI',
      scopes: 'upload',
      expiresAt: 'Never',
      ip: 'Unknown',
    },
    'api-key-revoked': { keyName: 'CI', revokedBy: 'admin' },
    'backup-codes-generated': { codesCount: 10 },
    'backup-code-used': { codesRemaining: 1 },
    'session-revoked': { revokedBy: 'user' },
    'suspicious-activity': { activityType: 'many_failed_logins' },
  }

  // These used to fall through to the generic fallback email
  test('every notice has its own content', async () => {
    for (const [template, vars] of Object.entries(templates)) {
      const notice = buildAccountNotice(template, vars, site)
      expect(notice).not.toBeNull()
      const out = await html(createElement(AccountNoticeEmail, notice!))
      expect(out).toContain(
        notice!.heading.replace(/’/g, '&#x27;').slice(0, 10)
      )
      expect(out).not.toContain('Unknown')
    }
    expect(buildAccountNotice('basic', {}, site)).toBeNull()
  })

  test('a role change reads naturally', () => {
    const notice = buildAccountNotice(
      'role-changed',
      { oldRole: 'USER', newRole: 'ADMIN' },
      site
    )
    expect(notice?.intro).toBe(
      'An administrator changed your account’s role from User to Admin.'
    )
    expect(notice?.callout?.title).toBe('You can now open the admin area')
  })
})
