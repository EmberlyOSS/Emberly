'use client'

import { useState } from 'react'
import { Globe, Image as ImageIcon, Tag, Type } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Switch } from '@/packages/components/ui/switch'
import { DialogFooter } from '@/packages/components/ui/dialog'
import { useToast } from '@/packages/hooks/use-toast'

type Props = {
    partner?: any
    onSaved?: (p: any) => void
    onCancel?: () => void
}

export default function PartnerForm({ partner, onSaved, onCancel }: Props) {
    const { toast } = useToast()
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
                toast({
                    title: partner?.id ? 'Partner updated' : 'Partner created',
                    description: `Successfully ${partner?.id ? 'updated' : 'created'} ${form.name}`,
                })
                onSaved?.(json)
            } else {
                toast({
                    title: 'Error',
                    description: json?.error || 'Failed to save partner',
                    variant: 'destructive',
                })
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Request failed. Please try again.',
                variant: 'destructive',
            })
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                        <Type className="h-4 w-4 text-muted-foreground" />
                        Name
                    </Label>
                    <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        placeholder="Partner name"
                        className="bg-background/50 border-border/50 focus:border-primary/50"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="tagline" className="flex items-center gap-2 text-sm font-medium">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        Tagline
                    </Label>
                    <Input
                        id="tagline"
                        value={form.tagline}
                        onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                        placeholder="Brief description"
                        className="bg-background/50 border-border/50 focus:border-primary/50"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="url" className="flex items-center gap-2 text-sm font-medium">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        Website URL
                    </Label>
                    <Input
                        id="url"
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                        placeholder="https://example.com"
                        className="bg-background/50 border-border/50 focus:border-primary/50"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="imagePath" className="flex items-center gap-2 text-sm font-medium">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        Logo Image Path
                    </Label>
                    <Input
                        id="imagePath"
                        value={form.imagePath}
                        onChange={(e) => setForm({ ...form, imagePath: e.target.value })}
                        placeholder="/partners/logo.png"
                        className="bg-background/50 border-border/50 focus:border-primary/50"
                    />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/80 p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="active" className="text-sm font-medium">Active Status</Label>
                        <p className="text-xs text-muted-foreground">Show this partner on the website</p>
                    </div>
                    <Switch
                        id="active"
                        checked={form.active}
                        onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                    />
                </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : partner ? 'Save Changes' : 'Create Partner'}
                </Button>
            </DialogFooter>
        </form>
    )
}
