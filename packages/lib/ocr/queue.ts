import { getConfig } from '@/packages/lib/config'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

import { processImageOCRTask } from './processor'

const logger = loggers.ocr

interface OCRTask {
  filePath: string
  fileId: string
}

class OCRQueue {
  private queue: OCRTask[] = []
  private processing: boolean = false
  private concurrentLimit: number = 1
  private activeProcesses: number = 0
  private maxQueueLength: number = parseInt(process.env.OCR_MAX_QUEUE_LENGTH || '50', 10)

  async add(task: OCRTask, force: boolean = false) {
    if (!force) {
      const config = await getConfig()
      if (!config.settings.general.ocr.enabled) {
        logger.debug('OCR processing is disabled in settings, skipping queue', {
          fileId: task.fileId,
        })
        await prisma.file.update({
          where: { id: task.fileId },
          data: {
            isOcrProcessed: true,
            ocrText: null,
            ocrConfidence: null,
          },
        })
        return
      }
    }

    // Prevent unbounded queue growth
    if (this.queue.length >= this.maxQueueLength) {
      logger.warn('OCR queue full; skipping task', { fileId: task.fileId, queueLength: this.queue.length })
      // Mark file as processed but without OCR results to avoid backlog
      await prisma.file.update({
        where: { id: task.fileId },
        data: {
          isOcrProcessed: true,
          ocrText: null,
          ocrConfidence: null,
        },
      })
      return
    }

    this.queue.push(task)
    this.processQueue()
  }

  private async processQueue() {
    if (this.processing || this.activeProcesses >= this.concurrentLimit) return

    this.processing = true

    while (
      this.queue.length > 0 &&
      this.activeProcesses < this.concurrentLimit
    ) {
      const task = this.queue.shift()
      if (!task) continue

      this.activeProcesses++

      try {
        await processImageOCRTask(task)
      } catch (error) {
        logger.error(
          `OCR processing failed for file ${task.filePath}`,
          error as Error,
          {
            fileId: task.fileId,
          }
        )
      } finally {
        this.activeProcesses--
      }
    }

    this.processing = false

    if (this.queue.length > 0 && this.activeProcesses < this.concurrentLimit) {
      this.processQueue()
    }
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getActiveProcesses(): number {
    return this.activeProcesses
  }
}

export const ocrQueue = new OCRQueue()

export type { OCRTask }
