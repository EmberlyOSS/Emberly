'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const [errorId, setErrorId] = useState('');

    useEffect(() => {
        console.error('[Error boundary]', error);
        setErrorId(error.digest ?? `ERR-${Date.now().toString(36).toUpperCase()}`);
    }, [error]);

    return (
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
            <div className="w-full max-w-sm text-center">
                <p className="text-xs font-medium tracking-widest uppercase text-zinc-400 mb-4">Error 500</p>
                <h1 className="text-3xl font-semibold text-white mb-3">Something went wrong</h1>
                <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                    An unexpected error occurred. Please try again, or contact support if the problem persists.
                </p>

                {errorId && <p className="text-xs text-zinc-500 font-mono mb-8">Error ID: {errorId}</p>}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        type="button"
                        onClick={reset}
                        className="px-5 py-2.5 text-sm font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="px-5 py-2.5 text-sm font-medium border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                    >
                        Go home
                    </Link>
                </div>

                <p className="mt-8 text-xs text-zinc-500">
                    Need help?{' '}
                    <a
                        href="https://discord.gg/36spBmzZVB"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-zinc-400 transition-colors underline underline-offset-4"
                    >
                        Contact support
                    </a>
                </p>
            </div>
        </div>
    );
}
