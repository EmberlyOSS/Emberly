import React from 'react'
import Countdown from '@/components/st5/Countdown'
import Facts from '@/components/st5/Facts'
import Comments from '@/components/st5/Comments'

export const metadata = {
    title: 'ST5 | Fan hub',
    description: 'Fan made page for Stranger Things season 5 countdowns, comments and fun facts.',
}

// Return the next occurrence of a month/day at 8PM ET (UTC-5), converted to UTC.
function nextEtRelease(month: number, day: number, hourEt = 20) {
    const now = new Date()
    const year = now.getUTCFullYear()
    const utcCandidate = new Date(Date.UTC(year, month - 1, day, hourEt + 5, 0, 0))
    if (utcCandidate.getTime() <= now.getTime()) {
        return new Date(Date.UTC(year + 1, month - 1, day, hourEt + 5, 0, 0))
    }
    return utcCandidate
}

export default function ST5Page() {
    const releaseNight = nextEtRelease(12, 25, 20).toISOString()
    const seasonFinale = nextEtRelease(12, 31, 20).toISOString()

    return (
        <main className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="rounded-2xl border border-border bg-gradient-to-br from-background via-background/70 to-background/50 px-8 py-10 shadow-lg">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-primary">Hawkins fan hub</p>
                            <h1 className="text-4xl font-extrabold leading-tight">Stranger Things 5 countdowns & community</h1>
                            <p className="text-sm text-muted-foreground max-w-3xl">Fan made, non affiliated. Track the remaining two part release, read quick facts, and join a spoiler light comment thread.</p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground shadow-sm">
                            <div className="font-semibold text-foreground">Release windows (ET)</div>
                            <div>Dec 25, 8PM — 3 episodes</div>
                            <div>Dec 31, 8PM — finale</div>
                        </div>
                    </div>
                </header>

                <section className="grid gap-6 lg:grid-cols-1 items-start">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Countdowns</h2>
                            <span className="text-xs text-muted-foreground">Times shown are Eastern Time</span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 items-start">
                            <Countdown target={releaseNight} label="3-episode drop · Dec 25 @ 8PM ET" />
                            <Countdown target={seasonFinale} label="Season finale · Dec 31 @ 8PM ET" />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 mt-2">
                            <article className="bg-background/70 bg-gradient-to-br from-[#0f1724] to-[#071029] border border-border rounded-lg p-4 shadow-lg">
                                <h3 className="text-lg font-semibold mb-2">What to expect (non spoiler)</h3>
                                <p className="text-sm text-muted-foreground">Expect finale scale stakes, character closure, and a strong emphasis on atmosphere, sound, and practical effects. This hub keeps plot details out.</p>
                            </article>

                            <article className="bg-background/70 bg-gradient-to-br from-[#0f1724] to-[#071029] border border-border rounded-lg p-4 shadow-lg">
                                <h3 className="text-lg font-semibold mb-2">How to watch</h3>
                                <p className="text-sm text-muted-foreground">Check your region's official streaming platform for exact availability and release times. Use official channels for definitive announcements.</p>
                            </article>
                        </div>
                    </div>

                    <aside className="lg:col-span-1">
                        <h2 className="text-xl font-semibold mb-3">At a glance</h2>
                        <Facts />
                    </aside>
                </section>

                <section className="rounded-2xl border border-border bg-background/70 p-5 shadow-sm space-y-3">
                    <div>
                        <h2 className="text-xl font-semibold">Join the conversation</h2>
                        <p className="text-sm text-muted-foreground">Share non spoiler theories, screenshots, or fan art. Mark posts with spoiler warnings if needed.</p>
                    </div>
                    <Comments />
                </section>
            </div>
        </main>
    )
}
