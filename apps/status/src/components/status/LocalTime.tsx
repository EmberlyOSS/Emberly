'use client';

import { useEffect, useState } from 'react';
import { timeAgo } from '@/lib/status-ui';

type Preset = 'datetime' | 'date' | 'time' | 'short' | 'relative';

interface LocalTimeProps {
    date: Date | string;
    preset?: Preset;
    className?: string;
}

const OPTIONS: Record<Exclude<Preset, 'relative'>, Intl.DateTimeFormatOptions> = {
    datetime: { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    date: { day: 'numeric', month: 'short', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    short: { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
};

function format(d: Date, preset: Preset, timeZone?: string) {
    if (preset === 'relative') return timeAgo(d);
    return d.toLocaleString('en-GB', { ...OPTIONS[preset], timeZone });
}

export function LocalTime({ date, preset = 'datetime', className }: LocalTimeProps) {
    const d = new Date(date);
    const [text, setText] = useState(() =>
        preset === 'relative' ? format(d, 'short', 'UTC') : `${format(d, preset, 'UTC')} UTC`,
    );

    useEffect(() => {
        const update = () => setText(format(new Date(date), preset));
        update();
        if (preset !== 'relative') return;
        const id = setInterval(update, 30_000);
        return () => clearInterval(id);
    }, [date, preset]);

    return (
        <time
            dateTime={d.toISOString()}
            title={d.toLocaleString('en-GB')}
            className={className}
            suppressHydrationWarning
        >
            {text}
        </time>
    );
}
