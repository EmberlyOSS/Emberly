'use client';

import { usePathname } from 'next/navigation';
import type React from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import GlobalLoader from '@/components/ui/GlobalLoader';
import { useHydration } from '@/utils/hydration';

interface LoadingContextType {
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    isHydrated: boolean;
    pageReady: boolean;
}

const LoadingContext = createContext<LoadingContextType>({
    isLoading: false,
    setIsLoading: () => {},
    isHydrated: false,
    pageReady: false,
});

export const useLoading = () => useContext(LoadingContext);

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showLoader, setShowLoader] = useState(true);
    const isHydrated = useHydration();
    const [pageReady, setPageReady] = useState(false);
    const _pathname = usePathname();
    const isInitialMount = useRef(true);

    // Handle initial page load - wait for hydration then fade out
    useEffect(() => {
        if (isHydrated && showLoader) {
            // Wait a moment for content to settle, then hide loader
            const timer = setTimeout(() => {
                setShowLoader(false);
                setPageReady(true);
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [isHydrated, showLoader]);

    // Track route changes (but not initial mount)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Route changed - could add loading state here if needed
        // For now, Next.js handles route transitions smoothly
    }, []);

    return (
        <LoadingContext.Provider value={{ isLoading, setIsLoading, isHydrated, pageReady }}>
            <GlobalLoader isVisible={showLoader} />
            <div style={{ opacity: showLoader ? 0 : 1, transition: 'opacity 0.2s ease-in' }}>{children}</div>
        </LoadingContext.Provider>
    );
}
