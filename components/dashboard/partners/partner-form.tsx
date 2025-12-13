'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'

type Props = {
    partner?: any
    onSaved?: (p: any) => void
    onCancel?: () => void
}

export default function PartnerForm({ partner, onSaved, onCancel }: Props) {
    const [form, setForm] = useState({
        name: partner?.name || '',
        tagline: partner?.tagline || '',
        url: partner?.url || '',
        imagePath: partner?.imagePath || '',
        active: partner?.active ?? true,
    })
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const method = partner?.id ? 'PUT' : 'POST'
            const url = partner?.id ? `/api/partners/${partner.id}` : '/api/partners'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const json = await res.json()
            if (res.ok) {
                onSaved?.(json)
            } else {
                alert(json?.error || 'Failed')
            }
        } catch (err) {
            alert('Request failed')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="imagePath">Image path</Label>
                <Input id="imagePath" value={form.imagePath} onChange={(e) => setForm({ ...form, imagePath: e.target.value })} />
            </div>

            <DialogFooter>
                <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={loading}>{partner ? 'Save' : 'Create'}</Button>
                </div>
            </DialogFooter>
        </form>
    )
}
