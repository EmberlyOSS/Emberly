"use client"

import React, { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

type Attachment = {
    id: string
    file: { id: string; urlPath: string; mimeType: string }
}

type Comment = {
    id: string
    content: string
    isSpoiler?: boolean
    createdAt: string
    user: { id: string; name: string | null; urlId: string; image?: string | null }
    replies?: { id: string; content: string; createdAt: string; user: { id: string; name?: string | null; urlId: string; image?: string | null } }[]
    likeCount?: number
    dislikeCount?: number
    viewerReaction?: string | null
    attachments?: Attachment[]
}

export default function Comments() {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [posting, setPosting] = useState(false)
    const [content, setContent] = useState('')
    const [files, setFiles] = useState<File[]>([])
    const [isSpoiler, setIsSpoiler] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const { toast } = useToast()

    const load = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/st5/comments', { cache: 'no-store' })
            const data = await res.json()
            if (res.ok && Array.isArray(data.data)) {
                setComments(data.data)
            } else {
                throw new Error(data?.error || 'Failed to load comments')
            }
        } catch (err) {
            console.error(err)
            toast({ title: 'Failed to load comments', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const checkAdmin = async () => {
        try {
            const res = await fetch('/api/auth/session')
            if (!res.ok) return
            const data = await res.json()
            if (data?.user?.role === 'ADMIN') setIsAdmin(true)
            if (data?.user?.id) setCurrentUserId(data.user.id)
        } catch {
            // ignore
        }
    }

    useEffect(() => {
        load()
        checkAdmin()
    }, [])

    const uploadFile = async (file: File) => {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/files', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Upload failed')
        return json.data?.id || json?.data?.file?.id || null
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const body = content.trim()
        if (!body && files.length === 0) {
            toast({ title: 'Please enter a comment or attach a file', variant: 'destructive' })
            return
        }
        setPosting(true)
        try {
            const attachmentIds: string[] = []
            for (const f of files) {
                const id = await uploadFile(f)
                if (id) attachmentIds.push(id)
            }

            const res = await fetch('/api/st5/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: body, attachments: attachmentIds, isSpoiler }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Failed to post comment')

            setContent('')
            setFiles([])
            setIsSpoiler(false)
            setComments((prev) => [data.data, ...prev])
        } catch (err: any) {
            console.error(err)
            const message = err?.message || 'Failed to post comment'
            toast({ title: message.includes('Unauthorized') ? 'Please sign in' : 'Error', description: message, variant: 'destructive' })
        } finally {
            setPosting(false)
        }
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files
        if (!selected) return
        setFiles((prev) => [...prev, ...Array.from(selected)])
    }

    const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i))

    const toggleHidden = async (id: string, hidden: boolean) => {
        try {
            const res = await fetch(`/api/st5/comments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isHidden: hidden }),
            })
            if (!res.ok) throw new Error('Failed')
            setComments((prev) => prev.filter((c) => c.id !== id))
            toast({ title: hidden ? 'Comment hidden' : 'Comment unhidden' })
        } catch (err) {
            toast({ title: 'Failed to update comment', variant: 'destructive' })
        }
    }

    const postReply = async (commentId: string, replyContent: string, onSuccess: (r: any) => void) => {
        try {
            const res = await fetch(`/api/st5/comments/${commentId}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: replyContent }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Failed to post reply')
            onSuccess(data.data)
        } catch (err: any) {
            toast({ title: err?.message?.includes('Unauthorized') ? 'Please sign in' : 'Failed to post reply', variant: 'destructive' })
        }
    }

    const toggleReaction = async (commentId: string, type: 'like' | 'dislike') => {
        try {
            const res = await fetch(`/api/st5/comments/${commentId}/reactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Failed')

            setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, likeCount: data.data.likeCount, dislikeCount: data.data.dislikeCount, viewerReaction: data.data.viewerReaction } : c)))
        } catch (err: any) {
            toast({ title: err?.message?.includes('Unauthorized') ? 'Please sign in' : 'Failed to update reaction', variant: 'destructive' })
        }
    }

    function ReplyButton({ comment, currentUserId, onPost }: { comment: Comment; currentUserId: string | null; onPost: (id: string, content: string, cb: (r: any) => void) => void }) {
        const [open, setOpen] = useState(false)
        const [reply, setReply] = useState('')
        const [postingReply, setPostingReply] = useState(false)

        const submit = async () => {
            if (!currentUserId) {
                toast({ title: 'Please sign in to reply', variant: 'destructive' })
                return
            }
            const text = reply.trim()
            if (!text) return
            setPostingReply(true)
            await onPost(comment.id, text, (r: any) => {
                setReply('')
                setOpen(false)
                // append reply locally
                setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, replies: [...(c.replies || []), r] } : c)))
            })
            setPostingReply(false)
        }

        return (
            <div className="w-full">
                <div className="flex items-center justify-end">
                    <button type="button" onClick={() => { if (!currentUserId) { toast({ title: 'Please sign in to reply', variant: 'destructive' }); return } setOpen((s) => !s) }} className="text-sm text-muted-foreground">Reply</button>
                </div>
                {open && (
                    <div className="mt-2 w-full min-w-0">
                        <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} maxLength={400} className="w-full block" style={{ width: '100%' }} />
                        <div className="flex items-center gap-2 mt-2">
                            <Button size="sm" onClick={submit} disabled={postingReply}>{postingReply ? 'Posting...' : 'Post reply'}</Button>
                            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="bg-background/50 border border-border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Comments</h3>
            <form onSubmit={onSubmit} className="space-y-2 mb-4">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share a non-spoiler thought..."
                    maxLength={800}
                    rows={3}
                />

                <div className="flex items-center gap-2">
                    <input type="file" multiple accept="image/*" onChange={handleFileInput} />
                    <label className="ml-2 text-sm text-muted-foreground flex items-center gap-2">
                        <input type="checkbox" checked={isSpoiler} onChange={(e) => setIsSpoiler(e.target.checked)} />
                        <span>Mark as spoiler</span>
                    </label>
                </div>

                {files.length > 0 && (
                    <div className="flex gap-2 overflow-auto py-2">
                        {files.map((f, i) => (
                            <div key={i} className="relative">
                                <img src={URL.createObjectURL(f)} className="h-16 w-16 object-cover rounded" alt={f.name} />
                                <button type="button" onClick={() => removeFile(i)} className="absolute -top-1 -right-1 bg-red-600 rounded-full text-white text-xs px-1">x</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{content.length}/800</span>
                    <Button type="submit" size="sm" disabled={posting}>{posting ? 'Posting...' : 'Post'}</Button>
                </div>
            </form>

            {loading ? (
                <div className="text-sm text-muted-foreground">Loading comments...</div>
            ) : comments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No comments yet. Be the first.</div>
            ) : (
                <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                    {comments.map((c) => (
                        <div key={c.id} className="rounded-md border border-border/60 bg-background/60 p-3">
                            <div className="flex items-start justify-between text-xs text-muted-foreground mb-1">
                                <div className="flex items-center gap-3">
                                    {c.user.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={c.user.image} alt={c.user.name || c.user.urlId} className="h-8 w-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-muted text-xs flex items-center justify-center">{(c.user.name || c.user.urlId || '').charAt(0).toUpperCase()}</div>
                                    )}
                                    <div className="font-medium text-foreground">{c.user.name || c.user.urlId}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                                    {isAdmin && (
                                        <button onClick={() => toggleHidden(c.id, true)} className="text-xs text-destructive">Hide</button>
                                    )}
                                </div>
                            </div>

                            {c.isSpoiler ? (
                                <details className="text-sm leading-relaxed whitespace-pre-wrap break-words bg-black/10 p-2 rounded">
                                    <summary className="cursor-pointer text-sm text-muted-foreground">Spoiler — click to reveal</summary>
                                    <div className="mt-2">{c.content}</div>
                                </details>
                            ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{c.content}</p>
                            )}

                            {c.attachments && c.attachments.length > 0 && (
                                <div className="mt-2 flex gap-2">
                                    {c.attachments.map((a) => (
                                        <a key={a.id} href={`/api/files/${a.file.id}`} target="_blank" rel="noreferrer" className="block">
                                            <img src={`/api/files/${a.file.id}/thumbnail`} className="h-20 w-20 object-cover rounded" alt="attachment" />
                                        </a>
                                    ))}
                                </div>
                            )}

                            <div className="mt-3 flex items-center gap-3">
                                <button onClick={() => toggleReaction(c.id, 'like')} className={`text-sm px-2 py-1 rounded ${c.viewerReaction === 'like' ? 'bg-primary text-white' : 'bg-background/40'}`}>
                                    👍 {c.likeCount || 0}
                                </button>
                                <button onClick={() => toggleReaction(c.id, 'dislike')} className={`text-sm px-2 py-1 rounded ${c.viewerReaction === 'dislike' ? 'bg-destructive text-white' : 'bg-background/40'}`}>
                                    👎 {c.dislikeCount || 0}
                                </button>
                            </div>

                            <div className="mt-2">
                                <ReplyButton comment={c} currentUserId={currentUserId} onPost={postReply} />
                            </div>

                            {c.replies && c.replies.length > 0 && (
                                <div className="mt-3 space-y-2 pl-10">
                                    {c.replies.map((r) => (
                                        <div key={r.id} className="flex items-start gap-3">
                                            {r.user.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={r.user.image} alt={r.user.name || r.user.urlId} className="h-7 w-7 rounded-full object-cover" />
                                            ) : (
                                                <div className="h-7 w-7 rounded-full bg-muted text-xs flex items-center justify-center">{(r.user.name || r.user.urlId || '').charAt(0).toUpperCase()}</div>
                                            )}
                                            <div>
                                                <div className="text-xs font-medium">{r.user.name || r.user.urlId} <span className="text-[11px] text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span></div>
                                                <div className="text-sm text-muted-foreground">{r.content}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
