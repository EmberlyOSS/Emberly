'use client';

import { BrandLogo } from './BrandLogo';

interface GlobalLoaderProps {
    isVisible: boolean;
}

export default function GlobalLoader({ isVisible }: GlobalLoaderProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0908]">
            <div className="flex flex-col items-center gap-6">
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[#292524] border border-white/[0.08]">
                    <BrandLogo size={32} />
                </div>
                <div className="text-sm font-bold tracking-tight text-white">
                    Emberly
                </div>
                <div className="relative w-32 h-px overflow-hidden bg-white/[0.08] rounded-full">
                    <div className="absolute inset-y-0 left-0 w-8 rounded-full bg-white animate-[slide_1.2s_ease-in-out_infinite]" />
                </div>
            </div>
        </div>
    );
}
