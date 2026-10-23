'use client';

import Link from 'next/link';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { companyInfo } from '@/constants/navigation';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 10);
        return {
            hasError: true,
            error,
            errorId: `ERR-${timestamp}-${randomPart}`,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: '',
        });
    };

    public render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="w-full max-w-lg p-8 rounded-xl border border-white/[0.08] bg-[#1c1917]">
                        <div className="mb-6">
                            <span className="text-xs font-medium tracking-widest uppercase text-red-500">Error</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-3">Something went wrong</h2>
                        <p className="text-sm text-[#a8a29e] mb-4">
                            This component encountered an unexpected error. You can try reloading it or return to the homepage.
                        </p>
                        <div className="mb-6 px-3 py-2 rounded-lg bg-black border border-white/[0.06]">
                            <p className="text-xs text-[#78716c]">
                                Error ID:{' '}
                                <code className="font-mono text-[#a8a29e]">{this.state.errorId}</code>
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-semibold hover:bg-[#EA580C] transition-colors"
                            >
                                Try again
                            </button>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.15] text-white text-sm font-medium hover:bg-white/[0.06] transition-colors"
                            >
                                Go home
                            </Link>
                            <a
                                href={companyInfo.contact.socialMedia.discord}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.15] text-white text-sm font-medium hover:bg-white/[0.06] transition-colors"
                            >
                                Report on Discord
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
