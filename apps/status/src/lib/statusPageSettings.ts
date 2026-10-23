import type { HomePageDisplay } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const SETTINGS_ID = 'singleton';

export const RECENT_HISTORY_DAY_OPTIONS = [7, 14, 30] as const;

export interface StatusPageConfig {
    homePageDisplay: HomePageDisplay;
    showRecentHistory: boolean;
    recentHistoryDays: number;
}

const DEFAULTS: StatusPageConfig = { homePageDisplay: 'BOTH', showRecentHistory: true, recentHistoryDays: 14 };

export async function getStatusPageSettings(): Promise<StatusPageConfig> {
    const settings = await prisma.statusPageSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (!settings) return DEFAULTS;
    return {
        homePageDisplay: settings.homePageDisplay,
        showRecentHistory: settings.showRecentHistory,
        recentHistoryDays: settings.recentHistoryDays,
    };
}

export async function updateStatusPageSettings(patch: Partial<StatusPageConfig>): Promise<StatusPageConfig> {
    const settings = await prisma.statusPageSettings.upsert({
        where: { id: SETTINGS_ID },
        update: patch,
        create: { id: SETTINGS_ID, ...DEFAULTS, ...patch },
    });
    return {
        homePageDisplay: settings.homePageDisplay,
        showRecentHistory: settings.showRecentHistory,
        recentHistoryDays: settings.recentHistoryDays,
    };
}

export async function getHomePageDisplay(): Promise<HomePageDisplay> {
    return (await getStatusPageSettings()).homePageDisplay;
}
