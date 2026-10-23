#!/usr/bin/env node
/**
 * Brand asset generator
 *
 * Renders Emberly's social and brand assets into public/branding/:
 * logo marks, app icons, wordmarks, Twitter/X, Discord, Open Graph and
 * nameplates. Everything is drawn from the flame mark and brand palette below,
 * so re-run this after changing either.
 *
 * Text is rasterised with the bundled Inter font via sharp/Pango, so PNGs look
 * the same on every machine. Text-free assets are also written as SVG.
 *
 * Usage: bun run branding   (or: node scripts/generate-branding.mjs)
 */

import { copyFile, mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

import sharp from 'sharp'

import {
  C,
  DEFS,
  ROOT,
  backdrop,
  embers,
  flame,
  svg,
  text,
} from './branding-shared.mjs'

const OUT = join(ROOT, 'public', 'branding')

async function render(file, w, h, body, layers = []) {
  let img = sharp(Buffer.from(svg(w, h, body)))
  const composites = []
  for (const l of layers) {
    const t = await text(l.str, l)
    const left = l.anchor === 'center' ? Math.round(l.x - t.width / 2) : Math.round(l.x)
    const top = l.valign === 'middle' ? Math.round(l.y - t.height / 2) : Math.round(l.y)
    composites.push({ input: t.input, left, top })
  }
  if (composites.length) img = img.composite(composites)
  await img.png({ compressionLevel: 9 }).toFile(join(OUT, file))
  console.log('  ✓', file)
}

async function writeSvg(file, content) {
  await writeFile(join(OUT, file), content)
  console.log('  ✓', file)
}

async function main() {
  for (const dir of ['logo', 'icon', 'wordmark', 'twitter', 'discord', 'social', 'nameplate']) {
    await mkdir(join(OUT, dir), { recursive: true })
  }
  console.log('Generating brand assets → public/branding')

  // ── Logo marks (transparent) ─────────────────────────────────────────────
  const markSvg = (body, tongue) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 375">${DEFS}${flame(0, 0, 375, { body, tongue })}</svg>`
  const marks = {
    'logo/mark-on-dark.svg': markSvg(C.text, 'url(#emberGrad)'),
    'logo/mark-on-light.svg': markSvg(C.bg, 'url(#emberGrad)'),
    'logo/mark-mono-white.svg': markSvg('#FFFFFF', '#FFFFFF'),
    'logo/mark-mono-black.svg': markSvg('#000000', '#000000'),
  }
  for (const [file, content] of Object.entries(marks)) {
    await writeSvg(file, content)
    for (const size of [256, 512, 1024]) {
      await sharp(Buffer.from(content), { density: 300 })
        .resize(size, size)
        .png()
        .toFile(join(OUT, file.replace('.svg', `-${size}.png`)))
    }
  }
  console.log('  ✓ logo PNGs (256/512/1024)')

  // ── App icon: mark on a rounded ember tile ───────────────────────────────
  const iconSvg = (s, rounded = true) =>
    svg(
      s,
      s,
      `<rect width="${s}" height="${s}" rx="${rounded ? s * 0.22 : 0}" fill="${C.surface}"/>
      <circle cx="${s / 2}" cy="${s * 0.62}" r="${s * 0.55}" fill="url(#glow)"/>
      <rect x="0.5" y="0.5" width="${s - 1}" height="${s - 1}" rx="${rounded ? s * 0.22 : 0}" fill="none" stroke="${C.border}"/>
      ${flame(s * 0.14, s * 0.12, s * 0.72)}`
    )
  await writeSvg('icon/app-icon.svg', iconSvg(512))
  for (const size of [32, 180, 192, 512, 1024]) {
    await sharp(Buffer.from(iconSvg(size)))
      .png()
      .toFile(join(OUT, `icon/app-icon-${size}.png`))
  }
  // Square (unrounded) for platforms that apply their own mask
  await sharp(Buffer.from(iconSvg(1024, false)))
    .png()
    .toFile(join(OUT, 'icon/app-icon-square-1024.png'))
  console.log('  ✓ app icons (32/180/192/512/1024, square)')

  // ── Wordmarks (transparent) ──────────────────────────────────────────────
  for (const [variant, color] of [
    ['on-dark', C.text],
    ['on-light', C.bg],
  ]) {
    const w = 1200
    const h = 320
    await render(
      `wordmark/wordmark-${variant}.png`,
      w,
      h,
      flame(60, 40, 240, { body: color }),
      [{ str: 'Emberly', size: 170, color, x: 300, y: h / 2, valign: 'middle' }]
    )
  }

  // ── Twitter / X ──────────────────────────────────────────────────────────
  // X's mobile app zooms the header and crops both sides, puts back/search
  // buttons in the top corners, and the avatar overlaps the bottom-left on
  // desktop. Keep everything as a centred lockup inside roughly x 400–1100.
  {
    const W = 1500
    const H = 500
    const word = await text('Emberly', { size: 104 })
    const flameSize = 150
    // The flame paths only occupy ~52% of their 375-unit box width
    const flameInk = flameSize * 0.52
    const gap = 22
    const lockup = flameInk + gap + word.width
    const left = (W - lockup) / 2
    const flameX = left - flameSize * (91 / 375)
    await render(
      'twitter/header-1500x500.png',
      W,
      H,
      `${backdrop(W, H, { gx: 0.5, gy: 0.45, gr: 0.4, seed: 11, emberCount: 90 })}
       ${flame(flameX, 88, flameSize)}`,
      [
        { str: 'Emberly', size: 104, x: left + flameInk + gap, y: 165 - word.height / 2 + 4, valign: 'top' },
        {
          str: 'Share files. Build together.',
          size: 34,
          weight: 500,
          color: C.muted,
          letterSpacing: 0,
          x: W / 2,
          y: 290,
          anchor: 'center',
        },
        { str: 'embrly.ca', size: 24, weight: 600, color: C.ember, letterSpacing: 0.02, x: W / 2, y: 350, anchor: 'center' },
      ]
    )
  }
  await render(
    'twitter/avatar-400.png',
    400,
    400,
    `<rect width="400" height="400" fill="${C.surface}"/>
     <circle cx="200" cy="250" r="230" fill="url(#glow)"/>
     ${flame(56, 44, 288)}`
  )

  // ── Discord ──────────────────────────────────────────────────────────────
  await render(
    'discord/server-icon-512.png',
    512,
    512,
    `<rect width="512" height="512" fill="${C.surface}"/>
     <circle cx="256" cy="320" r="300" fill="url(#glow)"/>
     ${flame(86, 70, 340)}`
  )
  await render(
    'discord/server-banner-960x540.png',
    960,
    540,
    `${backdrop(960, 540, { gx: 0.5, gy: 0.42, gr: 0.5, seed: 23, emberCount: 70 })}
     ${flame(390, 70, 180)}`,
    [
      { str: 'Emberly', size: 96, x: 480, y: 270, anchor: 'center' },
      {
        str: 'Community • Support • Updates',
        size: 30,
        weight: 500,
        color: C.muted,
        letterSpacing: 0,
        x: 480,
        y: 392,
        anchor: 'center',
      },
    ]
  )
  await render(
    'discord/invite-splash-1920x1080.png',
    1920,
    1080,
    `${backdrop(1920, 1080, { gx: 0.5, gy: 0.45, gr: 0.45, seed: 31, emberCount: 140 })}
     ${flame(810, 170, 300)}`,
    [
      { str: 'Emberly', size: 170, x: 960, y: 520, anchor: 'center' },
      {
        str: 'Share files. Build together.',
        size: 52,
        weight: 500,
        color: C.muted,
        letterSpacing: 0,
        x: 960,
        y: 735,
        anchor: 'center',
      },
    ]
  )
  await render(
    'discord/profile-banner-680x240.png',
    680,
    240,
    `${backdrop(680, 240, { gx: 0.82, gy: 0.5, gr: 0.5, seed: 41, emberCount: 40 })}
     ${flame(500, 30, 180)}`,
    [
      { str: 'Emberly', size: 64, x: 48, y: 64 },
      { str: 'embrly.ca', size: 24, weight: 600, color: C.ember, letterSpacing: 0.02, x: 51, y: 152 },
    ]
  )

  // ── Open Graph / social card ─────────────────────────────────────────────
  await render(
    'social/og-1200x630.png',
    1200,
    630,
    `${backdrop(1200, 630, { gx: 0.8, gy: 0.5, gr: 0.5, seed: 53, emberCount: 70 })}
     ${flame(800, 135, 340)}`,
    [
      { str: 'Emberly', size: 110, x: 90, y: 190 },
      {
        str: 'Open-source file sharing',
        size: 40,
        weight: 500,
        color: C.muted,
        letterSpacing: 0,
        x: 94,
        y: 335,
      },
      {
        str: 'and team collaboration.',
        size: 40,
        weight: 500,
        color: C.muted,
        letterSpacing: 0,
        x: 94,
        y: 388,
      },
      { str: 'embrly.ca', size: 28, weight: 600, color: C.ember, letterSpacing: 0.02, x: 94, y: 480 },
    ]
  )

  // ── Nameplates (horizontal badges for profiles, signatures, partner pages) ──
  const plate = (w, h, label) =>
    render(
      `nameplate/nameplate-${label}-${w}x${h}.png`,
      w,
      h,
      `<rect width="${w}" height="${h}" rx="${h / 2}" fill="${C.surface}"/>
       <clipPath id="pill"><rect width="${w}" height="${h}" rx="${h / 2}"/></clipPath>
       <g clip-path="url(#pill)">
         <circle cx="${h * 0.6}" cy="${h / 2}" r="${h * 1.6}" fill="url(#glow)"/>
         ${embers(w, h, Math.round(w / 40), 61, { x0: 0.35, x1: 1, y0: 0.1, y1: 0.9 })}
       </g>
       <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${h / 2 - 1}" fill="none" stroke="${C.border}" stroke-width="2"/>
       ${flame(h * 0.18, h * 0.12, h * 0.76)}`,
      [
        { str: 'Emberly', size: Math.round(h * 0.42), x: h * 1.02, y: h / 2, valign: 'middle' },
      ]
    )
  await plate(600, 120, 'default')
  await plate(1200, 240, 'large')

  // ── Fallback embed banner ────────────────────────────────────────────────
  await render(
    'social/banner-1600x900.png',
    1600,
    900,
    `${backdrop(1600, 900, { gx: 0.5, gy: 0.42, gr: 0.45, seed: 71, emberCount: 120 })}
     ${flame(675, 130, 250)}`,
    [
      { str: 'Emberly', size: 150, x: 800, y: 430, anchor: 'center' },
      {
        str: 'Share files. Build together.',
        size: 46,
        weight: 500,
        color: C.muted,
        letterSpacing: 0,
        x: 800,
        y: 620,
        anchor: 'center',
      },
    ]
  )

  // ── Files the site itself serves ─────────────────────────────────────────
  // Favicon/app icons and the logo live at the public root; the default social
  // card uses Next's static opengraph-image / twitter-image file convention.
  const PUBLIC = join(ROOT, 'public')
  const site = [
    ['icon/app-icon.svg', join(PUBLIC, 'favicon.svg')],
    ['icon/app-icon-180.png', join(PUBLIC, 'apple-touch-icon.png')],
    ['icon/app-icon-192.png', join(PUBLIC, 'icon-192.png')],
    ['icon/app-icon-512.png', join(PUBLIC, 'icon-512.png')],
    ['logo/mark-on-dark.svg', join(PUBLIC, 'icon.svg')],
    ['social/banner-1600x900.png', join(PUBLIC, 'banner.png')],
    ['social/og-1200x630.png', join(ROOT, 'app', 'opengraph-image.png')],
    ['social/og-1200x630.png', join(ROOT, 'app', 'twitter-image.png')],
  ]
  for (const [from, to] of site) await copyFile(join(OUT, from), to)
  // Maskable icon: square tile, platforms apply their own mask
  await sharp(join(OUT, 'icon/app-icon-square-1024.png'))
    .resize(512, 512)
    .png()
    .toFile(join(PUBLIC, 'icon-maskable-512.png'))
  console.log('  ✓ site favicon, app icons, logo, banner and social cards')

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
