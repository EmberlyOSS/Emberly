'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

// Use a safe useLayoutEffect that works in both browser and SSR contexts
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Utility hook to manage client-side hydration status
 * Returns true when the component is fully hydrated on the client
 */
export function useHydration() {
    const [isHydrated, setIsHydrated] = useState(false);

    // Use useIsomorphicLayoutEffect to detect hydration as early as possible
    useIsomorphicLayoutEffect(() => {
        setIsHydrated(true);
    }, []);

    return isHydrated;
}

/**
 * Component that only renders its children when the app is fully hydrated on the client
 */
export function ClientOnly({
    children,
    fallback = null,
    onHydrated = null,
}: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onHydrated?: (() => void) | null;
}) {
    const isHydrated = useHydration();

    useEffect(() => {
        if (isHydrated && onHydrated) {
            onHydrated();
        }
    }, [isHydrated, onHydrated]);

    if (!isHydrated) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Wraps a component with hydration detection logic
 */
export function withHydration<P extends object>(Component: React.ComponentType<P>, fallback?: React.ReactNode) {
    return function WithHydration(props: P) {
        return (
            <ClientOnly fallback={fallback}>
                <Component {...props} />
            </ClientOnly>
        );
    };
}
