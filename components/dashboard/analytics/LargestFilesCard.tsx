"use client"

import React from 'react'

export default function LargestFilesCard({ files }: { files?: any[] }) {
    return (
        <div className="rounded-md border border-white/6 bg-secondary/50 p-4">
            <div>
                <h3 className="text-base font-medium">Largest files</h3>
                <p className="text-sm text-muted-foreground">Top files by storage used</p>
            </div>
            <div className="mt-3 space-y-2">
                {(files || []).map((f: any) => (
                    <div key={f.id} className="flex items-center justify-between text-sm">
                        <div className="truncate max-w-[60%]">{f.name}</div>
                        <div className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
