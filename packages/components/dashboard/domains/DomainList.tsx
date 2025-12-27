'use client'

import React from 'react'
import { Globe } from 'lucide-react'
import DomainRow from './DomainRow'
import { Domain } from './types'

interface Props {
    domains: Domain[]
    cfCheckingIds: string[]
    onSetPrimary: (id: string) => void
    onRecheck: (id: string) => void
    onDelete: (id: string) => Promise<void>
}

export default function DomainList({
    domains,
    cfCheckingIds,
    onSetPrimary,
    onRecheck,
    onDelete,
}: Props) {
    if (domains.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center mb-4">
                    <Globe className="h-8 w-8 text-primary/60" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No domains yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                    Add a custom domain to serve your files from your own branded URL.
                </p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-border/50">
            {domains.map((d) => (
                <DomainRow
                    key={d.id}
                    d={d}
                    rechecking={cfCheckingIds.includes(d.id)}
                    onSetPrimary={onSetPrimary}
                    onRecheck={onRecheck}
                    onDelete={onDelete}
                />
            ))}
        </div>
    )
}
