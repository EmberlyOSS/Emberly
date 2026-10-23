/**
 * Built-in monitor scheduler.
 *
 * Calls the app's own /api/cron/run-monitors on a short tick so monitors run
 * without an external cron job (handy on Dokploy and other container hosts).
 * The route itself skips monitors checked within their configured interval,
 * so ticking more often than the shortest interval is safe.
 *
 * Disable with MONITOR_SCHEDULER=false if you'd rather trigger the route from
 * an external scheduler. Run only one replica with it enabled, or monitors
 * will be checked once per replica.
 */

const TICK_MS = 30_000;
const FIRST_RUN_DELAY_MS = 15_000;

// Stored on globalThis so dev hot reloads don't start a second timer
const g = globalThis as typeof globalThis & { __monitorScheduler?: NodeJS.Timeout };

export function startMonitorScheduler(): void {
    if (process.env.MONITOR_SCHEDULER === 'false' || g.__monitorScheduler) return;

    const port = process.env.PORT || 3000;
    const url = `http://127.0.0.1:${port}/api/cron/run-monitors`;
    const secret = process.env.CRON_SECRET;
    let running = false;

    const tick = async () => {
        if (running) return;
        running = true;
        try {
            const res = await fetch(url, {
                headers: secret ? { Authorization: `Bearer ${secret}` } : {},
                signal: AbortSignal.timeout(TICK_MS * 4),
            });
            if (!res.ok) console.error(`[monitors] scheduler run failed: HTTP ${res.status}`);
        } catch (error) {
            console.error('[monitors] scheduler run failed:', error instanceof Error ? error.message : error);
        } finally {
            running = false;
        }
    };

    setTimeout(tick, FIRST_RUN_DELAY_MS);
    g.__monitorScheduler = setInterval(tick, TICK_MS);
    console.log('[monitors] built-in scheduler started (every 30s)');
}
