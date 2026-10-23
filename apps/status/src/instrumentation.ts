export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { performStartupCheck } = await import('./lib/startup');
        await performStartupCheck();

        const { startMonitorScheduler } = await import('./lib/monitor-scheduler');
        startMonitorScheduler();
    }
}
