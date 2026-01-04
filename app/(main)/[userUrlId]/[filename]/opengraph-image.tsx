import { ImageResponse } from 'next/og'

import { prisma } from '@/packages/lib/database/prisma'
import { classifyMimeType } from '@/packages/lib/embeds/file-classification'

export const runtime = 'nodejs'
export const alt = 'File shared via Emberly'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

interface Props {
  params: Promise<{ userUrlId: string; filename: string }>
}

export default async function Image({ params }: Props) {
  const { userUrlId, filename } = await params
  const urlPath = `/${userUrlId}/${filename}`

  // Hawkins Neon theme colors
  const backgroundColor = 'hsl(232, 36%, 6%)'
  const primaryColor = 'hsl(354, 82%, 52%)'
  const foregroundColor = 'hsl(210, 40%, 96%)'
  const mutedColor = 'hsl(215, 16%, 72%)'

  // Try to get file info
  let file = await prisma.file.findUnique({
    where: { urlPath },
    select: { name: true, mimeType: true, size: true },
  })

  // Try alternate path if filename has spaces
  if (!file && filename.includes(' ')) {
    const urlSafeFilename = filename.replace(/ /g, '-')
    const urlSafePath = `/${userUrlId}/${urlSafeFilename}`
    file = await prisma.file.findUnique({
      where: { urlPath: urlSafePath },
      select: { name: true, mimeType: true, size: true },
    })
  }

  const fileName = file?.name || filename
  const classification = classifyMimeType(file?.mimeType)

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const fileSize = file?.size ? formatSize(file.size) : ''

  // Get file type icon using proper classification
  const getFileTypeLabel = () => {
    if (classification.isImage) return '🖼️ Image'
    if (classification.isVideo) return '🎬 Video'
    if (classification.isMusic) return '🎵 Audio'
    if (classification.isDocument && file?.mimeType?.includes('pdf')) return '📄 PDF'
    if (classification.isDocument && (file?.mimeType?.includes('zip') || file?.mimeType?.includes('rar'))) return '📦 Archive'
    if (classification.isCode) return '💻 Code'
    if (classification.isAudio) return '🎵 Audio'
    return '📁 File'
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: backgroundColor,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at 30% 20%, hsla(354, 82%, 52%, 0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 80%, hsla(197, 92%, 54%, 0.15) 0%, transparent 50%)`,
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            padding: '60px',
            textAlign: 'center',
          }}
        >
          {/* Emberly Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 375 375"
              width="60"
              height="60"
              style={{ marginRight: '16px' }}
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
                fontSize: '48px',
                fontWeight: 700,
                color: foregroundColor,
                letterSpacing: '-0.02em',
              }}
            >
              Emberly
            </span>
          </div>

          {/* File type badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 20px',
              background: 'hsla(354, 82%, 52%, 0.2)',
              borderRadius: '20px',
              marginBottom: '24px',
            }}
          >
            <span style={{ fontSize: '20px', color: primaryColor }}>
              {getFileTypeLabel()}
            </span>
          </div>

          {/* File name */}
          <h1
            style={{
              fontSize: '42px',
              fontWeight: 600,
              color: foregroundColor,
              margin: '0 0 16px 0',
              maxWidth: '900px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fileName}
          </h1>

          {/* File size */}
          {fileSize && (
            <p
              style={{
                fontSize: '24px',
                color: mutedColor,
                margin: 0,
              }}
            >
              {fileSize}
            </p>
          )}
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            display: 'flex',
            alignItems: 'center',
            color: mutedColor,
            fontSize: '18px',
          }}
        >
          Shared via Emberly
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
