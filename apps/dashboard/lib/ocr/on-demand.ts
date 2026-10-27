import { processImageOCRTask, type OCRResult } from './processor'

const MAX_WAITING = 10
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000

let chain: Promise<unknown> = Promise.resolve()
let waiting = 0
const inFlight = new Map<string, Promise<OCRResult>>()
const failedAt = new Map<string, number>()

export type OnDemandResult =
  | { status: 'done'; result: OCRResult }
  | { status: 'busy' }
  | { status: 'cooling-down' }

/**
 * Runs OCR for a viewer's "Extract text" request. Recognitions run one at a
 * time per process, repeat requests for the same image share one run, and an
 * image that just failed isn't retried for a few minutes.
 */
export async function runOnDemandOCR(
  filePath: string,
  fileId: string
): Promise<OnDemandResult> {
  const existing = inFlight.get(fileId)
  if (existing) return { status: 'done', result: await existing }

  const failed = failedAt.get(fileId)
  if (failed && Date.now() - failed < FAILURE_COOLDOWN_MS) {
    return { status: 'cooling-down' }
  }

  if (waiting >= MAX_WAITING) return { status: 'busy' }

  waiting++
  const run = chain
    .catch(() => {})
    .then(() => processImageOCRTask({ filePath, fileId }))
    .catch(() => ({ success: false }) as OCRResult)
    .finally(() => {
      waiting--
      inFlight.delete(fileId)
    })
  chain = run
  inFlight.set(fileId, run)

  const result = await run
  if (result.success) failedAt.delete(fileId)
  else failedAt.set(fileId, Date.now())
  if (failedAt.size > 1000) {
    const cutoff = Date.now() - FAILURE_COOLDOWN_MS
    for (const [id, at] of failedAt) if (at < cutoff) failedAt.delete(id)
  }

  // Storage errors can include internal paths, so callers only see a generic message
  return {
    status: 'done',
    result: result.success
      ? result
      : { success: false, error: 'Couldn’t read text from this image' },
  }
}
