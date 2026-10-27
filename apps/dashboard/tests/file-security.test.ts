import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

import { hash } from 'bcryptjs'

import {
  checkFilePassword,
  filePasswordProblem,
} from '@/lib/files/password-guard'
import { fileSecurityHeaders, isRasterImage } from '@/lib/files/safe-headers'
import {
  isSafeColors,
  isSafeThemeName,
  safeColors,
} from '@/lib/theme/safe-colors'

describe('serving uploaded files', () => {
  // GHSA-4fr7-p4rm-r2f6: an uploaded SVG or HTML file must never run scripts on our origin
  test('script-capable types are sandboxed', () => {
    for (const type of [
      'image/svg+xml',
      'text/html',
      'application/xhtml+xml',
      'text/xml',
      'TEXT/HTML; charset=utf-8',
      'image/png',
      'application/octet-stream',
    ]) {
      expect(fileSecurityHeaders(type)).toEqual({
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': 'sandbox',
      })
    }
  })

  test('PDFs still open in the browser viewer', () => {
    expect(fileSecurityHeaders('application/pdf')).toEqual({
      'X-Content-Type-Options': 'nosniff',
    })
  })

  test('thumbnails only pass through raster images', () => {
    expect(isRasterImage('image/png')).toBe(true)
    expect(isRasterImage('image/GIF')).toBe(true)
    expect(isRasterImage('image/svg+xml')).toBe(false)
    expect(isRasterImage('text/html')).toBe(false)
  })

  test('every route that serves file bytes sends the headers', () => {
    for (const file of [
      'lib/files/serve.ts',
      'app/api/files/[...path]/route.ts',
      'app/api/files/[id]/thumbnail/route.ts',
      'app/api/files/[id]/download/route.ts',
    ]) {
      const source = readFileSync(join(import.meta.dir, '..', file), 'utf8')
      expect(source).toContain('fileSecurityHeaders(')
    }
  })
})

describe('file passwords', () => {
  // GHSA-qxr9-m5ff-27rv: guessing a file password must be limited
  test('wrong guesses are limited per address', async () => {
    const stored = await hash('correct horse', 4)
    for (let i = 0; i < 10; i++) {
      expect(await checkFilePassword(stored, 'nope', '203.0.113.1')).toEqual({
        ok: false,
        limited: false,
      })
    }
    const blocked = await checkFilePassword(
      stored,
      'correct horse',
      '203.0.113.1'
    )
    expect(blocked.ok).toBe(false)
    expect(blocked.ok === false && blocked.limited).toBe(true)
    expect(
      (await checkFilePassword(stored, 'correct horse', '203.0.113.2')).ok
    ).toBe(true)
  })

  test('new passwords need at least 8 characters', () => {
    expect(filePasswordProblem('short')).not.toBeNull()
    expect(filePasswordProblem('long enough')).toBeNull()
    expect(filePasswordProblem('x'.repeat(73))).not.toBeNull()
  })
})

describe('theme colors', () => {
  // GHSA-jf87-vxjh-6gv2: colors are written into a <style> tag
  test('only plain color values are accepted', () => {
    expect(isSafeColors({ primary: '24 95% 53%', accent: '#f97316' })).toBe(
      true
    )
    expect(
      isSafeColors({ primary: 'red;}</style><script>alert(1)</script>' })
    ).toBe(false)
    expect(
      safeColors({ primary: '24 95% 53%', evil: '}</style><script>' })
    ).toEqual({
      primary: '24 95% 53%',
    })
    expect(isSafeThemeName('hue:210')).toBe(true)
    expect(isSafeThemeName('dark"><script>')).toBe(false)
  })
})
