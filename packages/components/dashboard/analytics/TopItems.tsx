"use client"

import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

function GatedOverlay({ required }: { required: string }) {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
            <div className="w-full h-full rounded-xl bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <div className="text-sm font-semibold uppercase">Upgrade to {required} to view</div>
                <a href="/pricing" className="inline-block rounded bg-primary px-3 py-1 text-sm">Upgrade</a>
            </div>
        </div>
    )
}

export default function TopItems({ allowed }: { allowed?: { topFiles?: boolean; topUrls?: boolean } }) {
    const [data, setData] = useState<any | null>(null)
    useEffect(() => {
        let mounted = true
        fetch('/api/analytics/top-items').then((r) => r.json()).then((j) => { if (mounted) setData(j) }).catch(() => { })
        return () => { mounted = false }
    }, [])

    if (!data) return <div>Loading top items…</div>

    const files = data.topFiles || []
    const urls = data.topUrls || []
    const filePie = files.map((f: any, i: number) => ({ name: f.name || f.id, value: Math.max(1, f.downloads || 0) }))
    const urlBar = urls.map((u: any) => ({ name: u.shortCode, clicks: u.clicks || 0 }))

    const COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6']

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative rounded-md border border-white/6 bg-secondary/50 p-4">
                <h4 className="text-sm font-medium">Top files (by downloads)</h4>
                {!allowed?.topFiles ? (
                    <div className="h-48 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-sm font-semibold uppercase mb-3">Upgrade to STARTER to view</div>
                                <a href="/pricing" className="inline-block rounded bg-primary px-3 py-1 text-sm">Upgrade</a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={filePie} dataKey="value" nameKey="name" innerRadius={30} outerRadius={60} fill="#8884d8">
                                    {filePie.map((_, i) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="relative rounded-md border border-white/6 bg-secondary/50 p-4">
                <h4 className="text-sm font-medium">Top links (by clicks)</h4>
                {!allowed?.topUrls ? (
                    <div className="h-48 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-sm font-semibold uppercase mb-3">Upgrade to STARTER to view</div>
                                <a href="/pricing" className="inline-block rounded bg-primary px-3 py-1 text-sm">Upgrade</a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={urlBar}>
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="clicks" fill="#60A5FA" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}
