'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const TABS = [
    { name: 'Account', href: '/dashboard' },
    { name: 'Subscription', href: '/dashboard/subscriptions' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname ?? '/dashboard')}`);
        }
    }, [status, router, pathname]);

    if (status !== 'authenticated') {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
            <header className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Your account</h1>
                <nav
                    className="mt-6 flex items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-white/[0.08]"
                    aria-label="Account"
                >
                    {TABS.map((tab) => {
                        const active = pathname === tab.href;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                aria-current={active ? 'page' : undefined}
                                className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors ${
                                    active
                                        ? 'border-orange-500 font-medium text-white'
                                        : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                            >
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </header>
            {children}
        </div>
    );
}
