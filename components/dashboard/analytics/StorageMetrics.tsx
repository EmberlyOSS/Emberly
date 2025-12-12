'use client'

import { useEffect, useState } from 'react'

function Sparkline({ points }: { points: number[] }) {
    if (!points || points.length === 0) return null
    const w = 200
    const h = 48
    const max = Math.max(...points)
    const min = Math.min(...points)
    const range = Math.max(1, max - min)
    const step = w / Math.max(1, points.length - 1)
    const coords = points.map((p, i) => {
        const x = i * step
        const y = h - ((p - min) / range) * h
        return `${x},${y}`
    }).join(' ')
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
            <polyline fill="none" stroke="#60A5FA" strokeWidth={2} points={coords} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function StorageMetrics() {
    const [data, setData] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                const res = await fetch('/api/analytics/storage')
                if (!res.ok) throw new Error('Failed')
                const j = await res.json()
                if (!mounted) return
                setData(j)
            } catch (err) {
                console.error(err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    if (loading) return <div className="p-4">Loading storage metrics…</div>
    if (!data) return <div className="p-4 text-destructive">Failed to load storage metrics.</div>

    const latestBytes = data.totalBytes ?? 0
    const snapshots = (data.daily || []).map((s: any) => s.bytes)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-muted-foreground">Storage used</div>
                    <div className="text-2xl font-semibold">{(latestBytes / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <div className="w-48">
                    <Sparkline points={snapshots} />
                </div>
            </div>

            <div>
                <div className="text-sm text-muted-foreground mb-2">Top file types</div>
                <div className="space-y-2">
                    {(data.breakdown || []).map((b: any) => (
                        <div key={b.mimeType} className="flex items-center justify-between text-sm">
                            <div className="truncate max-w-[70%]">{b.mimeType}</div>
                            <div className="text-xs text-muted-foreground">{(b.bytes / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default StorageMetrics
