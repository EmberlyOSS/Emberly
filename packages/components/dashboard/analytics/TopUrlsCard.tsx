"use client"

import React from 'react'

export default function TopUrlsCard({ topUrls, allowed }: { topUrls?: any[]; allowed?: boolean }) {
    return (
        <div className="relative rounded-md border border-white/6 bg-secondary/50 p-4">
            <div>
                <h3 className="text-base font-medium">Top short links</h3>
                <p className="text-sm text-muted-foreground">Most clicked short links</p>
            </div>
            {allowed ? (
                <div className="mt-3 space-y-2">
                    {(topUrls || []).map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between text-sm">
                            <div className="truncate max-w-[70%]">{u.shortCode} → {u.targetUrl}</div>
                            <div className="text-xs text-muted-foreground">{u.clicks} clicks</div>
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
