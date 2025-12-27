import { createWorker } from 'tesseract.js'

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { getStorageProvider } from '@/packages/lib/storage'

import type { OCRTask } from './queue'

const logger = loggers.ocr

export async function processImageOCRTask({ filePath, fileId }: OCRTask) {
  try {
    const storageProvider = await getStorageProvider()
    const stream = await storageProvider.getFileStream(filePath)

    // Stream file into memory but enforce a hard size cap to avoid OOM
    const MAX_OCR_FILE_SIZE = parseInt(process.env.MAX_OCR_FILE_SIZE || String(20 * 1024 * 1024), 10) // 20MB default

    const chunks: Buffer[] = []
    let totalLength = 0
    for await (const chunk of stream) {
      const buf = Buffer.from(chunk)
      totalLength += buf.length
      if (totalLength > MAX_OCR_FILE_SIZE) {
        logger.warn('OCR file too large, skipping OCR', { filePath, fileId, size: totalLength })
        // Mark as processed without OCR to avoid requeueing
        await prisma.file.update({
          where: { id: fileId },
          data: {
            isOcrProcessed: true,
            ocrText: null,
            ocrConfidence: null,
          },
        })
        return { success: false, error: 'File too large for OCR' }
      }
      chunks.push(buf)
    }
    const fileBuffer = Buffer.concat(chunks)

    const worker = await createWorker()
    const {
      data: { text, confidence },
    } = await worker.recognize(fileBuffer)
    await worker.terminate()

    await prisma.file.update({
      where: { id: fileId },
      data: {
        ocrText: text.trim(),
        ocrConfidence: confidence,
        isOcrProcessed: true,
      },
    })

    logger.info('OCR processing completed', {
      filePath,
      fileId,
      confidence,
      textLength: text.trim().length,
    })
    return { success: true, text: text.trim(), confidence }
  } catch (error) {
    logger.error(`OCR processing failed for file ${filePath}`, error as Error, {
      fileId,
    })

    await prisma.file.update({
      where: { id: fileId },
      data: {
        isOcrProcessed: true,
        ocrText: null,
        ocrConfidence: null,
      },
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'OCR processing failed',
    }
  }
}

export interface OCRResult {
  success: boolean
  text?: string
  confidence?: number
  error?: string
}
