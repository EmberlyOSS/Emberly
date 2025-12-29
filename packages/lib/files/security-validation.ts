/**
 * File Security Validation Module
 *
 * Single export: validateFileSecurityChecksWithVT
 * Combines local checks (dangerous extensions, MIME types, zip bombs) + VirusTotal scanning
 */

import { extname } from 'path'
import { createHash } from 'crypto'

const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jse', '.vbe',
  '.ps1', '.ps2', '.psc1', '.psc2', '.msh', '.msh1', '.msh2', '.mshxml',
  '.msh1xml', '.msh2xml', '.elf', '.bin', '.sh', '.bash', '.csh', '.ksh',
  '.zsh', '.pl', '.py', '.rb', '.php', '.asp', '.aspx', '.jsp', '.jspx',
  '.cfm', '.cfc', '.docm', '.xlsm', '.pptm', '.potm', '.ppam', '.ppsm',
  '.sldm', '.dll', '.so', '.dylib', '.o', '.a', '.lib', '.msi', '.msp',
  '.cab', '.jar', '.class', '.lnk', '.url', '.scf', '.inf', '.reg', '.hta', '.chm',
])

const DANGEROUS_MIME_TYPES = new Set([
  'application/x-msdownload', 'application/x-msdos-program', 'application/x-executable',
  'application/x-elf-executable', 'application/x-sharedlib', 'application/x-object',
  'application/x-shellscript', 'application/x-bash', 'application/x-perl',
  'application/x-python', 'application/x-ruby', 'application/x-php',
  'application/x-asp', 'application/x-jsp',
  'application/vnd.ms-excel.addin.macroEnabled.12',
  'application/vnd.ms-word.document.macroEnabled.12',
  'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
])

export interface FileSecurityCheckResult {
  valid: boolean
  error?: string
  warnings?: string[]
  virusTotal?: VirusTotalScanResult
}

export interface VirusTotalScanResult {
  scanPerformed: boolean
  detected: boolean
  detectionCount?: number
  detectionRatio?: string
  permalink?: string
  error?: string
  rateLimited?: boolean
}

/**
 * Check for dangerous extensions and MIME types
 */
function checkBasicSecurity(filename: string, mimeType: string): FileSecurityCheckResult {
  const ext = extname(filename).toLowerCase()
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File extension "${ext}" is not allowed. Executable and script files cannot be uploaded.`,
    }
  }

  if (DANGEROUS_MIME_TYPES.has(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `File type "${mimeType}" is not allowed. Executable and script files cannot be uploaded.`,
    }
  }

  return { valid: true }
}

/**
 * Detect zip bombs by analyzing compression ratio
 */
function checkZipBomb(buffer: Buffer, filename: string): FileSecurityCheckResult {
  if (!filename.toLowerCase().endsWith('.zip') || buffer.length < 4) {
    return { valid: true }
  }

  // Check for ZIP file signature
  if (buffer.readUInt32LE(0) !== 0x04034b50) {
    return { valid: false, error: 'Invalid ZIP file format' }
  }

  try {
    let uncompressedTotal = 0
    let fileCount = 0
    let pos = Math.max(0, buffer.length - 65557)

    while (pos < buffer.length - 21) {
      if (buffer.readUInt32LE(pos) === 0x02014b50) {
        let cdPos = pos
        while (cdPos < buffer.length - 45) {
          if (buffer.readUInt32LE(cdPos) === 0x02014b50) {
            fileCount++
            const uncompressedSize = buffer.readUInt32LE(cdPos + 24)
            uncompressedTotal += uncompressedSize

            if (fileCount > 10000) {
              return { valid: false, error: 'Archive contains too many files (>10k). Potential zip bomb.' }
            }
            if (uncompressedTotal > 50 * 1024 * 1024 * 1024) {
              return { valid: false, error: 'Archive expands to >50GB. Potential zip bomb detected.' }
            }

            const filenameLen = buffer.readUInt16LE(cdPos + 26)
            const extraLen = buffer.readUInt16LE(cdPos + 30)
            const commentLen = buffer.readUInt16LE(cdPos + 32)
            cdPos += 46 + filenameLen + extraLen + commentLen
          } else {
            break
          }
        }
        break
      }
      pos++
    }

    if (buffer.length > 0 && uncompressedTotal > 0) {
      const ratio = uncompressedTotal / buffer.length
      if (ratio > 100) {
        return { valid: false, error: `Suspicious compression ratio (${ratio.toFixed(1)}:1). Potential zip bomb.` }
      }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Failed to validate ZIP file format.' }
  }
}

/**
 * Check VirusTotal for known malware (hash-based, no upload)
 */
async function checkVirusTotal(buffer: Buffer, mimeType: string): Promise<VirusTotalScanResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY
  if (!apiKey) {
    return { scanPerformed: false, detected: false }
  }

  // Skip scanning images, videos, audio
  if (mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
    return { scanPerformed: false, detected: false }
  }

  try {
    const hash = createHash('sha256').update(buffer).digest('hex')
    const response = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      method: 'GET',
      headers: { 'x-apikey': apiKey },
    })

    if (response.status === 404) {
      return { scanPerformed: true, detected: false }
    }
    if (response.status === 429) {
      return { scanPerformed: false, detected: false, rateLimited: true, error: 'VirusTotal rate limit reached.' }
    }
    if (!response.ok) {
      return { scanPerformed: false, detected: false, error: `VirusTotal API error: ${response.statusText}` }
    }

    const data = (await response.json()) as any
    const stats = data.data?.attributes?.last_analysis_stats
    if (!stats) {
      return { scanPerformed: true, detected: false }
    }

    const maliciousCount = stats.malicious || 0
    const totalCount = Object.values(stats).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0)

    return {
      scanPerformed: true,
      detected: maliciousCount > 0,
      detectionCount: maliciousCount,
      detectionRatio: `${maliciousCount}/${totalCount}`,
      permalink: data.data?.links?.self || undefined,
    }
  } catch (error) {
    console.error('VirusTotal check failed:', error)
    return { scanPerformed: false, detected: false, error: 'Failed to check VirusTotal' }
  }
}

/**
 * Main validation function: local checks + optional VirusTotal scanning
 */
export async function validateFileSecurityChecksWithVT(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<FileSecurityCheckResult> {
  // Local checks first
  const basicCheck = checkBasicSecurity(filename, mimeType)
  if (!basicCheck.valid) {
    return basicCheck
  }

  const zipCheck = checkZipBomb(buffer, filename)
  if (!zipCheck.valid) {
    return zipCheck
  }

  // VirusTotal check
  const vtResult = await checkVirusTotal(buffer, mimeType)

  if (vtResult.detected) {
    return {
      valid: false,
      error: `File flagged as malware by VirusTotal (${vtResult.detectionRatio} detections). Scan: ${vtResult.permalink}`,
      virusTotal: vtResult,
    }
  }

  return {
    valid: true,
    virusTotal: vtResult.scanPerformed ? vtResult : undefined,
  }
}
