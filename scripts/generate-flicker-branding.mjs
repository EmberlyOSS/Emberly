#!/usr/bin/env node
/**
 * Brand assets for Flicker, Emberly's screenshot & upload app (emberly-app).
 *
 * Flicker's mark is the Emberly flame framed by capture-viewfinder corners.
 * Writes to public/branding/flicker/:
 *   icon-1024.png        app icon source (run `bunx tauri icon` with it in emberly-app)
 *   icon.svg             the same tile as SVG, for the app's favicon
 *   mark.svg             flame + corners, transparent
 *   tray-template-*.png  monochrome menu bar / tray icons (macOS template images)
 *   social-1200x630.png  release and store card
 *
 * Usage: bun run branding:flicker   (or: node scripts/generate-flicker-branding.mjs)
 */

import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

import sharp from 'sharp'

import { C, DEFS, ROOT, backdrop, flame, svg, text } from './branding-shared.mjs'

const NAME = 'Flicker'
const TAGLINE = 'Capture, upload and share in a flash'
const OUT = join(ROOT, 'public', 'branding', 'flicker')

/** Viewfinder corners in a 375×375 box (stroke drawn by the caller) */
const CORNERS =
  'M40 120 V68 Q40 40 68 40 H120 M255 40 H307 Q335 40 335 68 V120 M335 255 V307 Q335 335 307 335 H255 M120 335 H68 Q40 335 40 307 V255'

/** Corners + flame at (x, y) with the given size */
function flickerMark(x, y, size, { corners = 'url(#emberGrad)', body = C.text, tongue = 'url(#emberGrad)', weight = 26 } = {}) {
  const s = size / 375
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="${CORNERS}" fill="none" stroke="${corners}" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round"/>
    ${flame(70, 68, 240, { body, tongue })}
  </g>`
}

/** Rounded app tile; Discord-style circular crops and OS masks keep the mark clear */
const tile = (s) =>
  `<rect width="${s}" height="${s}" rx="${s * 0.22}" fill="${C.bg}"/>
   <rect width="${s}" height="${s}" rx="${s * 0.22}" fill="url(#grid)"/>
   <circle cx="${s / 2}" cy="${s * 0.58}" r="${s * 0.6}" fill="url(#glow)"/>
   ${flickerMark(s * 0.15, s * 0.15, s * 0.7)}`

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
  console.log(`Generating ${NAME} assets → public/branding/flicker`)

  await writeFile(join(OUT, 'mark.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 375">${DEFS}${flickerMark(0, 0, 375)}</svg>`)
  await writeFile(join(OUT, 'icon.svg'), svg(512, 512, tile(512)))
  console.log('  ✓ mark.svg, icon.svg')

  await png('icon-1024.png', 1024, 1024, tile(1024))

  // Template images: black on transparent; macOS recolours them for light/dark menu bars
  const tray = (s) => flickerMark(s * 0.04, s * 0.04, s * 0.92, { corners: '#000', body: '#000', tongue: '#000', weight: 34 })
  for (const size of [22, 44, 64]) {
    await png(`tray-template-${size}.png`, size, size, tray(size))
  }

  await png(
    'social-1200x630.png',
    1200,
    630,
    `${backdrop(1200, 630, { gx: 0.8, gy: 0.5, gr: 0.5, seed: 89, emberCount: 70 })}
     ${flickerMark(790, 125, 380)}`,
    [
      { str: NAME, size: 110, x: 90, y: 200 },
      { str: TAGLINE, size: 38, weight: 500, color: C.muted, letterSpacing: 0, x: 94, y: 340 },
      { str: 'embrly.ca', size: 30, weight: 600, color: C.ember, letterSpacing: 0.02, x: 94, y: 410 },
    ]
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
