import React from 'react'
import { DynamicBackground } from '@/packages/components/layout/dynamic-background'

export default function HomeShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex flex-col flex-1 min-h-screen overflow-hidden">
            <DynamicBackground />

            <div className="flex-1 w-full pt-24 relative z-10">
                <div className="max-w-7xl mx-auto py-6 px-4">{children}</div>
            </div>
        </div>
    )
}
