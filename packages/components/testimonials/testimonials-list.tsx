'use client'

import React, { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/packages/components/ui/avatar'
import { MessageSquare, Quote, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/packages/components/ui/badge'

function initialsFromName(name?: string | null, fallback?: string) {
    const source = (name || fallback || '').trim()
    if (!source) return ''
    const parts = source.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`glass-card overflow-hidden ${className}`}>
            <div className="relative h-full">{children}</div>
        </div>
    )
}

export default function TestimonialsList({ testimonials }: { testimonials?: Array<any> }) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    if (!testimonials || testimonials.length === 0) return null

    function toggle(id: string) {
        setExpanded((s) => ({ ...s, [id]: !s[id] }))
    }

    return (
        <section className="space-y-6">
            {/* Section Header */}
            <div className="text-center">
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Testimonials
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                    What people say
                </h2>
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                    Real feedback from our community of developers and teams using Emberly.
                </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {testimonials.map((t) => {
                    const date = t?.createdAt ? new Date(t.createdAt) : null
                    const hasValidDate = date && !isNaN(date.getTime())
                    const isExpanded = !!expanded[t.id]
                    const content = String(t.content || '')
                    const preview = content.length > 160 && !isExpanded ? content.slice(0, 160).trim() + '…' : content

                    return (
                        <GlassCard
                            key={t.id}
                            className="group hover:border-primary/30 transition-colors flex flex-col"
                        >
                            <article
                                className="p-5 flex flex-col h-full"
                                aria-labelledby={`testimonial-${t.id}`}
                            >
                                {/* Header with Avatar */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Avatar className="relative ring-2 ring-border/50 group-hover:ring-primary/30 transition-all">
                                            {t.user?.image ? (
                                                <AvatarImage src={t.user.image} alt={t.user?.name ?? t.user?.urlId} />
                                            ) : (
                                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                                                    {initialsFromName(t.user?.name, t.user?.urlId)}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div
                                            id={`testimonial-${t.id}`}
                                            className="text-sm font-semibold truncate"
                                        >
                                            {t.user?.name ?? t.user?.urlId}
                                        </div>
                                        {hasValidDate && (
                                            <div className="text-xs text-muted-foreground">
                                                {date!.toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    {/* Quote Icon */}
                                    <Quote className="h-6 w-6 text-primary/30 flex-shrink-0" />
                                </div>

                                {/* Rating Stars */}
                                {typeof t.rating === 'number' && (
                                    <div className="flex items-center gap-1 mb-3" aria-label={`Rating: ${t.rating} out of 5 stars`}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                size={16}
                                                className={`transition-colors ${i < (t.rating ?? 0)
                                                    ? 'text-chart-2 fill-chart-2'
                                                    : 'text-muted-foreground/30'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Content */}
                                <blockquote className="flex-1 text-sm text-foreground/90 leading-relaxed">
                                    <span className="text-primary/60">"</span>
                                    {preview}
                                    <span className="text-primary/60">"</span>
                                </blockquote>

                                {/* Expand/Collapse Button */}
                                {content.length > 160 && (
                                    <div className="mt-4 pt-3 border-t border-border/30">
                                        <button
                                            onClick={() => toggle(t.id)}
                                            className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary/80 transition-colors group/btn"
                                            aria-expanded={isExpanded}
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <ChevronUp className="h-4 w-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                    Show less
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4 group-hover/btn:translate-y-0.5 transition-transform" />
                                                    Read more
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </article>
                        </GlassCard>
                    )
                })}
            </div>
        </section>
    )
}
