import { describe, expect, test } from 'bun:test'

import { describeDevice, parseUserAgent } from '@/lib/utils/user-agent'

const UA = {
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  edgeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  firefoxLinux:
    'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
}

describe('parseUserAgent', () => {
  test('reads desktop browsers', () => {
    expect(parseUserAgent(UA.chromeWindows)).toEqual({
      device: 'Desktop',
      browser: 'Chrome',
      os: 'Windows',
    })
    expect(parseUserAgent(UA.firefoxLinux).browser).toBe('Firefox')
    expect(parseUserAgent(UA.safariMac)).toMatchObject({
      browser: 'Safari',
      os: 'macOS',
    })
  })

  test('tells Edge apart from Chrome', () => {
    expect(parseUserAgent(UA.edgeWindows).browser).toBe('Edge')
  })

  test('reports phones as mobile, with the right OS', () => {
    expect(parseUserAgent(UA.safariIphone)).toEqual({
      device: 'Mobile',
      browser: 'Safari',
      os: 'iOS',
    })
    // Android user agents also mention Linux; Android must win
    expect(parseUserAgent(UA.chromeAndroid)).toMatchObject({
      device: 'Mobile',
      os: 'Android',
    })
  })

  test('handles missing user agents', () => {
    expect(parseUserAgent(null).browser).toBe('Unknown')
    expect(describeDevice(undefined)).toBeNull()
  })
})

describe('describeDevice', () => {
  test('reads naturally', () => {
    expect(describeDevice(UA.chromeWindows)).toBe('Chrome on Windows')
    expect(describeDevice(UA.safariIphone)).toBe('Safari on iOS')
  })
})
