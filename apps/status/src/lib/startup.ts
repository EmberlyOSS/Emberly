import { getConfigStatus, logConfigStatus } from './config-check';

let startupCheckPerformed = false;

export async function performStartupCheck(): Promise<void> {
    if (startupCheckPerformed) {
        return;
    }

    startupCheckPerformed = true;

    try {
        const status = await getConfigStatus(true);

        if (process.env.NODE_ENV !== 'production' || !status.overall.healthy) {
            logConfigStatus(status);
        }
    } catch (error) {
        console.error('❌ Startup check failed:', error);
    }
}

export function getStartupStatus(): { performed: boolean } {
    return { performed: startupCheckPerformed };
}
