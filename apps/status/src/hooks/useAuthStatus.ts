'use client';

import { useSiteConfig } from '@/components/providers/SiteConfigProvider';

export function useAuthStatus() {
    const { config } = useSiteConfig();

    return {
        isLoading: config.isLoading,
        isEnabled: config.authEnabled,
        databaseConnected: config.databaseConnected,
        emailConfigured: config.emailConfigured,
        errors: config.errors,
        warnings: config.warnings,
    };
}

export function useFeatureAvailability(requiresAuth: boolean = false, requiresEmail: boolean = false) {
    const { config } = useSiteConfig();

    if (config.isLoading) {
        return { isAvailable: true, isLoading: true, reason: null };
    }

    if (requiresAuth && !config.authEnabled) {
        return {
            isAvailable: false,
            isLoading: false,
            reason: 'Authentication is currently unavailable',
        };
    }

    if (requiresEmail && !config.emailConfigured) {
        return {
            isAvailable: false,
            isLoading: false,
            reason: 'Email service is not configured',
        };
    }

    return { isAvailable: true, isLoading: false, reason: null };
}
