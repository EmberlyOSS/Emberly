'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/packages/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/packages/components/ui/card'

export function ProfileDataExplorer() {
    const [data, setData] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                const res = await fetch('/api/profile')
                const payload = await res.json()
                const value = payload?.data ?? payload
                if (!mounted) return
                if (!res.ok) {
                    setError(payload?.error || 'Failed to load profile data')
                    setData(null)
                } else {
                    setData(value)
                }
            } catch (err: any) {
                if (!mounted) return
                setError(err?.message || 'Failed to load')
                setData(null)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    function downloadJson() {
        if (!data) return
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'profile-data.json'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle>Your data</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">This shows the data we store for your account. You can download a copy for your records.</p>

                <div className="mb-4">
                    <Button onClick={downloadJson} disabled={!data} variant="outline" className="shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all">Download JSON</Button>
                </div>

                {loading ? (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                ) : error ? (
                    <div className="text-sm text-destructive">{error}</div>
                ) : (
                    <pre className="rounded-xl bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20 p-4 overflow-auto text-sm max-h-96">{JSON.stringify(data, null, 2)}</pre>
                )}
            </CardContent>
        </Card>
    )
}

export default ProfileDataExplorer
