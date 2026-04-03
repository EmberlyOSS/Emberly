"use client"

import React from 'react'

export default function SummaryCards({ basic }: { basic: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-md border border-border/30 bg-secondary/50 p-4">
                <div>
                    <h3 className="text-base font-medium">Files</h3>
                    <p className="text-sm text-muted-foreground">Overview of your uploaded files</p>
                </div>
                <div className="mt-4">
                    <div className="text-2xl font-semibold">{basic.totalFiles ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Storage: {((basic.storageUsed ?? 0) / 1024 / 1024).toFixed(2)} MB</div>
                    <div className="text-xs text-muted-foreground">Views: {basic.totalViews ?? 0} • Downloads: {basic.totalDownloads ?? 0}</div>
                </div>
            </div>

            <div className="rounded-md border border-border/30 bg-secondary/50 p-4">
                <div>
                    <h3 className="text-base font-medium">Short URLs</h3>
                    <p className="text-sm text-muted-foreground">Track your link clicks</p>
                </div>
                <div className="mt-4">
                    <div className="text-2xl font-semibold">{basic.totalUrls ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Clicks: {basic.totalUrlClicks ?? 0}</div>
                </div>
            </div>

            <div className="rounded-md border border-border/30 bg-secondary/50 p-4">
                <div>
                    <h3 className="text-base font-medium">Domains</h3>
                    <p className="text-sm text-muted-foreground">Custom domains attached to your account</p>
                </div>
                <div className="mt-4">
                    <div className="text-2xl font-semibold">{basic.domainsCount ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Verified: {basic.verifiedDomains ?? 0}</div>
                </div>
            </div>
        </div>
    )
}
