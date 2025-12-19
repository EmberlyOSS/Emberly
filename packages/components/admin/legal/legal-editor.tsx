'use client'

import { useEffect, useState } from 'react'

import { markdown } from '@codemirror/lang-markdown'
import CodeMirror from '@uiw/react-codemirror'
import MarkdownRenderer from '@/packages/components/docs/MarkdownRenderer'

import { Input } from '@/packages/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/packages/components/ui/select'

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

            onSaved?.()
        } catch (err) {
            alert(String(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSave} className="p-4 border rounded-lg bg-background/50">
            <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full"
                        required
                    />
                    <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="Slug (url-friendly)"
                        className="w-full"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder="Excerpt"
                        className="w-full"
                    />
                    <Input
                        type="number"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        placeholder="Sort order (optional)"
                        className="w-full"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="border rounded-md overflow-hidden bg-background/60">
                        <div className="flex items-center justify-between px-3 py-2 bg-muted/10 border-b">
                            <span>Editor (Markdown)</span>
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => setShowPreview((v) => !v)}
                                aria-expanded={showPreview}
                                aria-controls="legal-preview-panel"
                            >
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </button>
                        </div>
                        <div className="p-2">
                            <CodeMirror
                                value={content}
                                height="320px"
                                extensions={[markdown()]}
                                onChange={(value) => setContent(value)}
                                theme="dark"
                                className="text-foreground rounded"
                            />
                        </div>
                    </div>

                    {showPreview && (
                        <div
                            id="legal-preview-panel"
                            className="border rounded-md overflow-hidden bg-background/60 animate-fade-in"
                        >
                            <div className="px-3 py-2 bg-muted/10 border-b">Preview</div>
                            <div className="p-4 prose max-w-none overflow-auto">
                                <MarkdownRenderer>{content || '*Nothing to preview*'}</MarkdownRenderer>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:flex md:items-center md:space-x-4">
                    <Select value={status} onValueChange={(v) => setStatus(v)}>
                        <SelectTrigger className="w-[160px]">
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

                    <Input
                        type="datetime-local"
                        value={publishedAt || ''}
                        onChange={(e) => setPublishedAt(e.target.value || null)}
                        className="w-56"
                    />

                    <div className="ml-auto flex items-center space-x-2">
                        <button type="button" className="btn" onClick={() => onCancel?.()}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {legalId ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}

export default LegalEditor
