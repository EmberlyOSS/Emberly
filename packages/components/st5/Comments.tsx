"use client"

import React, { useEffect, useState } from 'react'
import { ImagePlus, Loader2, MessageCircle, Reply, Send, ThumbsDown, ThumbsUp, X, AlertTriangle } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Textarea } from '@/packages/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Checkbox } from '@/packages/components/ui/checkbox'
import { Label } from '@/packages/components/ui/label'
import { useToast } from '@/packages/hooks/use-toast'

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
                setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, replies: [...(c.replies || []), r] } : c)))
            })
            setPostingReply(false)
        }

        return (
            <div className="w-full">
                {!open ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            if (!currentUserId) {
                                toast({ title: 'Please sign in to reply', variant: 'destructive' })
                                return
                            }
                            setOpen(true)
                        }}
                    >
                        <Reply className="h-3.5 w-3.5 mr-1.5" />
                        Reply
                    </Button>
                ) : (
                    <div className="mt-3 space-y-2">
                        <Textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            rows={2}
                            maxLength={400}
                            placeholder="Write a reply..."
                            className="bg-background/50"
                        />
                        <div className="flex items-center gap-2">
                            <Button size="sm" onClick={submit} disabled={postingReply || !reply.trim()}>
                                {postingReply ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                        Posting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-3.5 w-3.5 mr-1.5" />
                                        Post
                                    </>
                                )}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Comment Form */}
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="relative rounded-xl bg-background/80 backdrop-blur border border-border/50 p-4">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share a non-spoiler thought..."
                        maxLength={800}
                        rows={3}
                        className="bg-transparent border-0 focus-visible:ring-0 resize-none p-0 min-h-[80px]"
                    />

                    {files.length > 0 && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                            {files.map((f, i) => (
                                <div key={i} className="relative group">
                                    <img
                                        src={URL.createObjectURL(f)}
                                        className="h-16 w-16 object-cover rounded-lg border border-border/50"
                                        alt={f.name}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(i)}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileInput}
                                    className="hidden"
                                />
                                <ImagePlus className="h-5 w-5" />
                            </label>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="spoiler"
                                    checked={isSpoiler}
                                    onCheckedChange={(checked) => setIsSpoiler(checked === true)}
                                />
                                <Label htmlFor="spoiler" className="text-sm text-muted-foreground cursor-pointer">
                                    Mark as spoiler
                                </Label>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{content.length}/800</span>
                            <Button type="submit" size="sm" disabled={posting || (!content.trim() && files.length === 0)}>
                                {posting ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                        Posting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-3.5 w-3.5 mr-1.5" />
                                        Post
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Comments List */}
            {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading comments...
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[500px] overflow-auto pr-2">
                    {comments.map((c) => (
                        <div
                            key={c.id}
                            className="relative rounded-xl bg-background/60 backdrop-blur border border-border/50 p-4"
                        >
                            {/* Comment Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={c.user.image || undefined} alt={c.user.name || c.user.urlId} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                            {(c.user.name || c.user.urlId || '?').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-sm">{c.user.name || c.user.urlId}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(c.createdAt).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => toggleHidden(c.id, true)}
                                    >
                                        Hide
                                    </Button>
                                )}
                            </div>

                            {/* Comment Content */}
                            {c.isSpoiler ? (
                                <details className="group">
                                    <summary className="cursor-pointer text-sm text-muted-foreground flex items-center gap-2 py-2 px-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                        Spoiler — click to reveal
                                    </summary>
                                    <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
                                        {c.content}
                                    </p>
                                </details>
                            ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {c.content}
                                </p>
                            )}

                            {/* Attachments */}
                            {c.attachments && c.attachments.length > 0 && (
                                <div className="mt-3 flex gap-2 flex-wrap">
                                    {c.attachments.map((a) => (
                                        <a
                                            key={a.id}
                                            href={`/api/files/${a.file.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block"
                                        >
                                            <img
                                                src={`/api/files/${a.file.id}/thumbnail`}
                                                className="h-20 w-20 object-cover rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                                                alt="attachment"
                                            />
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* Reactions & Reply */}
                            <div className="mt-4 flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={c.viewerReaction === 'like' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}
                                    onClick={() => toggleReaction(c.id, 'like')}
                                >
                                    <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                                    {c.likeCount || 0}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={c.viewerReaction === 'dislike' ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground'}
                                    onClick={() => toggleReaction(c.id, 'dislike')}
                                >
                                    <ThumbsDown className="h-3.5 w-3.5 mr-1.5" />
                                    {c.dislikeCount || 0}
                                </Button>
                                <ReplyButton comment={c} currentUserId={currentUserId} onPost={postReply} />
                            </div>

                            {/* Replies */}
                            {c.replies && c.replies.length > 0 && (
                                <div className="mt-4 ml-6 pl-4 border-l border-border/50 space-y-3">
                                    {c.replies.map((r) => (
                                        <div key={r.id} className="flex items-start gap-3">
                                            <Avatar className="h-7 w-7">
                                                <AvatarImage src={r.user.image || undefined} alt={r.user.name || r.user.urlId} />
                                                <AvatarFallback className="bg-muted text-xs">
                                                    {(r.user.name || r.user.urlId || '?').charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-medium">{r.user.name || r.user.urlId}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: 'numeric',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-0.5">{r.content}</p>
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
