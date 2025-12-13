'use client'

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Star } from 'lucide-react'

function initialsFromName(name?: string | null, fallback?: string) {
    const source = (name || fallback || '').trim()
    if (!source) return ''
    const parts = source.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function TestimonialsList({ testimonials }: { testimonials?: Array<any> }) {
    if (!testimonials || testimonials.length === 0) return null

    return (
        <section className="mt-12">
            <h2 className="text-2xl font-semibold">What people say</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {testimonials.map((t) => {
                    const date = t?.createdAt ? new Date(t.createdAt) : null
                    const hasValidDate = date && !isNaN(date.getTime())

                    return (
                        <div key={t.id} className="rounded-lg border p-4 bg-background/50 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    {t.user?.image ? (
                                        <AvatarImage src={t.user.image} alt={t.user?.name ?? t.user?.urlId} />
                                    ) : (
                                        <AvatarFallback>{initialsFromName(t.user?.name, t.user?.urlId)}</AvatarFallback>
                                    )}
                                </Avatar>
                                <div>
                                    <div className="text-sm font-medium">{t.user?.name ?? t.user?.urlId}</div>
                                    {hasValidDate && (
                                        <div className="text-xs text-muted-foreground">{date!.toLocaleDateString()}</div>
                                    )}
                                </div>
                            </div>

                            <blockquote className="mt-3 text-sm text-foreground/90">“{t.content}”</blockquote>

                            {typeof t.rating === 'number' && (
                                <div className="mt-3 flex items-center gap-1" aria-hidden>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={14} className={i < (t.rating ?? 0) ? 'text-amber-400' : 'text-muted-foreground'} />
                                    ))}
                                    <span className="sr-only">Rating: {t.rating}/5</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
