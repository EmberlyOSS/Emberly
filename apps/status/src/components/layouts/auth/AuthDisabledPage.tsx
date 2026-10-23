'use client';

import Link from 'next/link';
import { companyInfo } from '@/constants/navigation';

interface AuthDisabledPageProps {
    title?: string;
    message?: string;
    showContactInfo?: boolean;
}

export default function AuthDisabledPage({
    title = 'Authentication Unavailable',
    message = 'The authentication system is currently unavailable. This may be due to maintenance or configuration issues.',
    showContactInfo = true,
}: AuthDisabledPageProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black px-6">
            <div className="w-full max-w-md">
                <div className="border border-white/[0.08] bg-[#1c1917] rounded-xl p-8">
                    <div className="w-10 h-10 rounded-lg border border-white/[0.12] flex items-center justify-center mb-6">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#a8a29e]">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>

                    <p className="text-xs font-medium tracking-widest uppercase text-[#78716c] mb-3">System Status</p>
                    <h1 className="text-2xl font-semibold text-white mb-3">{title}</h1>
                    <p className="text-[#a8a29e] text-sm leading-relaxed mb-8">{message}</p>

                    <div className="flex flex-col sm:flex-row gap-3 mb-8">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#F97316] text-white rounded-lg hover:bg-[#EA580C] transition-colors"
                        >
                            Try again
                        </button>
                        <Link
                            href="/"
                            className="flex-1 px-4 py-2.5 text-sm font-medium border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors text-center"
                        >
                            Go home
                        </Link>
                    </div>

                    {showContactInfo && (
                        <div className="border-t border-white/[0.06] pt-6">
                            <p className="text-xs text-[#78716c] mb-3">Need help? Reach out to us:</p>
                            <div className="flex flex-col gap-2">
                                <a
                                    href={companyInfo.contact.socialMedia.discord}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-[#a8a29e] hover:text-white transition-colors"
                                >
                                    Join our Discord
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-[#78716c] mt-4">
                    You can still browse{' '}
                    <Link href="/incidents" className="text-[#a8a29e] hover:text-white transition-colors">incidents</Link>
                    {' '}and{' '}
                    <Link href="/maintenances" className="text-[#a8a29e] hover:text-white transition-colors">maintenance</Link>
                    {' '}while we resolve this.
                </p>
            </div>
        </div>
    );
}