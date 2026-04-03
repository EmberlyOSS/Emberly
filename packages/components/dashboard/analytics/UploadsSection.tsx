"use client"

import React from 'react'
import DownloadsChart from './DownloadsChart'
import StorageMetrics from './StorageMetrics'

export default function UploadsSection() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="col-span-2">
                <div className="rounded-md border border-border/30 bg-secondary/50 p-4">
                    <h3 className="text-base font-medium">Uploads (recent)</h3>
                    <p className="text-sm text-muted-foreground">Uploads per day</p>
                    <div className="mt-3">
                        <DownloadsChart />
                    </div>
                </div>
            </div>

            <div>
                <div className="rounded-md border border-border/30 bg-secondary/50 p-4">
                    <h3 className="text-base font-medium">Storage</h3>
                    <p className="text-sm text-muted-foreground">Current usage and breakdown</p>
                    <div className="mt-3">
                        <StorageMetrics />
                    </div>
                </div>
            </div>
        </div>
    )
}
