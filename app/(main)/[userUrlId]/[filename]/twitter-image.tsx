import { ImageResponse } from 'next/og'

import { getConfig } from '@/packages/lib/config'
import { classifyMimeType } from '@/packages/lib/embeds/file-classification'
import { findFileByUrlPath } from '@/packages/lib/files/lookup'
import { formatFileSize } from '@/packages/lib/utils'

export const runtime = 'nodejs'
export const alt = 'File shared via Emberly'
export const size = {
  width: 1200,
  height: 628,
}
export const contentType = 'image/png'

interface Props {
  params: Promise<{ userUrlId: string; filename: string }>
}

/** Convert space-separated HSL config value to a valid CSS hsl() string. */
function hsl(val: string | null | undefined, fallback: string): string {
  if (!val) return fallback
  const parts = val.trim().split(/\s+/)
  return parts.length === 3
    ? `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`
    : fallback
}

export default async function Image({ params }: Props) {
  const { userUrlId, filename } = await params

  // Fetch file info and user settings to check enableRichEmbeds
  const fileResult = await findFileByUrlPath(userUrlId, filename, {
    include: { user: { select: { enableRichEmbeds: true } } },
  })

  // If rich embeds disabled or file not found, return 404 to prevent branded embed cards
  if (!fileResult || fileResult.user?.enableRichEmbeds === false) {
    return new Response('Not Found', { status: 404 })
  }

  // Fetch site config
  const config = await getConfig()

  // Read theme from site config; fall back to a neutral dark default
  const colors = config.settings.appearance.customColors
  const backgroundColor = hsl(colors?.background, 'hsl(222, 84%, 5%)')
  const primaryColor = hsl(colors?.primary, 'hsl(25, 95%, 53%)')
  const foregroundColor = hsl(colors?.foreground, 'hsl(210, 40%, 98%)')
  const mutedColor = 'hsl(215, 20%, 65%)'

  const fileName = fileResult?.name || filename
  const classification = classifyMimeType(fileResult?.mimeType)
  const fileSize = fileResult?.size ? formatFileSize(fileResult.size) : ''

  type TypeInfo = { icon: string; label: string }
  const typeInfo: TypeInfo = (() => {
    if (classification.isVideo) return { icon: '🎬', label: 'Video' }
    if (classification.isMusic || classification.isAudio)
      return { icon: '🎵', label: 'Audio' }
    if (classification.isImage) return { icon: '🖼️', label: 'Image' }
    if (classification.isDocument && fileResult?.mimeType?.includes('pdf'))
      return { icon: '📄', label: 'PDF Document' }
    if (classification.isDocument) return { icon: '📋', label: 'Document' }
    if (classification.isCode) return { icon: '💻', label: 'Code' }
    if (classification.isText) return { icon: '📝', label: 'Text' }
    return { icon: '📁', label: 'File' }
  })()

  return new ImageResponse(
    <div
      style={{
        background: backgroundColor,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Subtle radial gradient accents using primary color */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 15% 0%, ${primaryColor}20 0%, transparent 55%),
                         radial-gradient(ellipse at 85% 100%, ${primaryColor}12 0%, transparent 50%)`,
          display: 'flex',
        }}
      />

      {/* Layout: top logo, center content, bottom footer */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: '48px 68px',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top: Emberly wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 375 375"
            width="42"
            height="42"
          >
            <path
              style={{ fill: foregroundColor }}
              d="M 133.605469 292.523438 C 119 250 140.367188 221.316406 163.433594 194.726562 C 185.085938 169.761719 209.632812 141.460938 203.160156 90.417969 C 202.625 86.183594 201.742188 82.175781 200.609375 78.34375 C 263.273438 144.074219 190.074219 264.175781 216.992188 262.679688 C 229.292969 261.992188 246.4375 231.386719 244.046875 158.132812 C 244.046875 158.132812 284.792969 212.761719 276.535156 267.296875 C 271.472656 300.714844 242.191406 342.46875 188.445312 334.503906 C 163.886719 330.863281 140.933594 313.871094 133.605469 292.523438"
            />
            <path
              style={{ fill: primaryColor }}
              d="M 184.242188 21.605469 C 184.242188 21.605469 180.738281 41.964844 189.011719 72.355469 C 197.183594 102.375 192.621094 125.648438 187.855469 138.554688 C 173.65625 177.011719 137.921875 193.757812 122.191406 234.230469 C 115.824219 250.605469 102.488281 306.734375 164.113281 335.5 C 164.113281 335.5 114.042969 325.144531 97.09375 280.464844 C 83.359375 244.253906 95.5 198.558594 133.40625 156.972656 C 188.738281 96.265625 157.191406 55.503906 184.242188 21.605469"
            />
          </svg>
          <span
            style={{
              fontSize: '30px',
              fontWeight: 700,
              color: foregroundColor,
              letterSpacing: '-0.01em',
            }}
          >
            Emberly
          </span>
        </div>

        {/* Center: file type badge + name + size */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '0px',
          }}
        >
          {/* Type badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: `${primaryColor}22`,
              border: `1px solid ${primaryColor}44`,
              borderRadius: '100px',
              padding: '10px 24px',
              marginBottom: '28px',
            }}
          >
            <span style={{ fontSize: '20px' }}>{typeInfo.icon}</span>
            <span
              style={{ fontSize: '20px', color: primaryColor, fontWeight: 600 }}
            >
              {typeInfo.label}
            </span>
          </div>

          {/* File name — shrink font if long */}
          <div
            style={{
              fontSize:
                fileName.length > 50
                  ? '30px'
                  : fileName.length > 35
                    ? '36px'
                    : '44px',
              fontWeight: 700,
              color: foregroundColor,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              maxWidth: '980px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fileName}
          </div>

          {/* File size */}
          {fileSize && (
            <div
              style={{
                fontSize: '22px',
                color: mutedColor,
                marginTop: '14px',
                fontWeight: 400,
              }}
            >
              {fileSize}
            </div>
          )}
        </div>

        {/* Bottom: "Shared via Emberly" with dot accent */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: primaryColor,
            }}
          />
          <span style={{ fontSize: '20px', color: mutedColor }}>
            Shared via Emberly
          </span>
        </div>
      </div>
    </div>,
    { ...size }
  )
}
