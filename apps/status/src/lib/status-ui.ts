export type ComponentStatus =
    | 'OPERATIONAL'
    | 'UNDER_MAINTENANCE'
    | 'DEGRADED_PERFORMANCE'
    | 'PARTIAL_OUTAGE'
    | 'MAJOR_OUTAGE';
export type IncidentStatus = 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
export type MaintenanceStatus = 'NOT_STARTED_YET' | 'IN_PROGRESS' | 'COMPLETED';
export type Indicator = 'NONE' | 'MINOR' | 'MAJOR' | 'CRITICAL';
export type Impact = 'none' | 'minor' | 'major' | 'critical';

export interface Tone {
    label: string;
    dot: string;
    text: string;
    soft: string;
    bar: string;
}

const TONES = {
    ok: {
        dot: 'bg-emerald-500',
        text: 'text-emerald-400',
        soft: 'border-emerald-500/25 bg-emerald-500/[0.07]',
        bar: 'bg-emerald-500/70',
    },
    // Maintenance/informational: blue, kept distinct from the orange brand
    // colour so it never reads as an outage (matches Emberly's footer indicator)
    info: {
        dot: 'bg-blue-400',
        text: 'text-blue-300',
        soft: 'border-blue-400/25 bg-blue-400/[0.07]',
        bar: 'bg-blue-400/70',
    },
    warn: {
        dot: 'bg-amber-400',
        text: 'text-amber-400',
        soft: 'border-amber-400/25 bg-amber-400/[0.07]',
        bar: 'bg-amber-400/80',
    },
    high: {
        dot: 'bg-orange-500',
        text: 'text-orange-400',
        soft: 'border-orange-500/25 bg-orange-500/[0.07]',
        bar: 'bg-orange-500/80',
    },
    crit: {
        dot: 'bg-red-500',
        text: 'text-red-400',
        soft: 'border-red-500/30 bg-red-500/[0.08]',
        bar: 'bg-red-500/80',
    },
    muted: {
        dot: 'bg-zinc-500',
        text: 'text-zinc-400',
        soft: 'border-white/[0.08] bg-white/[0.03]',
        bar: 'bg-zinc-600',
    },
} as const;

export const COMPONENT_STATUS: Record<ComponentStatus, Tone> = {
    OPERATIONAL: { label: 'Operational', ...TONES.ok },
    UNDER_MAINTENANCE: { label: 'Maintenance', ...TONES.info },
    DEGRADED_PERFORMANCE: { label: 'Degraded', ...TONES.warn },
    PARTIAL_OUTAGE: { label: 'Partial outage', ...TONES.high },
    MAJOR_OUTAGE: { label: 'Major outage', ...TONES.crit },
};

export const INCIDENT_STATUS: Record<IncidentStatus, Tone> = {
    INVESTIGATING: { label: 'Investigating', ...TONES.crit },
    IDENTIFIED: { label: 'Identified', ...TONES.high },
    MONITORING: { label: 'Monitoring', ...TONES.info },
    RESOLVED: { label: 'Resolved', ...TONES.ok },
};

export const MAINTENANCE_STATUS: Record<MaintenanceStatus, Tone> = {
    NOT_STARTED_YET: { label: 'Scheduled', ...TONES.muted },
    IN_PROGRESS: { label: 'In progress', ...TONES.info },
    COMPLETED: { label: 'Completed', ...TONES.ok },
};

export const INDICATOR: Record<Indicator, Tone & { title: string; subtitle: string }> = {
    NONE: {
        label: 'Operational',
        title: 'All systems operational',
        subtitle: 'Every Emberly service is running normally.',
        ...TONES.ok,
    },
    MINOR: {
        label: 'Degraded',
        title: 'Minor service degradation',
        subtitle: 'Some services are slower than usual or under maintenance.',
        ...TONES.warn,
    },
    MAJOR: {
        label: 'Partial outage',
        title: 'Partial service disruption',
        subtitle: 'Some services are currently unavailable. We are working on it.',
        ...TONES.high,
    },
    CRITICAL: {
        label: 'Major outage',
        title: 'Major service disruption',
        subtitle: 'Core services are unavailable. We are working on a fix.',
        ...TONES.crit,
    },
};

export const IMPACT: Record<Impact, Tone> = {
    none: { label: 'No impact', ...TONES.muted },
    minor: { label: 'Minor', ...TONES.warn },
    major: { label: 'Major', ...TONES.high },
    critical: { label: 'Critical', ...TONES.crit },
};

export const componentTone = (s: string): Tone =>
    COMPONENT_STATUS[s as ComponentStatus] ?? { label: s, ...TONES.muted };
export const incidentTone = (s: string): Tone => INCIDENT_STATUS[s as IncidentStatus] ?? { label: s, ...TONES.muted };
export const maintenanceTone = (s: string): Tone =>
    MAINTENANCE_STATUS[s as MaintenanceStatus] ?? { label: s, ...TONES.muted };
export const impactTone = (s: string): Tone => IMPACT[s.toLowerCase() as Impact] ?? IMPACT.none;

export const SEVERITY: ComponentStatus[] = [
    'OPERATIONAL',
    'UNDER_MAINTENANCE',
    'DEGRADED_PERFORMANCE',
    'PARTIAL_OUTAGE',
    'MAJOR_OUTAGE',
];

export function worstStatus(statuses: string[]): ComponentStatus {
    let worst = 0;
    for (const s of statuses) worst = Math.max(worst, SEVERITY.indexOf(s as ComponentStatus));
    return SEVERITY[worst];
}

export function uptimeTone(pct: number): string {
    if (pct >= 99.9) return 'text-emerald-400';
    if (pct >= 99) return 'text-zinc-300';
    if (pct >= 95) return 'text-amber-400';
    return 'text-red-400';
}

export function formatUptime(pct: number): string {
    if (pct >= 100) return '100%';
    return `${pct.toFixed(pct >= 99.99 ? 3 : 2)}%`;
}

export function formatDuration(start: Date | string, end: Date | string | null): string {
    const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
    const mins = Math.max(0, Math.floor(ms / 60_000));
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return mins % 60 ? `${hrs}h ${mins % 60}m` : `${hrs}h`;
    return hrs % 24 ? `${Math.floor(hrs / 24)}d ${hrs % 24}h` : `${Math.floor(hrs / 24)}d`;
}

export function timeAgo(date: Date | string, now = Date.now()): string {
    const diff = now - new Date(date).getTime();
    const future = diff < 0;
    const s = Math.abs(diff) / 1000;
    const fmt = (n: number, unit: string) => (future ? `in ${n}${unit}` : `${n}${unit} ago`);
    if (s < 45) return future ? 'in a moment' : 'just now';
    if (s < 3600) return fmt(Math.round(s / 60), 'm');
    if (s < 86_400) return fmt(Math.round(s / 3600), 'h');
    if (s < 86_400 * 30) return fmt(Math.round(s / 86_400), 'd');
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function componentPath(name: string, groupName: string | null | undefined): string {
    return groupName ? `${groupName} · ${name}` : name;
}
