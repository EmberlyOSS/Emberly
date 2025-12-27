import React from 'react'
import { DynamicBackground } from '@/packages/components/layout/dynamic-background'
import { cn } from '@/packages/lib/utils'

interface HomeShellProps {
    children: React.ReactNode
    className?: string
    containerClassName?: string
}

export default function HomeShell({
    children,
    className,
    containerClassName
}: HomeShellProps) {
    return (
        <div className={cn(
            "relative flex flex-col flex-1 min-h-screen overflow-hidden",
            className
        )}>
            <DynamicBackground />

            <div className="flex-1 w-full pt-24 relative z-10">
                <div className={cn(
                    "max-w-7xl mx-auto py-6 px-4",
                    containerClassName
                )}>
                    {children}
                </div>
            </div>
        </div>
    )
}
