#!/usr/bin/env bun
/**
 * Media Kit Generator Script
 * 
 * Generates a complete media kit zip file containing:
 * - Logo files (SVG, PNG in various sizes)
 * - Color palette documentation
 * - Typography guidelines
 * - Brand guidelines document
 * - Promotional videos
 * - README with usage instructions
 * 
 * Usage: bun run scripts/generate-media-kit.ts
 */

import { mkdir, writeFile, copyFile, readFile, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const ROOT_DIR = process.cwd()
const PUBLIC_DIR = join(ROOT_DIR, 'public')
const OUTPUT_DIR = join(ROOT_DIR, 'tmp', 'media-kit')
const OUTPUT_ZIP = join(ROOT_DIR, 'public', 'emberly-media-kit.zip')

// Brand colors (HSL values from default theme)
const BRAND_COLORS = {
  primary: { name: 'Primary Orange', hsl: '24.6 95% 53.1%', hex: '#F97316', rgb: '249, 115, 22' },
  accent: { name: 'Accent', hsl: '24.6 95% 53.1%', hex: '#F97316', rgb: '249, 115, 22' },
  background: { name: 'Background', hsl: '240 10% 3.9%', hex: '#0A0A0B', rgb: '10, 10, 11' },
  foreground: { name: 'Foreground', hsl: '0 0% 98%', hex: '#FAFAFA', rgb: '250, 250, 250' },
  muted: { name: 'Muted', hsl: '240 3.7% 15.9%', hex: '#27272A', rgb: '39, 39, 42' },
  card: { name: 'Card', hsl: '240 10% 3.9%', hex: '#0A0A0B', rgb: '10, 10, 11' },
}

async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

async function generateReadme(): Promise<string> {
  return `# Emberly Media Kit

## About Emberly

Emberly is a developer-first, privacy-focused file sharing platform. This media kit contains official brand assets for press, partnerships, and promotional use.

## Contents

- \`/logos/\` - Logo files in various formats and sizes
- \`/colors/\` - Color palette documentation
- \`/typography/\` - Typography guidelines
- \`/videos/\` - Promotional video clips
- \`BRAND_GUIDELINES.md\` - Complete brand usage guidelines

## Quick Reference

### Brand Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Primary Orange | #F97316 | 249, 115, 22 | Brand color, CTAs, links |
| Background | #0A0A0B | 10, 10, 11 | Page backgrounds |
| Foreground | #FAFAFA | 250, 250, 250 | Primary text |
| Muted | #27272A | 39, 39, 42 | Subtle backgrounds |

### Typography

- **Font Family:** Inter
- **Headings:** Bold (700-800)
- **Body:** Regular (400)
- **UI Elements:** Medium (500)

### Logo Usage

- Always use official logos from this kit
- Maintain clear space around the logo
- Do not stretch, distort, or add effects
- Do not change brand colors

## Contact

- **Press inquiries:** press@embrly.ca
- **General inquiries:** hey@embrly.ca
- **GitHub:** https://github.com/EmberlyOSS

## License

These assets are provided for press and promotional use only. Please contact us for commercial licensing inquiries.

---

Generated on ${new Date().toISOString().split('T')[0]}
© ${new Date().getFullYear()} Emberly. All rights reserved.
`
}

async function generateBrandGuidelines(): Promise<string> {
  return `# Emberly Brand Guidelines

## Brand Identity

### Mission
Emberly is a developer-first file sharing platform focused on privacy, simplicity, and reliability.

### Brand Personality
- **Professional** - Clean, modern, trustworthy
- **Developer-focused** - Technical but accessible
- **Privacy-conscious** - Security-first mindset
- **Open** - Transparent and community-driven

## Logo

### Primary Logo
The Emberly logo consists of a flame icon mark paired with the wordmark. Use the primary logo whenever possible.

### Icon Mark
The flame icon can be used alone for favicons, app icons, and small spaces where the full logo won't fit.

### Wordmark
The text-only version can be used in inline contexts or where the icon would be redundant.

### Clear Space
Maintain a minimum clear space around the logo equal to the height of the "E" in Emberly.

### Minimum Sizes
- Full logo: 120px wide minimum
- Icon only: 24px minimum
- Favicon: 16px minimum

### Don'ts
- ❌ Don't stretch or distort the logo
- ❌ Don't change the brand colors
- ❌ Don't add drop shadows, gradients, or effects
- ❌ Don't place on busy or low-contrast backgrounds
- ❌ Don't rotate or flip the logo
- ❌ Don't outline or add strokes

## Color Palette

### Primary Colors

#### Primary Orange
- **Hex:** #F97316
- **RGB:** 249, 115, 22
- **HSL:** 24.6 95% 53.1%
- **Usage:** Primary brand color, call-to-action buttons, links, accents

### UI Colors (Dark Theme)

#### Background
- **Hex:** #0A0A0B
- **RGB:** 10, 10, 11
- **Usage:** Page backgrounds, base surfaces

#### Foreground
- **Hex:** #FAFAFA
- **RGB:** 250, 250, 250
- **Usage:** Primary text, headings

#### Muted
- **Hex:** #27272A
- **RGB:** 39, 39, 42
- **Usage:** Secondary backgrounds, borders, subtle elements

#### Card
- **Hex:** #0A0A0B
- **RGB:** 10, 10, 11
- **Usage:** Card surfaces, elevated elements

## Typography

### Font Family
**Inter** - A highly legible typeface designed for screens.

Available free from [Google Fonts](https://fonts.google.com/specimen/Inter).

### Font Weights

| Usage | Weight | Size |
|-------|--------|------|
| Page Titles | Bold (700-800) | 32-48px |
| Section Headers | Semibold (600) | 24-32px |
| Body Text | Regular (400) | 14-16px |
| UI Labels | Medium (500) | 12-14px |
| Captions | Regular (400) | 12px |

### Line Heights
- Headings: 1.2 - 1.3
- Body text: 1.5 - 1.6
- UI elements: 1.4

## Voice & Tone

### How to describe Emberly
- Developer-first file sharing platform
- Privacy-focused and open source
- Self-hostable with modern architecture
- Simple, fast, and reliable

### Writing Style
- Clear and concise
- Technical but accessible
- Friendly but professional
- Action-oriented

### Naming Conventions
- Always capitalize: **Emberly**
- Don't abbreviate or stylize (not "EMBERLY" or "emberly")
- Reference the project, not "the Emberly team"
- Use "Emberly" alone, not "Emberly app" or "Emberly service"

## Contact

For brand-related questions or custom asset requests:

- **Press:** press@embrly.ca
- **General:** hey@embrly.ca
- **GitHub:** https://github.com/EmberlyOSS

---

© ${new Date().getFullYear()} Emberly. All rights reserved.
`
}

async function generateColorPalette(): Promise<string> {
  let content = `# Emberly Color Palette

## Primary Brand Color

### Orange (#F97316)
The primary brand color representing energy, creativity, and warmth.

\`\`\`css
--primary: 24.6 95% 53.1%;
\`\`\`

| Format | Value |
|--------|-------|
| Hex | #F97316 |
| RGB | 249, 115, 22 |
| HSL | 24.6, 95%, 53.1% |

## Dark Theme Colors

`

  for (const [key, color] of Object.entries(BRAND_COLORS)) {
    content += `### ${color.name}

| Format | Value |
|--------|-------|
| Hex | ${color.hex} |
| RGB | ${color.rgb} |
| HSL | ${color.hsl} |

`
  }

  content += `## CSS Variables

\`\`\`css
:root {
  --primary: 24.6 95% 53.1%;
  --primary-foreground: 60 9.1% 97.8%;
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
}
\`\`\`
`

  return content
}

async function generateTypographyGuide(): Promise<string> {
  return `# Emberly Typography

## Font Family

### Inter

Inter is a carefully crafted open-source typeface designed for high legibility on computer screens.

**Download:** [Google Fonts](https://fonts.google.com/specimen/Inter)

## Font Stack

\`\`\`css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
\`\`\`

## Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Display | 48px / 3rem | 800 | 1.1 |
| H1 | 36px / 2.25rem | 700 | 1.2 |
| H2 | 30px / 1.875rem | 700 | 1.25 |
| H3 | 24px / 1.5rem | 600 | 1.3 |
| H4 | 20px / 1.25rem | 600 | 1.35 |
| Body Large | 18px / 1.125rem | 400 | 1.6 |
| Body | 16px / 1rem | 400 | 1.5 |
| Body Small | 14px / 0.875rem | 400 | 1.5 |
| Caption | 12px / 0.75rem | 400 | 1.4 |
| UI Label | 14px / 0.875rem | 500 | 1.4 |

## Usage Examples

### Headings

\`\`\`css
h1 {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
}
\`\`\`

### Body Text

\`\`\`css
p {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}
\`\`\`

### UI Elements

\`\`\`css
.button {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
}
\`\`\`
`
}

async function copyLogos() {
  const logosDir = join(OUTPUT_DIR, 'logos')
  await ensureDir(logosDir)

  // Copy SVG files
  const svgFiles = ['icon.svg', 'banner.png']
  for (const file of svgFiles) {
    const src = join(PUBLIC_DIR, file)
    if (existsSync(src)) {
      await copyFile(src, join(logosDir, file))
    }
  }

  // Create a simple logo variations info file
  const logoInfo = `# Logo Files

## icon.svg
The primary Emberly flame icon in SVG format. Scalable to any size.

## banner.png
The Emberly banner image for Open Graph and social media previews.

## Recommended Sizes

| Use Case | Size |
|----------|------|
| Favicon | 16x16, 32x32 |
| App Icon | 64x64, 128x128, 256x256, 512x512 |
| Social Media | 400x400 |
| Banner | 1200x630 |

## File Formats

- **SVG** - Vector format, use for web and print
- **PNG** - Raster format with transparency, use when SVG not supported
`

  await writeFile(join(logosDir, 'README.md'), logoInfo)
}

async function copyVideos() {
  const videosDir = join(OUTPUT_DIR, 'videos')
  await ensureDir(videosDir)

  const srcVideosDir = join(PUBLIC_DIR, 'videos')
  if (existsSync(srcVideosDir)) {
    const files = await readdir(srcVideosDir)
    for (const file of files) {
      if (file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.webm')) {
        await copyFile(join(srcVideosDir, file), join(videosDir, file))
      }
    }
  }

  const videoInfo = `# Promotional Videos

## Contents

- **site-preview-ad.mp4** - Quick overview of the Emberly interface and main features (~15s)
- **uploading-ad.mp4** - Demonstration of the seamless file upload experience (~10s)

## Usage

These videos can be used for:
- Social media posts and ads
- Press coverage and articles
- Presentations and demos
- Partner promotional materials

## Technical Specs

- Format: MP4 (H.264)
- Resolution: 1920x1080 (1080p)
- Frame Rate: 30fps
- Audio: None (silent)

## Attribution

Please credit "Emberly" when using these videos in publications.
`

  await writeFile(join(videosDir, 'README.md'), videoInfo)
}

async function createZip() {
  // Try to use system zip command
  try {
    if (process.platform === 'win32') {
      // PowerShell Compress-Archive
      await execAsync(`powershell -Command "Compress-Archive -Path '${OUTPUT_DIR}\\*' -DestinationPath '${OUTPUT_ZIP}' -Force"`)
    } else {
      // Unix zip
      await execAsync(`cd "${OUTPUT_DIR}" && zip -r "${OUTPUT_ZIP}" .`)
    }
    console.log(`✓ Created zip: ${OUTPUT_ZIP}`)
  } catch (error) {
    console.error('Failed to create zip file:', error)
    console.log('Media kit files are available in:', OUTPUT_DIR)
  }
}

async function main() {
  console.log('🎨 Generating Emberly Media Kit...\n')

  // Clean and create output directory
  await ensureDir(OUTPUT_DIR)

  // Generate documentation
  console.log('📝 Generating documentation...')
  await writeFile(join(OUTPUT_DIR, 'README.md'), await generateReadme())
  await writeFile(join(OUTPUT_DIR, 'BRAND_GUIDELINES.md'), await generateBrandGuidelines())

  // Create subdirectories and content
  const colorsDir = join(OUTPUT_DIR, 'colors')
  const typographyDir = join(OUTPUT_DIR, 'typography')
  await ensureDir(colorsDir)
  await ensureDir(typographyDir)

  await writeFile(join(colorsDir, 'COLOR_PALETTE.md'), await generateColorPalette())
  await writeFile(join(typographyDir, 'TYPOGRAPHY.md'), await generateTypographyGuide())

  // Copy assets
  console.log('📦 Copying logo assets...')
  await copyLogos()

  console.log('🎬 Copying video assets...')
  await copyVideos()

  // Create zip file
  console.log('🗜️  Creating zip archive...')
  await createZip()

  console.log('\n✅ Media kit generated successfully!')
  console.log(`   Output: ${OUTPUT_ZIP}`)
  console.log(`   Files: ${OUTPUT_DIR}`)
}

main().catch(console.error)
