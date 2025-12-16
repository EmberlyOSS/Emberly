'use client'

import React, { useState } from 'react'
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
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    if (!testimonials || testimonials.length === 0) return null

    function toggle(id: string) {
        setExpanded((s) => ({ ...s, [id]: !s[id] }))
    }

    return (
        <section className="mt-12">
            <h2 className="text-2xl font-semibold">What people say</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {testimonials.map((t) => {
                    const date = t?.createdAt ? new Date(t.createdAt) : null
                    const hasValidDate = date && !isNaN(date.getTime())
                    const isExpanded = !!expanded[t.id]
                    const content = String(t.content || '')
                    const preview = content.length > 160 && !isExpanded ? content.slice(0, 160).trim() + '…' : content

                    return (
                        <article key={t.id} className="rounded-2xl border border-border/20 p-5 bg-background/60 shadow-sm hover:shadow-md transition-shadow" aria-labelledby={`testimonial-${t.id}`}>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    {t.user?.image ? (
                                        <AvatarImage src={t.user.image} alt={t.user?.name ?? t.user?.urlId} />
                                    ) : (
                                        <AvatarFallback>{initialsFromName(t.user?.name, t.user?.urlId)}</AvatarFallback>
                                    )}
                                </Avatar>
                                <div>
                                    <div id={`testimonial-${t.id}`} className="text-sm font-medium">{t.user?.name ?? t.user?.urlId}</div>
                                    {hasValidDate && (
                                        <div className="text-xs text-muted-foreground">{date!.toLocaleDateString()}</div>
                                    )}
                                </div>
                            </div>

                            <blockquote className="mt-3 text-sm text-foreground/90 italic border-l-2 pl-3">“{preview}”</blockquote>

                            {content.length > 160 && (
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2" aria-hidden>
                                        {typeof t.rating === 'number' && (
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} size={14} className={i < (t.rating ?? 0) ? 'text-amber-400' : 'text-muted-foreground'} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="ml-2">
                                        <button
                                            onClick={() => toggle(t.id)}
                                            className="text-sm text-primary font-medium hover:underline"
                                            aria-expanded={isExpanded}
                                        >
                                            {isExpanded ? 'Hide' : 'Read'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {content.length <= 160 && typeof t.rating === 'number' && (
                                <div className="mt-3 flex items-center gap-1" aria-hidden>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={14} className={i < (t.rating ?? 0) ? 'text-amber-400' : 'text-muted-foreground'} />
                                    ))}
                                    <span className="sr-only">Rating: {t.rating}/5</span>
                                </div>
                            )}
                        </article>
                    )
                })}
            </div>
        </section>
    )
}
