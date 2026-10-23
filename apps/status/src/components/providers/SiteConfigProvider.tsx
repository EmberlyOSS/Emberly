'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface SiteConfig {
    authEnabled: boolean;
    databaseConnected: boolean;
    emailConfigured: boolean;
    isLoading: boolean;
    errors: string[];
    warnings: string[];
    lastChecked: Date | null;
}

interface SiteConfigContextType {
    config: SiteConfig;
    refreshConfig: () => Promise<void>;
}

const defaultConfig: SiteConfig = {
    authEnabled: false, // Start disabled until health check confirms it's available
    databaseConnected: false,
    emailConfigured: false,
    isLoading: true,
    errors: [],
    warnings: [],
    lastChecked: null,
};

const SiteConfigContext = createContext<SiteConfigContextType>({
    config: defaultConfig,
    refreshConfig: async () => {},
});

export function useSiteConfig() {
    const context = useContext(SiteConfigContext);
    if (!context) {
        throw new Error('useSiteConfig must be used within a SiteConfigProvider');
    }
    return context;
}

interface SiteConfigProviderProps {
    children: ReactNode;
}

export function SiteConfigProvider({ children }: SiteConfigProviderProps) {
    const [config, setConfig] = useState<SiteConfig>(defaultConfig);

    const refreshConfig = useCallback(async () => {
        try {
            const response = await fetch('/api/status/health', {
                method: 'GET',
                cache: 'no-store',
            });

            if (response.ok) {
                const data = await response.json();
                setConfig({
                    authEnabled: data.authEnabled ?? true,
                    databaseConnected: data.database?.connected ?? false,
                    emailConfigured: data.email?.configured ?? false,
                    isLoading: false,
                    errors: data.errors ?? [],
                    warnings: data.warnings ?? [],
                    lastChecked: new Date(),
                });
            } else {
                setConfig((prev) => ({
                    ...prev,
                    isLoading: false,
                    errors: ['Failed to check system status'],
                    lastChecked: new Date(),
                }));
            }
        } catch (error) {
            console.error('[SiteConfig] Failed to fetch config:', error);
            setConfig((prev) => ({
                ...prev,
                isLoading: false,
                lastChecked: new Date(),
            }));
        }
    }, []);

    useEffect(() => {
        refreshConfig();
        const interval = setInterval(refreshConfig, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [refreshConfig]); // stable ref via useCallback

    return <SiteConfigContext.Provider value={{ config, refreshConfig }}>{children}</SiteConfigContext.Provider>;
}

export default SiteConfigContext;
