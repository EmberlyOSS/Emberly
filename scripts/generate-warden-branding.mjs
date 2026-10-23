#!/usr/bin/env node
/**
 * Brand assets for Warden, the Emberly server's mod bot (emberly-mod-bot).
 *
 * Warden's mark is the Emberly flame inside a shield. Writes to
 * public/branding/warden/:
 *   avatar-1024.png / avatar-512.png  bot avatar and Developer Portal app icon
 *   mark.svg                          the shield mark, transparent
 *   profile-banner-680x240.png        bot profile banner
 *   embed-icon-128.png                small mark for embed authors/footers
 *
 * Usage: bun run branding:warden   (or: node scripts/generate-warden-branding.mjs)
 */

import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

import sharp from 'sharp'

import { C, DEFS, ROOT, backdrop, flame, svg, text } from './branding-shared.mjs'

const NAME = 'Warden'
const TAGLINE = 'Keeping the Emberly server safe'
const OUT = join(ROOT, 'public', 'branding', 'warden')

// Shield in a 375×375 box, matching the flame mark's coordinate space
const SHIELD =
  'M187.5 18 L332 64 V178 C332 268 268 326 187.5 357 C107 326 43 268 43 178 V64 Z'

/** Shield with the flame inside, placed at (x, y) with the given size. */
function shieldMark(x, y, size, { fill = C.surface, stroke = 'url(#emberGrad)' } = {}) {
  const s = size / 375
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="${SHIELD}" fill="${fill}" stroke="${stroke}" stroke-width="20" stroke-linejoin="round"/>
    ${flame(80, 74, 222)}
  </g>`
}

async function png(file, w, h, body, layers = []) {
  const composites = []
  for (const l of layers) {
    const t = await text(l.str, l)
    const left = l.anchor === 'center' ? Math.round(l.x - t.width / 2) : Math.round(l.x)
    composites.push({ input: t.input, left, top: Math.round(l.y) })
  }
  let img = sharp(Buffer.from(svg(w, h, body)), { density: 144 }).resize(w, h)
  if (composites.length) img = img.composite(composites)
  await img.png({ compressionLevel: 9 }).toFile(join(OUT, file))
  console.log('  ✓', file)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  console.log(`Generating ${NAME} assets → public/branding/warden`)

  await writeFile(
    join(OUT, 'mark.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 375">${DEFS}${shieldMark(0, 0, 375)}</svg>`
  )
  console.log('  ✓ mark.svg')

  // Avatar: Discord crops it to a circle, so the mark stays well inside it
  const avatar = (s) =>
    `<rect width="${s}" height="${s}" fill="${C.bg}"/>
     <circle cx="${s / 2}" cy="${s * 0.56}" r="${s * 0.62}" fill="url(#glow)"/>
     ${shieldMark(s * 0.19, s * 0.17, s * 0.62)}`
  for (const size of [1024, 512]) {
    await png(`avatar-${size}.png`, size, size, avatar(size))
  }

  await png('embed-icon-128.png', 128, 128, shieldMark(4, 4, 120))

  await png(
    'profile-banner-680x240.png',
    680,
    240,
    `${backdrop(680, 240, { gx: 0.82, gy: 0.5, gr: 0.5, seed: 67, emberCount: 40 })}
     ${shieldMark(505, 35, 170)}`,
    [
      { str: NAME, size: 64, x: 48, y: 58 },
      { str: TAGLINE, size: 22, weight: 500, color: C.muted, letterSpacing: 0, x: 51, y: 138 },
      { str: 'embrly.ca', size: 20, weight: 600, color: C.ember, letterSpacing: 0.02, x: 51, y: 176 },
    ]
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
