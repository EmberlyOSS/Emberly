"use client"

import React, { useEffect, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

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

export default function TopUsers() {
    const [data, setData] = useState<any | null>(null)
    const [forbidden, setForbidden] = useState(false)
    const [mode, setMode] = useState<'total' | 'per-file'>('total')

    useEffect(() => {
        let mounted = true
        fetch('/api/analytics/top-users').then(async (r) => {
            if (r.status === 403) {
                if (mounted) setForbidden(true)
                return
            }
            const j = await r.json()
            if (mounted) setData(j)
        }).catch(() => { })
        return () => { mounted = false }
    }, [])

    if (forbidden) return (
        <div className="relative rounded-md border border-white/6 bg-secondary/50 p-4">
            <h4 className="text-sm font-medium">Top users</h4>
            <GatedOverlay required="ADMIN" />
        </div>
    )

    if (!data) return <div>Loading top users…</div>

    // admin returns topUsers, non-admins receive { me, rank, totalUsers }
    // always render scoring card (admins see full list below)
    const me = data.me
    const rank = data.rank
    const total = data.totalUsers
    const pct = total > 0 ? Math.round(((total - rank + 1) / total) * 100) : 0

    const scoringExplanation = (
        <div className="mt-3 text-sm text-muted-foreground">
            Primary = <strong>downloads + clicks</strong>. Ranking lightly weights file count.
            <br />Avg per file = primary / files. Toggle between total and per-file metrics.
        </div>
    )

    const scoringCard = (
        <div className="rounded-md border border-white/6 bg-secondary/50 p-4">
            <div className="flex items-start justify-between">
                <h4 className="text-sm font-medium">Your score</h4>
                <div className="flex gap-2 items-center">
                    <button className={`text-xs px-2 py-1 rounded ${mode === 'total' ? 'bg-primary text-white' : 'bg-transparent'}`} onClick={() => setMode('total')}>Total</button>
                    <button className={`text-xs px-2 py-1 rounded ${mode === 'per-file' ? 'bg-primary text-white' : 'bg-transparent'}`} onClick={() => setMode('per-file')}>Per file</button>
                </div>
            </div>

            <div className="mt-3">
                <div className="text-sm text-muted-foreground">Rank</div>
                <div className="text-2xl font-semibold">{rank} / {total}</div>
                <div className="w-full bg-muted h-2 rounded mt-2">
                    <div className="h-2 rounded bg-green-400" style={{ width: `${pct}%` }} />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                    <div className="text-sm text-muted-foreground">Downloads</div>
                    <div className="text-lg font-semibold">{me.downloads}</div>
                </div>
                <div>
                    <div className="text-sm text-muted-foreground">Clicks</div>
                    <div className="text-lg font-semibold">{me.clicks}</div>
                </div>

                <div className="mt-3">
                    <div className="text-sm text-muted-foreground">Files</div>
                    <div className="text-lg font-semibold">{me.filesCount}</div>
                </div>

                <div className="mt-3">
                    <div className="text-sm text-muted-foreground">{mode === 'total' ? 'Primary (downloads+clicks)' : 'Avg score per file'}</div>
                    <div className="text-2xl font-semibold">{mode === 'total' ? me.primaryScore : Number(me.avgPerFile).toFixed(2)}</div>
                </div>
            </div>

            {scoringExplanation}

            {data.distribution && (
                <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-2">How you compare (percentiles)</div>
                    <div className="flex gap-2 items-end h-20">
                        {data.distribution.buckets.map((b: any, i: number) => {
                            const maxCount = Math.max(...data.distribution.buckets.map((bb: any) => bb.count), 1)
                            const heightPct = Math.round((b.count / maxCount) * 100)
                            const isMine = data.distribution.userBucketIndex === i
                            return (
                                <div key={b.label} className="flex-1 flex flex-col items-center">
                                    <div className={`w-full ${isMine ? 'bg-green-400' : 'bg-muted'} rounded-b`} style={{ height: `${heightPct}%`, width: '100%' }} />
                                    <div className="text-xs text-muted-foreground mt-1">{b.label}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )

    // if admin, also show the full chart/list below
    if (data.topUsers) {
        const items = data.topUsers || []
        const chartData = items.map((it: any) => ({ name: it.user.name || it.user.email || it.user.id, value: mode === 'total' ? it.primaryScore : it.avgPerFile }))
        return (
            <div className="space-y-4">
                {scoringCard}
                <div className="rounded-md border border-white/6 bg-secondary/50 p-4">
                    <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium">Top users</h4>
                        <div className="text-sm text-muted-foreground">Showing top {items.length}</div>
                    </div>
                    <div className="h-56 mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical">
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={180} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#34D399" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )
    }

    // non-admin: return the scoring card we built above
    return scoringCard
}
