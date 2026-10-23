'use client';

import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import LoadingProvider from '@/components/providers/LoadingProvider';
import { SiteConfigProvider } from '@/components/providers/SiteConfigProvider';
import Footer from './static/Footer';
import Navbar from './static/Navbar';
import AmbientBackground from './ui/AmbientBackground';

function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    if (pathname?.startsWith('/admin')) {
        return <>{children}</>;
    }

    return (
        <div className="relative flex min-h-screen flex-col">
            <AmbientBackground />
            <a
                href="#content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-white focus:px-3 focus:py-1.5 focus:text-sm focus:text-black"
            >
                Skip to content
            </a>
            <Navbar />
            <main id="content" className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <SiteConfigProvider>
                <LoadingProvider>
                    <LayoutShell>{children}</LayoutShell>
                    <Toaster
                        theme="dark"
                        position="top-center"
                        toastOptions={{
                            classNames: {
                                toast: 'bg-zinc-900 border border-white/[0.12] text-white',
                                error: 'bg-red-950 border-red-900/40 text-red-300',
                                description: 'text-zinc-400',
                            },
                        }}
                    />
                </LoadingProvider>
            </SiteConfigProvider>
        </SessionProvider>
    );
}
