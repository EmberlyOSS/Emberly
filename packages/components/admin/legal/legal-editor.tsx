'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Save, Scale, X } from 'lucide-react'

import { markdown } from '@codemirror/lang-markdown'
import CodeMirror from '@uiw/react-codemirror'
import MarkdownRenderer from '@/packages/components/docs/MarkdownRenderer'

import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/packages/components/ui/select'
import { useToast } from '@/packages/hooks/use-toast'

import type { LegalRecord } from './legal-list'

const statuses = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'ARCHIVED', label: 'Archived' },
]

type Props = {
    legalId?: string
    onSaved?: () => void
    onCancel?: () => void
}

export function LegalEditor({ legalId, onSaved, onCancel }: Props) {
    const { toast } = useToast()
    const [slug, setSlug] = useState('')
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [excerpt, setExcerpt] = useState('')
    const [status, setStatus] = useState('DRAFT')
    const [publishedAt, setPublishedAt] = useState<string | null>(null)
    const [sortOrder, setSortOrder] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    useEffect(() => {
        if (!legalId) {
            setSlug('')
            setTitle('')
            setContent('')
            setExcerpt('')
            setStatus('DRAFT')
            setPublishedAt(null)
            setSortOrder('')
            return
        }

        async function load() {
            setLoading(true)
            try {
                const res = await fetch(`/api/legal/${legalId}?admin=true`, {
                    credentials: 'include',
                })
                const json = await res.json()
                const page: LegalRecord = json.data
                setSlug(page.slug || '')
                setTitle(page.title || '')
                setContent(page.content || '')
                setExcerpt(page.excerpt || '')
                setStatus(page.status || 'DRAFT')
                setPublishedAt(page.publishedAt || null)
                setSortOrder(page.sortOrder != null ? String(page.sortOrder) : '')
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [legalId])

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const payload = {
                slug,
                title,
                content,
                excerpt,
                status,
                publishedAt: publishedAt || null,
                sortOrder: sortOrder === '' ? null : Number(sortOrder),
            }

            let res
            if (legalId) {
                res = await fetch(`/api/legal/${legalId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include',
                })
            } else {
                res = await fetch('/api/legal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include',
                })
            }

            if (!res.ok) {
                const j = await res.json().catch(() => null)
                throw new Error(j?.error || 'Save failed')
            }

            toast({
                title: legalId ? 'Legal page updated' : 'Legal page created',
                description: `Successfully ${legalId ? 'updated' : 'created'} the legal page.`,
            })
            onSaved?.()
        } catch (err) {
            toast({
                title: 'Error',
                description: String(err),
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSave} className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/50">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Scale className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{legalId ? 'Edit Legal Page' : 'New Legal Page'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreview((v) => !v)}
                        className="gap-2"
                    >
                        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showPreview ? 'Hide Preview' : 'Preview'}
                    </Button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Title & Slug */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Page title"
                            className="bg-background/50 border-border/50 focus:border-primary/50"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug" className="text-sm font-medium">Slug</Label>
                        <Input
                            id="slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="url-friendly-slug"
                            className="bg-background/50 border-border/50 focus:border-primary/50 font-mono text-sm"
                            required
                        />
                    </div>
                </div>

                {/* Excerpt & Sort Order */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="excerpt" className="text-sm font-medium">Excerpt</Label>
                        <Input
                            id="excerpt"
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder="Brief summary"
                            className="bg-background/50 border-border/50 focus:border-primary/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sortOrder" className="text-sm font-medium">Sort Order</Label>
                        <Input
                            id="sortOrder"
                            type="number"
                            min="0"
                            step="1"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            placeholder="0"
                            className="bg-background/50 border-border/50 focus:border-primary/50"
                        />
                    </div>
                </div>

                {/* Editor & Preview */}
                <div className={`grid gap-4 ${showPreview ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Content (Markdown)</Label>
                        <div className="rounded-lg border border-border/50 overflow-hidden bg-background/50">
                            <CodeMirror
                                value={content}
                                height="320px"
                                extensions={[markdown()]}
                                onChange={(value) => setContent(value)}
                                theme="dark"
                                className="text-foreground"
                            />
                        </div>
                    </div>

                    {showPreview && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Preview</Label>
                            <div className="rounded-lg border border-border/50 bg-background/50 p-4 h-[320px] overflow-auto prose prose-sm max-w-none dark:prose-invert">
                                <MarkdownRenderer>{content || '*Nothing to preview*'}</MarkdownRenderer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Status & Actions */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="status" className="text-sm font-medium whitespace-nowrap">Status:</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v)}>
                            <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Label htmlFor="publishedAt" className="text-sm font-medium whitespace-nowrap">Publish Date:</Label>
                        <Input
                            id="publishedAt"
                            type="datetime-local"
                            value={publishedAt || ''}
                            onChange={(e) => setPublishedAt(e.target.value || null)}
                            className="w-auto bg-background/50 border-border/50 focus:border-primary/50"
                        />
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <Button type="button" variant="ghost" onClick={() => onCancel?.()} className="gap-2">
                            <X className="h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="gap-2">
                            <Save className="h-4 w-4" />
                            {legalId ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    )
}

export default LegalEditor
