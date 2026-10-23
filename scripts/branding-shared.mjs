/**
 * Shared drawing helpers for the brand asset generators
 * (scripts/generate-branding.mjs, scripts/generate-discord-emotes.mjs).
 */

import { join } from 'path'

import sharp from 'sharp'

export const ROOT = process.cwd()
export const FONT = join(ROOT, 'public', 'fonts', 'inter', 'Inter-VariableFont_opsz,wght.ttf')

// Matches the default theme (app/globals.css) and the media kit
export const C = {
  ember: '#F97316',
  amber: '#FBBF24',
  deep: '#C2410C',
  bg: '#0B0908',
  surface: '#15110F',
  border: '#2A2421',
  text: '#F7F3EF',
  muted: '#A69D96',
}

// Flame mark, viewBox 0 0 375 375 (same paths as packages/components/shared/icons.tsx)
export const FLAME_BODY =
  'M 133.605469 292.523438 C 119 250 140.367188 221.316406 163.433594 194.726562 C 185.085938 169.761719 209.632812 141.460938 203.160156 90.417969 C 202.625 86.183594 201.742188 82.175781 200.609375 78.34375 C 263.273438 144.074219 190.074219 264.175781 216.992188 262.679688 C 229.292969 261.992188 246.4375 231.386719 244.046875 158.132812 C 244.046875 158.132812 284.792969 212.761719 276.535156 267.296875 C 271.472656 300.714844 242.191406 342.46875 188.445312 334.503906 C 163.886719 330.863281 140.933594 313.871094 133.605469 292.523438'
export const FLAME_TONGUE =
  'M 184.242188 21.605469 C 184.242188 21.605469 180.738281 41.964844 189.011719 72.355469 C 197.183594 102.375 192.621094 125.648438 187.855469 138.554688 C 173.65625 177.011719 137.921875 193.757812 122.191406 234.230469 C 115.824219 250.605469 102.488281 306.734375 164.113281 335.5 C 164.113281 335.5 114.042969 325.144531 97.09375 280.464844 C 83.359375 244.253906 95.5 198.558594 133.40625 156.972656 C 188.738281 96.265625 157.191406 55.503906 184.242188 21.605469'

/** Flame paths placed at (x, y) with the given rendered size. */
export function flame(x, y, size, { body = C.text, tongue = 'url(#emberGrad)' } = {}) {
  const s = size / 375
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="${FLAME_BODY}" fill="${body}"/>
    <path d="${FLAME_TONGUE}" fill="${tongue}"/>
  </g>`
}

export const DEFS = `<defs>
  <linearGradient id="emberGrad" x1="0" y1="1" x2="0.4" y2="0">
    <stop offset="0" stop-color="${C.deep}"/>
    <stop offset="0.55" stop-color="${C.ember}"/>
    <stop offset="1" stop-color="${C.amber}"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="${C.ember}" stop-opacity="0.55"/>
    <stop offset="0.45" stop-color="${C.deep}" stop-opacity="0.18"/>
    <stop offset="1" stop-color="${C.bg}" stop-opacity="0"/>
  </radialGradient>
  <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
    <path d="M48 0H0V48" fill="none" stroke="${C.text}" stroke-opacity="0.035" stroke-width="1"/>
  </pattern>
  <linearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0.55" stop-color="${C.bg}" stop-opacity="0"/>
    <stop offset="1" stop-color="${C.bg}" stop-opacity="0.9"/>
  </linearGradient>
</defs>`

/** Deterministic pseudo-random so regenerated assets are identical. */
export function rng(seed) {
  let t = seed
  return () => {
    t = (t * 1664525 + 1013904223) % 4294967296
    return t / 4294967296
  }
}

export function embers(w, h, count, seed, region = { x0: 0, x1: 1, y0: 0, y1: 1 }) {
  const r = rng(seed)
  let out = ''
  for (let i = 0; i < count; i++) {
    const x = (region.x0 + r() * (region.x1 - region.x0)) * w
    const y = (region.y0 + r() * (region.y1 - region.y0)) * h
    const rad = 0.8 + r() * 2.6
    const op = 0.15 + r() * 0.55
    const col = r() > 0.6 ? C.amber : C.ember
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" fill="${col}" fill-opacity="${op.toFixed(2)}"/>`
  }
  return out
}

/** Dark backdrop with grid, a glow at (gx, gy) and drifting embers. */
export function backdrop(w, h, { gx = 0.75, gy = 0.55, gr = 0.55, seed = 7, emberCount = 60 } = {}) {
  const r = Math.max(w, h) * gr
  return `<rect width="${w}" height="${h}" fill="${C.bg}"/>
  <rect width="${w}" height="${h}" fill="url(#grid)"/>
  <circle cx="${w * gx}" cy="${h * gy}" r="${r}" fill="url(#glow)"/>
  ${embers(w, h, emberCount, seed)}
  <rect width="${w}" height="${h}" fill="url(#fadeBottom)"/>`
}

export const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${DEFS}${body}</svg>`

/** Render a line of Inter text to a PNG buffer. */
export async function text(str, { size, color = C.text, weight = 800, letterSpacing = -0.02 }) {
  const spacing = Math.round(letterSpacing * size * 1024)
  const markup = `<span foreground="${color}" font_weight="${weight}" letter_spacing="${spacing}">${str}</span>`
  const { data, info } = await sharp({
    text: {
      text: markup,
      font: `Inter ${size}px`,
      fontfile: FONT,
      rgba: true,
      dpi: 72,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true })
  return { input: data, width: info.width, height: info.height }
}

/**
 * Render an SVG background and composite text layers on top.
 * Each layer: { str, size, color, weight, x, y, anchor: 'left'|'center' }
 */
