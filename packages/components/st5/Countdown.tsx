"use client"

import React, { useEffect, useState } from 'react'

type Props = {
    target: string
    label?: string
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

export default function Countdown({ target, label }: Props) {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(t)
    }, [])

    const targetMs = new Date(target).getTime()
    const remaining = Math.max(0, targetMs - now)
    const { days, hours, minutes, seconds } = formatTime(remaining)

    const expired = remaining <= 0

    return (
        <div className="h-36 md:h-40 bg-gradient-to-br from-[#0f1724] to-[#071029] border border-border rounded-lg p-4 shadow-lg flex flex-col justify-between">
            {label && <div className="text-sm text-muted-foreground mb-2">{label}</div>}

            {expired ? (
                <div className="text-lg font-semibold text-emerald-400">Now available</div>
            ) : (
                <div className="flex gap-4 items-center justify-between">
                    <div className="flex gap-3 items-center">
                        <div className="text-center px-3 py-2 bg-black/30 rounded min-w-[64px]">
                            <div className="text-2xl font-extrabold tracking-tight">{days}</div>
                            <div className="text-xs text-muted-foreground">Days</div>
                        </div>

                        <div className="text-center px-3 py-2 bg-black/30 rounded min-w-[64px]">
                            <div className="text-2xl font-extrabold tracking-tight">{String(hours).padStart(2, '0')}</div>
                            <div className="text-xs text-muted-foreground">Hours</div>
                        </div>

                        <div className="text-center px-3 py-2 bg-black/30 rounded min-w-[64px]">
                            <div className="text-2xl font-extrabold tracking-tight">{String(minutes).padStart(2, '0')}</div>
                            <div className="text-xs text-muted-foreground">Minutes</div>
                        </div>

                        <div className="text-center px-3 py-2 bg-black/30 rounded min-w-[64px]">
                            <div className="text-2xl font-extrabold tracking-tight">{String(seconds).padStart(2, '0')}</div>
                            <div className="text-xs text-muted-foreground">Seconds</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
