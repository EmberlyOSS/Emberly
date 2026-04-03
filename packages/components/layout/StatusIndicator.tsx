"use client"

import React, { useEffect, useState } from 'react'

type StatusPage = {
    name: string
    url: string
    status: 'UP' | 'HASISSUES' | 'UNDERMAINTENANCE'
}

type Incident = {
    id: string
    name: string
    started?: string
    status?: string
    impact?: string
    url?: string
    updatedAt?: string
}

type StatusPayload = {
    page: StatusPage
    activeIncidents: Incident[]
    activeMaintenances: Incident[]
}

export default function StatusIndicator() {
    const [status, setStatus] = useState<StatusPayload | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        async function fetchStatus() {
            try {
                const res = await fetch('/api/status')
                const j = await res.json()
                // /api/status returns { data: StatusSummary, success: true }
                if (mounted) setStatus(j?.data ?? j)
            } catch {
                // ignore
            } finally {
                if (mounted) setLoading(false)
            }
        }
        fetchStatus()
        return () => { mounted = false }
    }, [])

    if (loading) return <div className="text-xs text-muted-foreground">Checking status…</div>
    if (!status) return null

    const page = status.page
    const incidents = status.activeIncidents?.length ?? 0
    const maintenances = status.activeMaintenances?.length ?? 0

    const mapColor = (s?: string) => {
        switch (s) {
            case 'UP': return 'bg-emerald-500'
            case 'HASISSUES': return 'bg-yellow-400'
            case 'UNDERMAINTENANCE': return 'bg-blue-400'
            case 'DOWN': return 'bg-red-500'
            case 'DEGRADED': return 'bg-yellow-500'
            default: return 'bg-gray-400'
        }
    }

    const mapLabel = (s?: string) => {
        switch (s) {
            case 'UP': return 'All systems operational'
            case 'HASISSUES': return `System issues (${incidents})`
            case 'UNDERMAINTENANCE': return `Maintenance (${maintenances})`
            case 'DOWN': return 'Major outage'
            case 'DEGRADED': return 'Degraded performance'
            default: return 'Status unknown'
        }
    }

    return (
        <div className="flex items-center gap-3">
            <a href={page?.url || '/status'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${mapColor(page?.status)}${page?.status === 'UP' ? '' : ' animate-pulse'}`} />
                <span className="text-sm">{mapLabel(page?.status)}</span>
            </a>
        </div>
    )
}
