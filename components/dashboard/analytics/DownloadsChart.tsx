'use client'

import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export function DownloadsChart() {
    const [data, setData] = useState<Array<{ date: string; count: number }>>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                const res = await fetch('/api/analytics/overview')
                if (!res.ok) throw new Error('Failed to load')
                const j = await res.json()
                if (!mounted) return
                // prefer `uploadsPerDay` but fall back to `daily` for older responses
                setData(j.uploadsPerDay || j.daily || [])
            } catch (err) {
                console.error(err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    if (loading) return <div className="p-4">Loading chart…</div>
    if (!data || data.length === 0) return <div className="p-4 text-muted-foreground">No chart data available</div>

    return (
        <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.06} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#60A5FA" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export default DownloadsChart
