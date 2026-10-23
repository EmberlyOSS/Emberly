import type { Tone } from '@/lib/status-ui';
import { LocalTime } from './LocalTime';
import { StatusDot } from './Primitives';

export interface TimelineEntry {
    id: string;
    tone: Tone;
    label?: string;
    at: Date | string;
    body: string;
}

export function UpdateTimeline({
    entries,
    live = false,
    compact = false,
}: {
    entries: TimelineEntry[];
    live?: boolean;
    compact?: boolean;
}) {
    return (
        <ol className="relative">
            {entries.map((e, i) => (
                <li key={e.id} className={`relative pl-6 ${i === entries.length - 1 ? '' : compact ? 'pb-4' : 'pb-6'}`}>
                    {i < entries.length - 1 && (
                        <span className="absolute left-[4px] top-4 bottom-0 w-px bg-white/[0.08]" aria-hidden="true" />
                    )}
                    <span className="absolute left-0 top-1.5">
                        <StatusDot tone={e.tone} pulse={live && i === 0} />
                    </span>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        {e.label && <span className={`text-sm font-medium ${e.tone.text}`}>{e.label}</span>}
                        <LocalTime date={e.at} className="text-xs text-zinc-500" />
                    </div>
                    <p
                        className={`mt-1 whitespace-pre-line break-words leading-relaxed text-zinc-300 ${compact ? 'text-sm' : 'text-[15px]'}`}
                    >
                        {e.body}
                    </p>
                </li>
            ))}
        </ol>
    );
}
