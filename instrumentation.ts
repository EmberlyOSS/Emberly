export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      await import('./sentry.server.config')
    }

    const { runStartupTasks } = await import('./packages/lib/startup/index')
    const { loggers } = await import('./packages/lib/logger')
    const logger = loggers.startup

    runStartupTasks()
      .then(() =>
        logger.debug('Startup tasks completed via instrumentation hook')
      )
      .catch((err) => logger.error('Startup tasks failed', err as Error))

    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        const memUsage = process.memoryUsage()
        if (memUsage.heapUsed > 1024 * 1024 * 1024) {
          logger.warn('High memory usage detected', {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
            external: Math.round(memUsage.external / 1024 / 1024) + 'MB',
          })
        }
      }, 60000)
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      await import('./sentry.edge.config')
    }
  }
}

export { captureRequestError as onRequestError } from '@sentry/nextjs'
