'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

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
        <Card>
            <CardHeader>
                <CardTitle>Testimonials</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 text-sm text-muted-foreground">
                    By submitting a testimonial you agree to let us display your message and name on the site once approved by an admin. Please keep submissions civil and related to your experience using Emberly. Max 1000 characters.
                </div>

                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <Label>Message</Label>
                        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
                    </div>

                    <div>
                        <Label>Rating (optional)</Label>
                        <select value={rating} onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-48 rounded-md border bg-background px-2 py-1">
                            <option value="">No rating</option>
                            <option value="5">5 — Excellent</option>
                            <option value="4">4 — Good</option>
                            <option value="3">3 — Okay</option>
                            <option value="2">2 — Poor</option>
                            <option value="1">1 — Bad</option>
                        </select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2">
                        {/* Show Submit only when user has not submitted a testimonial yet */}
                        {!testimonial && (
                            <Button type="submit" disabled={loading} className="w-full sm:w-auto">Submit</Button>
                        )}

                        {/* When editing, surface Save and Cancel */}
                        {testimonial && editing && (
                            <>
                                <Button type="submit" disabled={loading} className="w-full sm:w-auto">Save</Button>
                                <Button variant="ghost" onClick={() => { setEditing(false); setMessage(null); }} className="w-full sm:w-auto">Cancel</Button>
                            </>
                        )}

                        {/* Actions when testimonial exists and not editing */}
                        {testimonial && !editing && (
                            <>
                                <Button variant="ghost" onClick={() => setEditing(true)} className="w-full sm:w-auto">Edit</Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={loading} className="w-full sm:w-auto">Delete</Button>
                                <Button onClick={toggleArchive} disabled={loading} className="w-full sm:w-auto">{testimonial.archived ? 'Unarchive' : 'Archive'}</Button>
                            </>
                        )}

                        {message && <div className="text-sm text-muted-foreground sm:ml-2">{message}</div>}
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

export default ProfileTestimonials
