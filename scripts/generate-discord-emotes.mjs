#!/usr/bin/env node
/**
 * Discord emoji & sticker generator
 *
 * Writes to public/branding/discord/:
 *   emojis/            128×128 PNG (static) and GIF (animated)  — Discord limit 256 KB
 *   stickers/          320×320 PNG (static) and APNG (animated) — Discord limit 512 KB
 *
 * Animations loop seamlessly: every frame is a function of t ∈ [0, 1).
 * APNG is assembled here from sharp-rendered PNG frames because sharp can
 * only write animated GIF/WebP.
 *
 * Usage: bun run branding:discord   (or: node scripts/generate-discord-emotes.mjs)
 */

import { mkdir, stat, writeFile } from 'fs/promises'
import { join } from 'path'
import { deflateSync, inflateSync } from 'zlib'

import sharp from 'sharp'

import { C, DEFS, FLAME_BODY, FLAME_TONGUE, ROOT, rng, text } from './branding-shared.mjs'

const OUT = join(ROOT, 'public', 'branding', 'discord')
const EMOJI = 128
const STICKER = 320
const LIMITS = { emoji: 256 * 1024, sticker: 512 * 1024 }
const TAU = Math.PI * 2

// ─── Shapes (drawn in a 100×100 box, scaled by `box`) ─────────────────────────

const HEART =
  'M50 90 C 20 68 4 52 4 33 C 4 18 15 8 28 8 C 38 8 46 14 50 23 C 54 14 62 8 72 8 C 85 8 96 18 96 33 C 96 52 80 68 50 90 Z'

const sparkle = (cx, cy, r) =>
  `M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z`

/** Wrap 100-unit-box content so it fills a `size` canvas with padding. */
const box = (size, body, pad = 4) => {
  const s = (size - pad * 2) / 100
  return `<g transform="translate(${pad} ${pad}) scale(${s})">${body}</g>`
}

/**
 * Flame drawn in the 100-unit box, optionally flickering.
 * `t` drives a looping sway/stretch anchored at the flame's base.
 */
function flame100(t = null, { x = 0, y = 0, size = 100, body = C.text } = {}) {
  const s = size / 375
  let bodyT = ''
  let tongueT = ''
  if (t !== null) {
    const a = TAU * t
    const sx = 1 + 0.035 * Math.sin(a)
    const sy = 1 + 0.06 * Math.sin(a + 1.3)
    const skew = 3.5 * Math.sin(a + 0.6)
    const tongueSkew = 6 * Math.sin(a + 2.1)
    // Anchor transforms at the base of the flame (≈ 188, 335 in mark units)
    bodyT = `translate(188 335) skewX(${skew}) scale(${sx} ${sy}) translate(-188 -335)`
    tongueT = `translate(160 335) skewX(${tongueSkew}) scale(${sx} ${1 + 0.08 * Math.sin(a + 0.4)}) translate(-160 -335)`
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="${FLAME_BODY}" fill="${body}" transform="${bodyT}"/>
    <path d="${FLAME_TONGUE}" fill="url(#emberGrad)" transform="${tongueT}"/>
  </g>`
}

/** Embers drifting upward; positions loop with t. */
function risingEmbers(t, count, seed, area = { x0: 20, x1: 80, y0: 20, y1: 95 }) {
  const r = rng(seed)
  let out = ''
  for (let i = 0; i < count; i++) {
    const baseX = area.x0 + r() * (area.x1 - area.x0)
    const phase = r()
    const rad = 1 + r() * 2.2
    const p = (t + phase) % 1
    const y = area.y1 - p * (area.y1 - area.y0)
    const x = baseX + 3 * Math.sin(TAU * (p + phase))
    const op = Math.sin(Math.PI * p) * 0.9
    const col = r() > 0.5 ? C.amber : C.ember
    out += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${rad.toFixed(2)}" fill="${col}" fill-opacity="${op.toFixed(2)}"/>`
  }
  return out
}

const canvas = (size, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${DEFS}${body}</svg>`

// ─── Emoji designs (100-unit box) ────────────────────────────────────────────

const roundBadge = (fill, inner) =>
  `<circle cx="50" cy="50" r="46" fill="${fill}"/>
   <circle cx="50" cy="50" r="45" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
   ${inner}`

const STATIC_EMOJIS = {
  ember: () => flame100(null, { x: 0, y: 0, size: 100 }),
  ember_heart: () =>
    `<path d="${HEART}" fill="url(#emberGrad)"/>
     ${flame100(null, { x: 30, y: 22, size: 40 })}`,
  ember_check: () =>
    roundBadge(
      'url(#emberGrad)',
      `<path d="M28 52 L44 67 L73 35" fill="none" stroke="${C.text}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`
    ),
  ember_cross: () =>
    roundBadge(
      C.surface,
      `<path d="M33 33 L67 67 M67 33 L33 67" fill="none" stroke="${C.ember}" stroke-width="11" stroke-linecap="round"/>`
    ),
  ember_upload: () =>
    `<rect x="6" y="6" width="88" height="88" rx="24" fill="url(#emberGrad)"/>
     <path d="M50 74 V30 M31 48 L50 29 L69 48" fill="none" stroke="${C.text}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  ember_link: () =>
    `<g transform="rotate(-45 50 50)" fill="none" stroke-width="10" stroke-linecap="round">
       <rect x="14" y="36" width="40" height="28" rx="14" stroke="${C.text}"/>
       <rect x="46" y="36" width="40" height="28" rx="14" stroke="${C.ember}"/>
     </g>`,
  ember_sparkles: () =>
    `${flame100(null, { x: 18, y: 14, size: 70 })}
     <path d="${sparkle(80, 22, 13)}" fill="${C.amber}"/>
     <path d="${sparkle(16, 70, 9)}" fill="${C.ember}"/>`,
}

const ANIMATED_EMOJIS = {
  // Flickering flame with embers rising off it
  ember_flicker: {
    frames: 24,
    delay: 50,
    draw: (t) => `${risingEmbers(t, 8, 3, { x0: 25, x1: 75, y0: 2, y1: 60 })}${flame100(t, { x: 4, y: 6, size: 92 })}`,
  },
  // Loading ring orbiting a small flame
  ember_loading: {
    frames: 24,
    delay: 45,
    draw: (t) => {
      const rot = t * 360
      return `<circle cx="50" cy="50" r="40" fill="none" stroke="${C.border}" stroke-width="9"/>
        <circle cx="50" cy="50" r="40" fill="none" stroke="url(#emberGrad)" stroke-width="9" stroke-linecap="round"
          stroke-dasharray="70 182" transform="rotate(${rot} 50 50)"/>
        ${flame100(t, { x: 29, y: 26, size: 44 })}`
    },
  },
  // Double-thump heartbeat
  ember_heartbeat: {
    frames: 24,
    delay: 50,
    draw: (t) => {
      const beat = (p, at) => Math.exp(-Math.pow((p - at) * 14, 2))
      const s = 1 + 0.12 * beat(t, 0.15) + 0.08 * beat(t, 0.38)
      return `<g transform="translate(50 50) scale(${s}) translate(-50 -50)">
          <path d="${HEART}" fill="url(#emberGrad)"/>
          ${flame100(null, { x: 30, y: 22, size: 40 })}
        </g>`
    },
  },
  // Flame with twinkling sparkles
  ember_sparkle: {
    frames: 24,
    delay: 55,
    draw: (t) => {
      const tw = (phase) => Math.max(0, Math.sin(TAU * (t + phase)))
      return `${flame100(t, { x: 18, y: 14, size: 70 })}
        <path d="${sparkle(80, 22, 4 + 10 * tw(0))}" fill="${C.amber}"/>
        <path d="${sparkle(16, 66, 3 + 8 * tw(0.33))}" fill="${C.ember}"/>
        <path d="${sparkle(84, 74, 2 + 6 * tw(0.66))}" fill="${C.amber}"/>`
    },
  },
  // Arrow launching upward out of the tile
  ember_uploading: {
    frames: 24,
    delay: 45,
    draw: (t) => {
      const y = -40 * t
      const op = 1 - Math.pow(t, 3)
      const y2 = 40 - 40 * t
      return `<rect x="6" y="6" width="88" height="88" rx="24" fill="url(#emberGrad)"/>
        <clipPath id="tile"><rect x="6" y="6" width="88" height="88" rx="24"/></clipPath>
        <g clip-path="url(#tile)" fill="none" stroke="${C.text}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
          <path d="M50 74 V30 M31 48 L50 29 L69 48" transform="translate(0 ${y})" stroke-opacity="${op}"/>
          <path d="M50 74 V30 M31 48 L50 29 L69 48" transform="translate(0 ${y2 + 40})" stroke-opacity="${1 - op}"/>
        </g>`
    },
  },
}

// ─── Sticker designs (320 canvas) ────────────────────────────────────────────

/**
 * Sticker text with a dark outline so it reads on any Discord theme.
 * Returns composite layers; the outline is the text stamped at 12 offsets.
 */
async function outlinedText(str, size, color, cx, cy) {
  const fill = await text(str, { size, color, weight: 900, letterSpacing: 0.02 })
  const stroke = await text(str, { size, color: C.bg, weight: 900, letterSpacing: 0.02 })
  const left = Math.round(cx - fill.width / 2)
  const top = Math.round(cy - fill.height / 2)
  const layers = []
  const w = Math.max(3, Math.round(size / 11))
  for (let i = 0; i < 12; i++) {
    const a = (TAU * i) / 12
    layers.push({
      input: stroke.input,
      left: left + Math.round(Math.cos(a) * w),
      top: top + Math.round(Math.sin(a) * w),
    })
  }
  layers.push({ input: fill.input, left, top })
  return layers
}

const STATIC_STICKERS = {
  uploaded: { label: 'Uploaded!', size: 58, draw: () => `${risingEmbers(0.3, 10, 9, { x0: 25, x1: 75, y0: 2, y1: 55 })}${flame100(null, { x: 22, y: 2, size: 56 })}` },
  thanks: { label: 'Thanks!', size: 64, draw: () => `<path d="${HEART}" fill="url(#emberGrad)" transform="translate(22 0) scale(0.56)"/>${flame100(null, { x: 39, y: 11, size: 22 })}` },
  gg: { label: 'GG', size: 110, draw: () => `${flame100(null, { x: 24, y: 0, size: 52 })}` },
  shipped: { label: 'Shipped it', size: 54, draw: () => `<rect x="24" y="2" width="52" height="52" rx="15" fill="url(#emberGrad)"/><path d="M50 43 V17 M38 28 L50 16 L62 28" fill="none" stroke="${C.text}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` },
}

const ANIMATED_STICKERS = {
  lets_go: {
    label: "LET'S GO",
    size: 62,
    frames: 20,
    delay: 50,
    draw: (t) => `${risingEmbers(t, 12, 17, { x0: 22, x1: 78, y0: 0, y1: 58 })}${flame100(t, { x: 22, y: 2, size: 56 })}`,
    textY: (t) => 255 + 6 * Math.sin(TAU * t),
  },
  uploading: {
    label: 'Uploading…',
    size: 50,
    frames: 20,
    delay: 60,
    draw: (t) => {
      const w = 6 + 66 * ((t * 1.15) % 1 > 1 ? 1 : Math.min(1, t * 1.15))
      return `${flame100(t, { x: 27, y: 0, size: 46 })}
        <rect x="14" y="54" width="72" height="12" rx="6" fill="${C.surface}" stroke="${C.border}" stroke-width="1.5"/>
        <rect x="14" y="54" width="${w.toFixed(2)}" height="12" rx="6" fill="url(#emberGrad)"/>`
    },
    textY: () => 262,
  },
}

// ─── APNG encoder ────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function readChunks(png) {
  const out = []
  let o = 8
  while (o < png.length) {
    const len = png.readUInt32BE(o)
    const type = png.toString('ascii', o + 4, o + 8)
    out.push({ type, data: png.subarray(o + 8, o + 8 + len) })
    o += 12 + len
  }
  return out
}

/** Combine same-size RGBA PNG frames into a looping APNG. */
function encodeApng(frames, delayMs) {
  const parsed = frames.map(readChunks)
  const ihdr = parsed[0].find((c) => c.type === 'IHDR').data
  const width = ihdr.readUInt32BE(0)
  const height = ihdr.readUInt32BE(4)

  const parts = [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr)]
  const actl = Buffer.alloc(8)
  actl.writeUInt32BE(frames.length, 0)
  actl.writeUInt32BE(0, 4) // loop forever
  parts.push(chunk('acTL', actl))

  let seq = 0
  parsed.forEach((chunks, i) => {
    const fctl = Buffer.alloc(26)
    fctl.writeUInt32BE(seq++, 0)
    fctl.writeUInt32BE(width, 4)
    fctl.writeUInt32BE(height, 8)
    fctl.writeUInt32BE(0, 12)
    fctl.writeUInt32BE(0, 16)
    fctl.writeUInt16BE(delayMs, 20)
    fctl.writeUInt16BE(1000, 22)
    fctl.writeUInt8(1, 24) // dispose: clear to transparent
    fctl.writeUInt8(0, 25) // blend: source
    parts.push(chunk('fcTL', fctl))

    // Re-deflate the frame's image data as one stream so it can be split freely
    const idat = Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data))
    const data = deflateSync(inflateSync(idat), { level: 9 })
    if (i === 0) {
      parts.push(chunk('IDAT', data))
    } else {
      const head = Buffer.alloc(4)
      head.writeUInt32BE(seq++)
      parts.push(chunk('fdAT', Buffer.concat([head, data])))
    }
  })
  parts.push(chunk('IEND', Buffer.alloc(0)))
  return Buffer.concat(parts)
}

// ─── Rendering ───────────────────────────────────────────────────────────────

async function frame(size, body100, overlays = []) {
  let img = sharp(Buffer.from(canvas(size, box(size, body100))))
  if (overlays.length) img = img.composite(overlays)
  // Fixed RGBA truecolor output so every APNG frame shares the same IHDR
  return img.ensureAlpha().png({ compressionLevel: 9, palette: false }).toBuffer()
}

async function save(file, buf, limit) {
  await writeFile(join(OUT, file), buf)
  const kb = (await stat(join(OUT, file))).size / 1024
  const flag = kb * 1024 > limit ? `  ⚠ over Discord's ${limit / 1024} KB limit` : ''
  console.log(`  ✓ ${file} (${kb.toFixed(0)} KB)${flag}`)
}

async function main() {
  await mkdir(join(OUT, 'emojis'), { recursive: true })
  await mkdir(join(OUT, 'stickers'), { recursive: true })
  console.log('Generating Discord emojis & stickers → public/branding/discord')

  for (const [name, draw] of Object.entries(STATIC_EMOJIS)) {
    await save(`emojis/${name}.png`, await frame(EMOJI, draw()), LIMITS.emoji)
  }

  for (const [name, a] of Object.entries(ANIMATED_EMOJIS)) {
    const frames = []
    for (let i = 0; i < a.frames; i++) frames.push(await frame(EMOJI, a.draw(i / a.frames)))
    const gif = await sharp(frames, { join: { animated: true } })
      .gif({ delay: frames.map(() => a.delay), loop: 0, effort: 10 })
      .toBuffer()
    await save(`emojis/${name}.gif`, gif, LIMITS.emoji)
  }

  for (const [name, s] of Object.entries(STATIC_STICKERS)) {
    const label = await outlinedText(s.label, s.size, C.text, STICKER / 2, 255)
    await save(`stickers/${name}.png`, await frame(STICKER, s.draw(), label), LIMITS.sticker)
  }

  for (const [name, s] of Object.entries(ANIMATED_STICKERS)) {
    const frames = []
    for (let i = 0; i < s.frames; i++) {
      const t = i / s.frames
      const label = await outlinedText(s.label, s.size, C.text, STICKER / 2, s.textY(t))
      frames.push(await frame(STICKER, s.draw(t), label))
    }
    await save(`stickers/${name}.png`, encodeApng(frames, s.delay), LIMITS.sticker)
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
