"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/packages/components/ui/button'
import { useToast } from '@/packages/hooks/use-toast'
import UploadsSection from './UploadsSection'
import StorageMetrics from './StorageMetrics'
import TopItems from './TopItems'
import TopUsers from './TopUsers'
import SummaryCards from './SummaryCards'
import RecentUploads from './RecentUploads'
import TopFilesCard from './TopFilesCard'
import TopUrlsCard from './TopUrlsCard'
import LargestFilesCard from './LargestFilesCard'

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
                const res = await fetch('/api/analytics/overview')
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
            <SummaryCards basic={basic} />

            <UploadsSection />

            <div>
                <TopItems allowed={data.allowed} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RecentUploads recentUploads={data.recentUploads} onRefresh={() => { setLoading(true); fetch('/api/analytics/overview').then(r => r.json()).then(j => { setData(j); setLoading(false) }).catch(() => setLoading(false)) }} plan={data.plan} onExport={handleExport} />

                <TopFilesCard topFiles={data.topFiles} allowed={data.allowed?.topFiles} />
            </div>

            <div className="mt-4">
                <TopUsers />
            </div>

            {data.topUrls && (
                <TopUrlsCard topUrls={data.topUrls} allowed={data.allowed?.topUrls} />
            )}

            {data.topStorageFiles && (
                <LargestFilesCard files={data.topStorageFiles} />
            )}

        </div>
    )
}
