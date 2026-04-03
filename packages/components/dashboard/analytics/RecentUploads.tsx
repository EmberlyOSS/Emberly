"use client"

import React from 'react'
import { Button } from '@/packages/components/ui/button'

export default function RecentUploads({ recentUploads, onRefresh, plan, onExport }: { recentUploads?: any[]; onRefresh: () => void; plan?: string; onExport: () => void }) {
    return (
        <div className="rounded-md border border-border/30 bg-secondary/50 p-4">
            <div>
                <h3 className="text-base font-medium">Recent uploads</h3>
                <p className="text-sm text-muted-foreground">Latest files uploaded to your account</p>
            </div>
            <div className="mt-3 space-y-2">
                {(recentUploads || []).map((f: any) => (
                    <div key={f.id} className="flex items-center justify-between text-sm">
                        <div className="truncate max-w-[60%]">{f.name}</div>
                        <div className="text-xs text-muted-foreground">{Math.round(f.size)} bytes • {new Date(f.uploadedAt).toLocaleDateString()}</div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end mt-3 gap-2">
                <Button variant="secondary" size="sm" onClick={onRefresh}>Refresh</Button>
                {plan === 'pro' ? (
                    <Button size="sm" onClick={onExport}>Export CSV</Button>
                ) : (
                    <Button variant="outline" size="sm" asChild>
                        <a href="/pricing">Upgrade</a>
                    </Button>
                )}
            </div>
        </div>
    )
}
