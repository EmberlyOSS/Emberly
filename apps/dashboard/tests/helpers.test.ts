import { describe, expect, test } from 'bun:test'

import {
  describeLoginContext,
  formatLoginTime,
  isLocalAddress,
} from '@/lib/auth/login-context'
import { isPreviewable, previewSize } from '@/lib/embeds/preview-rules'
import { isDiscordWebhookUrl } from '@/lib/events/utils/discord-webhook'
import { describeStorageError, isStorageNotFound } from '@/lib/storage/errors'
import { humanize } from '@/lib/utils/humanize'

describe('isDiscordWebhookUrl', () => {
  test('accepts Discord webhook URLs', () => {
    for (const url of [
      'https://discord.com/api/webhooks/123456789/abcDEF_-123',
      'https://discordapp.com/api/webhooks/1/token',
      'https://ptb.discord.com/api/webhooks/1/token',
      'https://canary.discord.com/api/webhooks/1/token',
      '  https://discord.com/api/webhooks/1/token  ',
    ]) {
      expect(isDiscordWebhookUrl(url)).toBe(true)
    }
  })

  // The server posts to this URL, so anything else must be refused
  test('refuses other addresses', () => {
    for (const url of [
      'http://discord.com/api/webhooks/1/token',
      'https://evil.com/api/webhooks/1/token',
      'https://discord.com.evil.com/api/webhooks/1/token',
      'https://discord.com/api/webhooks/1/token/../../users',
      'http://169.254.169.254/latest/meta-data',
      'http://localhost:6379',
      'https://discord.com/api/webhooks/notanumber/token',
      '',
    ]) {
      expect(isDiscordWebhookUrl(url)).toBe(false)
    }
  })
})

describe('humanize', () => {
  test('turns enum values into labels', () => {
    expect(humanize('PENDING')).toBe('Pending')
    expect(humanize('BAN_APPEAL')).toBe('Ban appeal')
    expect(humanize('limit-increase')).toBe('Limit increase')
  })
})

describe('previews', () => {
  test('knows which images get previews', () => {
    expect(isPreviewable('image/png')).toBe(true)
    expect(isPreviewable('IMAGE/JPEG; charset=binary')).toBe(true)
    expect(isPreviewable('image/gif')).toBe(false)
    expect(isPreviewable('video/mp4')).toBe(false)
  })

  test('shrinks big images and keeps small ones', () => {
    expect(previewSize(3840, 2160)).toEqual({ width: 1920, height: 1080 })
    expect(previewSize(800, 600)).toEqual({ width: 800, height: 600 })
    expect(previewSize(10, 10000)).toEqual({ width: 2, height: 1920 })
  })
})

describe('formatLoginTime', () => {
  const when = new Date('2026-10-24T12:46:00Z')

  test('uses the reader’s time zone', () => {
    expect(formatLoginTime(when, 'America/Edmonton')).toBe(
      'Oct 24, 2026, 6:46 AM MDT'
    )
  })

  // A bad zone from the browser once broke every sign-in
  test('falls back to UTC instead of throwing', () => {
    expect(formatLoginTime(when, 'Not/AZone')).toBe(
      'Oct 24, 2026, 12:46 PM UTC'
    )
    expect(formatLoginTime(when)).toBe('Oct 24, 2026, 12:46 PM UTC')
  })
})

describe('sign-in location', () => {
  test('recognises local and private addresses', () => {
    for (const ip of [
      '::1',
      '127.0.0.1',
      '::ffff:127.0.0.1',
      '10.0.0.5',
      '192.168.1.20',
      '172.20.0.3',
      'fd12:3456::1',
    ]) {
      expect(isLocalAddress(ip)).toBe(true)
    }
    for (const ip of ['8.8.8.8', '172.32.0.1', '2606:4700::1111', undefined]) {
      expect(isLocalAddress(ip)).toBe(false)
    }
  })

  test('names the location, or leaves it out when unknown', () => {
    const when = new Date('2026-10-24T12:46:00Z')
    expect(
      describeLoginContext(
        { ip: '8.8.8.8', geo: { country: 'CA', city: 'Calgary' } },
        when
      ).loginLocation
    ).toBe('Calgary, Canada')
    expect(describeLoginContext({ ip: '::1' }, when).loginLocation).toBe(
      'Local network'
    )
    expect(
      describeLoginContext({ ip: '8.8.8.8' }, when).loginLocation
    ).toBeUndefined()
  })
})

describe('storage errors', () => {
  const s3 = (status: number, name = 'Unknown') =>
    Object.assign(new Error('UnknownError'), {
      name,
      $metadata: { httpStatusCode: status, requestId: 'REQ1' },
    })

  test('pull out what matters for the logs', () => {
    expect(describeStorageError(s3(403))).toMatchObject({
      code: 'Unknown',
      status: 403,
      requestId: 'REQ1',
    })
    expect(describeStorageError(s3(403)).hint).toContain('missing')
  })

  test('recognise missing objects', () => {
    expect(isStorageNotFound(s3(404, 'NotFound'))).toBe(true)
    expect(
      isStorageNotFound(Object.assign(new Error('x'), { code: 'ENOENT' }))
    ).toBe(true)
    expect(isStorageNotFound(s3(403))).toBe(false)
  })
})
