"use client"

import React, { useEffect, useState } from 'react'
import { CheckCircle, Clock } from 'lucide-react'
import { Badge } from '@/packages/components/ui/badge'

type Props = {
    target: string
    label?: string
    sublabel?: string
}

function formatTime(ms: number) {
    if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    const totalSeconds = Math.floor(ms / 1000)
    const days = Math.floor(totalSeconds / (24 * 3600))
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return { days, hours, minutes, seconds }
}

function TimeBlock({ value, label }: { value: number | string; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="bg-background/80 backdrop-blur border border-border/50 rounded-lg px-3 py-2 min-w-[60px] md:min-w-[70px]">
                <div className="text-2xl md:text-3xl font-bold tabular-nums text-center">
                    {typeof value === 'number' ? String(value).padStart(2, '0') : value}
                </div>
            </div>
            <div className="text-[10px] md:text-xs text-muted-foreground mt-1.5 uppercase tracking-wider">
                {label}
            </div>
        </div>
    )
}

export default function Countdown({ target, label, sublabel }: Props) {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(t)
    }, [])

    const targetMs = new Date(target).getTime()
    const remaining = targetMs - now
    const expired = remaining <= 0
    const { days, hours, minutes, seconds } = formatTime(remaining)

    return (
        <div className="relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        {label && <div className="font-semibold text-lg">{label}</div>}
                        {sublabel && <div className="text-sm text-muted-foreground">{sublabel}</div>}
                    </div>
                    {expired ? (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            LIVE NOW
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Upcoming
                        </Badge>
                    )}
                </div>

                {/* Countdown or Live State */}
                {expired ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                                Now Available
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                This release is now streaming!
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 md:gap-3">
                        <TimeBlock value={days} label="Days" />
                        <div className="text-2xl font-bold text-muted-foreground/50 self-start mt-2">:</div>
                        <TimeBlock value={hours} label="Hours" />
                        <div className="text-2xl font-bold text-muted-foreground/50 self-start mt-2">:</div>
                        <TimeBlock value={minutes} label="Mins" />
                        <div className="text-2xl font-bold text-muted-foreground/50 self-start mt-2">:</div>
                        <TimeBlock value={seconds} label="Secs" />
                    </div>
                )}
            </div>
        </div>
    )
}
