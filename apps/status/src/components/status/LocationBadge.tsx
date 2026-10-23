import { MapPin } from 'lucide-react';

export function LocationBadge({ location, className = '' }: { location: string; className?: string }) {
    return (
        <span
            className={`inline-flex max-w-full shrink-0 items-center gap-1 rounded-full border border-brand-sky/20 bg-brand-sky/[0.06] px-2 py-0.5 text-[11px] font-medium text-brand-sky/90 ${className}`}
        >
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{location}</span>
        </span>
    );
}
