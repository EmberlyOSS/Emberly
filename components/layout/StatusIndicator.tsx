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
                if (mounted) setStatus(j)
            } catch (e) {
                // ignore
            } finally {
                if (mounted) setLoading(false)
            }
        }
        fetchStatus()
        return () => {
            mounted = false
        }
    }, [])

    if (loading) return <div className="text-xs text-muted-foreground">Status: …</div>

    const page = status?.page
    const incidents = status?.activeIncidents?.length || 0

    const mapColor = (s?: string) => {
        switch (s) {
            case 'UP':
                return 'bg-emerald-500'
            case 'HASISSUES':
                return 'bg-yellow-400'
            case 'UNDERMAINTENANCE':
                return 'bg-amber-500'
            default:
                return 'bg-gray-400'
        }
    }

    return (
        <div className="flex items-center gap-3">
            <a href={page?.url || '/status'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${mapColor(page?.status)}`} />
                <span className="text-sm">
                    {page?.status === 'UP' ? 'All systems operational' : page?.status === 'HASISSUES' ? `Issues (${incidents})` : 'Maintenance'}
                </span>
            </a>
        </div>
    )
}
