"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

function GatedOverlay({ required }: { required: string }) {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
            <div className="w-full h-full rounded-xl bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <div className="text-sm font-semibold uppercase">UPGRADE TO {required} NOW</div>
                <Button asChild size="sm" variant="default">
                    <a href="/pricing">Upgrade</a>
                </Button>
            </div>
        </div>
    )
}

function Sparkline({ points }: { points: number[] }) {
    if (!points || points.length === 0) return null
    const w = 160
    const h = 40
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

export default function AnalyticsOverview() {
    const [data, setData] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                const res = await fetch('/api/analytics/summary')
                if (!res.ok) throw new Error('Failed')
                const j = await res.json()
                if (mounted) setData(j)
            } catch (e) {
                // ignore
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [])

    if (loading) return <div>Loading analytics…</div>

    if (!data) return <div>Could not load analytics.</div>

    const basic = data.basic || {}
    const uploadsSeries = (data.uploadsPerDay || []).map((d: any) => d.count)

    const handleExport = async () => {
        try {
            const res = await fetch('/api/analytics/export')
            if (res.status === 403) {
                toast({ title: 'Upgrade required', description: 'CSV export is available for Pro users', variant: 'destructive' })
                return
            }
            if (!res.ok) throw new Error('Export failed')
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `analytics-files.csv`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast({ title: 'Export ready', description: 'CSV downloaded' })
        } catch (e) {
            toast({ title: 'Export failed', description: 'Could not export analytics', variant: 'destructive' })
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Files</CardTitle>
                        <CardDescription>Overview of your uploaded files</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">{basic.totalFiles ?? 0}</div>
                        <div className="text-xs text-muted-foreground">Storage: {(basic.storageUsed / 1024 / 1024).toFixed(2)} MB</div>
                        <div className="text-xs text-muted-foreground">Views: {basic.totalViews ?? 0} • Downloads: {basic.totalDownloads ?? 0}</div>
                        <div className="mt-2"><Sparkline points={uploadsSeries} /></div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Short URLs</CardTitle>
                        <CardDescription>Track your link clicks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">{basic.totalUrls ?? 0}</div>
                        <div className="text-xs text-muted-foreground">Clicks: {basic.totalUrlClicks ?? 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Domains</CardTitle>
                        <CardDescription>Custom domains attached to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">{basic.domainsCount ?? 0}</div>
                        <div className="text-xs text-muted-foreground">Verified: {basic.verifiedDomains ?? 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent uploads</CardTitle>
                        <CardDescription>Latest files uploaded to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mt-3 space-y-2">
                            {(data.recentUploads || []).map((f: any) => (
                                <div key={f.id} className="flex items-center justify-between text-sm">
                                    <div className="truncate max-w-[60%]">{f.name}</div>
                                    <div className="text-xs text-muted-foreground">{Math.round(f.size)} bytes • {new Date(f.uploadedAt).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" onClick={() => { setLoading(true); fetch('/api/analytics/summary').then(r => r.json()).then(j => { setData(j); setLoading(false) }).catch(() => setLoading(false)) }}>Refresh</Button>
                            {data.plan === 'pro' ? (
                                <Button size="sm" onClick={handleExport}>Export CSV</Button>
                            ) : (
                                <Button variant="outline" size="sm" asChild>
                                    <a href="/pricing">Upgrade</a>
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>

                <Card className="relative">
                    <CardHeader>
                        <CardTitle>Top files</CardTitle>
                        <CardDescription>Your most viewed files</CardDescription>
                    </CardHeader>
                    {!data.allowed?.topFiles && (
                        <GatedOverlay required="STARTER" />
                    )}
                    <CardContent>
                        <div className="mt-3 space-y-2">
                            {(data.topFiles || []).map((f: any) => (
                                <div key={f.id} className="flex items-center justify-between text-sm">
                                    <div className="truncate max-w-[60%]">{f.name}</div>
                                    <div className="text-xs text-muted-foreground">{f.views} views</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {data.topUrls && (
                <Card className="relative">
                    <CardHeader>
                        <CardTitle>Top short links</CardTitle>
                        <CardDescription>Most clicked short links</CardDescription>
                    </CardHeader>
                    {!data.allowed?.topUrls && (
                        <GatedOverlay required="STARTER" />
                    )}
                    <CardContent>
                        <div className="mt-3 space-y-2">
                            {(data.topUrls || []).map((u: any) => (
                                <div key={u.id} className="flex items-center justify-between text-sm">
                                    <div className="truncate max-w-[70%]">{u.shortCode} → {u.targetUrl}</div>
                                    <div className="text-xs text-muted-foreground">{u.clicks} clicks</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {data.topStorageFiles && (
                <Card>
                    <CardHeader>
                        <CardTitle>Largest files</CardTitle>
                        <CardDescription>Top files by storage used</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mt-3 space-y-2">
                            {(data.topStorageFiles || []).map((f: any) => (
                                <div key={f.id} className="flex items-center justify-between text-sm">
                                    <div className="truncate max-w-[60%]">{f.name}</div>
                                    <div className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    )
}
