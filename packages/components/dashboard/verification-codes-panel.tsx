"use client"

import { useEffect, useState } from "react"

import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/packages/components/ui/card'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { useToast } from '@/packages/hooks/use-toast'

export function VerificationCodesPanel() {
    const { toast } = useToast()
    const [codes, setCodes] = useState<string[]>([])
    const [newCode, setNewCode] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/verification-codes', { credentials: 'include' })
            if (!res.ok) throw new Error('Unable to load codes')
            const data = await res.json()
            setCodes(Array.isArray(data.codes) ? data.codes : [])
        } catch (error) {
            console.error(error)
            toast({ title: 'Error', description: 'Failed to load verification codes', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
    }, [])

    const addCode = async () => {
        if (!newCode.trim()) {
            toast({ title: 'Add a code', description: 'Enter a code to save', variant: 'destructive' })
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/auth/verification-codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code: newCode.trim() }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                throw new Error(data?.error || 'Unable to save code')
            }
            setNewCode('')
            await load()
            toast({ title: 'Saved', description: 'Verification code added' })
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to add code',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    const removeCode = async (code: string) => {
        setSaving(true)
        try {
            const res = await fetch('/api/auth/verification-codes', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                throw new Error(data?.error || 'Unable to remove code')
            }
            setCodes((prev) => prev.filter((c) => c !== code))
            toast({ title: 'Removed', description: 'Verification code deleted' })
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to delete code',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    const copyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code)
            toast({ title: 'Copied', description: 'Code copied to clipboard' })
        } catch {
            toast({ title: 'Copy failed', description: 'Unable to copy code', variant: 'destructive' })
        }
    }

    return (
        <Card className="relative overflow-hidden bg-white/5 dark:bg-black/5 backdrop-blur-xl border-white/10 dark:border-white/5 shadow-lg shadow-black/5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10 pointer-events-none" />
            <CardHeader className="relative">
                <CardTitle className="text-xl font-semibold">Verification codes</CardTitle>
                <CardDescription>Store and manage codes for actions that need an extra check.</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="new-code" className="text-sm font-medium">Add a code</Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            id="new-code"
                            placeholder="Enter a verification code"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value)}
                            disabled={saving}
                            className="h-11 bg-white/5 dark:bg-black/5 border-white/10 dark:border-white/5 focus:border-primary/50 focus:ring-primary/20"
                        />
                        <Button onClick={addCode} disabled={saving} className="sm:w-auto h-11 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all">
                            {saving ? (
                                <>
                                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                    Saving
                                </>
                            ) : (
                                'Save code'
                            )}
                        </Button>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">Saved codes</p>
                        {loading && <Icons.spinner className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    {codes.length === 0 && !loading ? (
                        <p className="text-sm text-muted-foreground">No verification codes yet.</p>
                    ) : null}
                    <div className="grid gap-2">
                        {codes.map((code) => (
                            <div key={code} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3">
                                <div className="flex-1 truncate text-sm font-medium">{code}</div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-9" onClick={() => copyCode(code)}>
                                        <Icons.copy className="h-4 w-4 mr-1" /> Copy
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-9 text-destructive hover:bg-destructive/10" onClick={() => removeCode(code)}>
                                        <Icons.trash className="h-4 w-4 mr-1" /> Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
