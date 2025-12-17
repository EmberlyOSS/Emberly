"use client"

import React from 'react'

export default function TopFilesCard({ topFiles, allowed }: { topFiles?: any[]; allowed?: boolean }) {
    return (
        <div className="relative rounded-md border border-white/6 bg-secondary/50 p-4">
            <div>
                <h3 className="text-base font-medium">Top files</h3>
                <p className="text-sm text-muted-foreground">Your most viewed files</p>
            </div>
            {allowed ? (
                <div className="mt-3 space-y-2">
                    {(topFiles || []).map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between text-sm">
                            <div className="truncate max-w-[60%]">{f.name}</div>
                            <div className="text-xs text-muted-foreground">{f.views} views</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-36 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-sm font-semibold uppercase mb-2">Upgrade to STARTER to view</div>
                        <a href="/pricing" className="inline-block rounded bg-primary px-3 py-1 text-sm">Upgrade</a>
                    </div>
                </div>
            )}
        </div>
    )
}
