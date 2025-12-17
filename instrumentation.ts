export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runStartupTasks } = await import('./packages/lib/startup/index')
    const { loggers } = await import('./packages/lib/logger')
    const logger = loggers.startup

    // Run startup tasks asynchronously so they don't block server startup.
    // This prevents long-running or retrying startup work from delaying
    // the app process (useful for containerized environments).
    runStartupTasks()
      .then(() =>
        logger.debug('Startup tasks completed via instrumentation hook')
      )
      .catch((err) => logger.error('Startup tasks failed', err as Error))

    // Monitor memory usage in production
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        const memUsage = process.memoryUsage()
        if (memUsage.heapUsed > 1024 * 1024 * 1024) {
          // 1GB threshold
          logger.warn('High memory usage detected', {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
            external: Math.round(memUsage.external / 1024 / 1024) + 'MB',
          })
        }
      }, 60000) // Check every minute
    }
  }
}
