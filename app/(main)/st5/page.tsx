import React from 'react'

import { Calendar, Clock, Info, MessageSquare, Play, Sparkles, Tv } from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'
import HomeShell from '@/packages/components/layout/home-shell'
import Countdown from '@/packages/components/st5/Countdown'
import Facts from '@/packages/components/st5/Facts'
import Comments from '@/packages/components/st5/Comments'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'ST5 Fan Hub',
    description: 'Fan made page for Stranger Things season 5 countdowns, comments and fun facts.',
})

// Reusable GlassCard component (consistent with home/about pages)
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${className}`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative">{children}</div>
        </div>
    )
}

// Fixed release dates in UTC (8PM ET = 1AM UTC next day)
const RELEASE_DATES = {
    part1: new Date('2025-12-26T01:00:00.000Z'), // Dec 25 @ 8PM ET
    finale: new Date('2026-01-01T01:00:00.000Z'), // Dec 31 @ 8PM ET
}

export default function ST5Page() {
    const now = new Date()
    const part1Released = now >= RELEASE_DATES.part1
    const finaleReleased = now >= RELEASE_DATES.finale

    return (
        <HomeShell>
            <div className="space-y-8">
                {/* Hero Section */}
                <GlassCard>
                    <div className="p-8 md:p-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            <div>
                                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Fan Hub
                                </Badge>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                                    Stranger Things
                                    <span className="block bg-gradient-to-r from-red-500 via-red-400 to-orange-400 bg-clip-text text-transparent">
                                        Community Hub
                                    </span>
                                </h1>
                                <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
                                    Fan made, non affiliated. Track the three part release of season 5, read quick facts,
                                    and join a spoiler light comment thread with the community.
                                </p>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Badge variant="outline" className="px-3 py-1.5">
                                        <Tv className="h-3.5 w-3.5 mr-1.5" />
                                        Final Season
                                    </Badge>
                                    <Badge variant="outline" className="px-3 py-1.5">
                                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                        Dec 2025
                                    </Badge>
                                    <Badge variant="outline" className="px-3 py-1.5">
                                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                                        8PM ET
                                    </Badge>
                                </div>
                            </div>

                            {/* Release Schedule Card */}
                            <div className="relative rounded-xl bg-background/80 backdrop-blur border border-border/50 p-6 shadow-lg">
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5 pointer-events-none" />
                                <div className="relative">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <Play className="h-4 w-4 text-red-500" />
                                        Release Schedule (ET)
                                    </h3>
                                    <div className="space-y-3">
                                        <div className={`flex items-center justify-between p-3 rounded-lg ${part1Released ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
                                            <div>
                                                <div className="font-medium">Season 5 Part 2 — Episodes 5-7</div>
                                                <div className="text-sm text-muted-foreground">December 25th @ 8PM</div>
                                            </div>
                                            {part1Released && (
                                                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                                    LIVE
                                                </Badge>
                                            )}
                                        </div>
                                        <div className={`flex items-center justify-between p-3 rounded-lg ${finaleReleased ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
                                            <div>
                                                <div className="font-medium">Season 5 Part 3 — Season Finale</div>
                                                <div className="text-sm text-muted-foreground">December 31st @ 8PM</div>
                                            </div>
                                            {finaleReleased && (
                                                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                                    LIVE
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Countdowns */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Countdowns</h2>
                        <span className="text-sm text-muted-foreground">Times shown in Eastern Time</span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Countdown
                            target={RELEASE_DATES.part1.toISOString()}
                            label="Season 5 Part 2 — Episodes 5-7"
                            sublabel="December 25th @ 8PM ET"
                        />
                        <Countdown
                            target={RELEASE_DATES.finale.toISOString()}
                            label="Season 5 Part 3 — Season Finale"
                            sublabel="December 31st @ 8PM ET"
                        />
                    </div>
                </section>

                {/* Info Cards */}
                <section className="grid gap-4 md:grid-cols-2">
                    <GlassCard>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Info className="h-4 w-4 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold">What to Expect (Non-Spoiler)</h3>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Expect finale-scale stakes, character closure, and a strong emphasis on
                                atmosphere, sound, and practical effects. This hub keeps plot details out.
                            </p>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 rounded-lg bg-chart-3/10">
                                    <Tv className="h-4 w-4 text-chart-3" />
                                </div>
                                <h3 className="text-lg font-semibold">How to Watch</h3>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Check your region&apos;s official streaming platform for exact availability
                                and release times. Use official channels for definitive announcements.
                            </p>
                        </div>
                    </GlassCard>
                </section>

                {/* Facts Section */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">At a Glance</h2>
                    <Facts />
                </section>

                {/* Comments Section */}
                <section>
                    <GlassCard>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-lg bg-chart-4/10">
                                    <MessageSquare className="h-4 w-4 text-chart-4" />
                                </div>
                                <h2 className="text-xl font-semibold">Join the Conversation</h2>
                            </div>
                            <p className="text-muted-foreground mb-6">
                                Share non-spoiler theories, screenshots, or fan art. Mark posts with spoiler warnings if needed.
                            </p>
                            <Comments />
                        </div>
                    </GlassCard>
                </section>
            </div>
        </HomeShell>
    )
}
