'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/packages/components/ui/button'
import { Textarea } from '@/packages/components/ui/textarea'
import { Label } from '@/packages/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'

// Glass card wrapper component for consistent styling
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative rounded-xl bg-white/5 dark:bg-black/5 backdrop-blur-sm border border-white/10 dark:border-white/5 shadow-lg shadow-black/5 ${className}`}>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 dark:from-white/[0.02] dark:via-transparent dark:to-black/5 pointer-events-none" />
            <div className="relative">
                {children}
            </div>
        </div>
    )
}

export function ProfileTestimonials() {
    const [content, setContent] = useState('')
    const [rating, setRating] = useState<number | ''>('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [testimonial, setTestimonial] = useState<any | null>(null)
    const [editing, setEditing] = useState(false)

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                const res = await fetch('/api/testimonials?mine=true')
                // If the response is not OK (e.g. unauthorized), treat as no testimonial
                if (!res.ok) {
                    if (!mounted) return
                    setTestimonial(null)
                    return
                }

                const payload = await res.json()
                if (!mounted) return
                // Prefer envelope .data when present
                const raw = payload && (payload.data === undefined ? payload : payload.data)

                // Only accept a testimonial object if it looks like one (has an id)
                const t = raw && typeof raw === 'object' && raw.id ? raw : null

                if (t) {
                    setTestimonial(t)
                    setContent(t.content || '')
                    setRating(t.rating ?? '')
                } else {
                    setTestimonial(null)
                }
            } catch (err) {
                if (!mounted) return
                setTestimonial(null)
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            if (testimonial && !editing) {
                setMessage('You already submitted a testimonial. Click Edit to modify it.')
                setLoading(false)
                return
            }

            if (testimonial) {
                // update existing
                const res = await fetch('/api/testimonials', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, rating: rating === '' ? undefined : Number(rating) }) })
                const payload = await res.json()
                if (!res.ok) throw new Error(payload.error || 'Failed to update')
                setTestimonial(payload.data || payload)
                setMessage('Updated — awaiting admin approval')
                setEditing(false)
            } else {
                const res = await fetch('/api/testimonials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, rating: rating === '' ? undefined : Number(rating) }) })
                const payload = await res.json()
                if (!res.ok) throw new Error(payload.error || 'Failed to submit')
                setTestimonial(payload.data || payload)
                setMessage('Submitted — awaiting admin approval')
                setContent('')
                setRating('')
            }
        } catch (err: any) {
            setMessage(err?.message || 'Submission failed')
        }
        setLoading(false)
    }

    async function handleDelete() {
        if (!confirm('Delete your testimonial? This cannot be undone.')) return
        setLoading(true)
        try {
            const res = await fetch('/api/testimonials', { method: 'DELETE' })
            const payload = await res.json()
            if (!res.ok) throw new Error(payload.error || 'Failed to delete')
            setTestimonial(null)
            setContent('')
            setRating('')
            setMessage('Deleted')
        } catch (err: any) {
            setMessage(err?.message || 'Deletion failed')
        }
        setLoading(false)
    }

    async function toggleArchive() {
        if (!testimonial) return
        setLoading(true)
        try {
            const res = await fetch('/api/testimonials', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: !testimonial.archived }) })
            const payload = await res.json()
            if (!res.ok) throw new Error(payload.error || 'Failed to update')
            setTestimonial(payload.data || payload)
            setMessage(payload.data?.archived ? 'Archived' : 'Unarchived')
        } catch (err: any) {
            setMessage(err?.message || 'Update failed')
        }
        setLoading(false)
    }

    return (
        <GlassCard>
            <div className="p-6">
                <h3 className="font-semibold leading-none tracking-tight text-lg mb-4">Testimonials</h3>
                <div className="mb-4 text-sm text-muted-foreground p-4 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5">
                    By submitting a testimonial you agree to let us display your message and name on the site once approved by an admin. Please keep submissions civil and related to your experience using Emberly. Max 1000 characters.
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Message</Label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={6}
                            className="bg-white/5 dark:bg-black/5 border-white/10 dark:border-white/5 focus:border-primary/50 focus:ring-primary/20 transition-colors resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Rating (optional)</Label>
                        <Select
                            value={rating === '' ? 'no-rating' : String(rating)}
                            onValueChange={(val) => setRating(val === 'no-rating' ? '' : Number(val))}
                        >
                            <SelectTrigger className="w-48 bg-white/5 dark:bg-black/5 border-white/10 dark:border-white/5 focus:ring-primary/20">
                                <SelectValue placeholder="Select a rating" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no-rating">No rating</SelectItem>
                                <SelectItem value="5">5 — Excellent</SelectItem>
                                <SelectItem value="4">4 — Good</SelectItem>
                                <SelectItem value="3">3 — Okay</SelectItem>
                                <SelectItem value="2">2 — Poor</SelectItem>
                                <SelectItem value="1">1 — Bad</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 pt-2">
                        {/* Show Submit only when user has not submitted a testimonial yet */}
                        {!testimonial && (
                            <Button type="submit" disabled={loading} className="w-full sm:w-auto shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all">Submit</Button>
                        )}

                        {/* When editing, surface Save and Cancel */}
                        {testimonial && editing && (
                            <>
                                <Button type="submit" disabled={loading} className="w-full sm:w-auto shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all">Save</Button>
                                <Button variant="ghost" onClick={() => { setEditing(false); setMessage(null); }} className="w-full sm:w-auto hover:bg-white/5 transition-colors">Cancel</Button>
                            </>
                        )}

                        {/* Actions when testimonial exists and not editing */}
                        {testimonial && !editing && (
                            <>
                                <Button variant="ghost" onClick={() => setEditing(true)} className="w-full sm:w-auto hover:bg-white/5 transition-colors">Edit</Button>
                                <Button variant="ghost" onClick={handleDelete} disabled={loading} className="w-full sm:w-auto hover:bg-destructive/10 hover:text-destructive transition-colors">Delete</Button>
                                <Button variant="outline" onClick={toggleArchive} disabled={loading} className="w-full sm:w-auto border-border/50 hover:bg-white/5 transition-colors">{testimonial.archived ? 'Unarchive' : 'Archive'}</Button>
                            </>
                        )}

                        {message && <div className="text-sm text-muted-foreground sm:ml-2">{message}</div>}
                    </div>
                </form>
            </div>
        </GlassCard>
    )
}

export default ProfileTestimonials
