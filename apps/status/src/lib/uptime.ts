export interface DowntimeWindow {
    from: number;
    to: number;
}

export interface DowntimeIncident {
    id: string;
    name: string;
    status: string;
    from: string;
    to: string | null;
}

export interface HistoryBucket {
    start: number;
    end: number;
    uptime: number;
    status: string;
    incidents: { id: string; name: string }[];
}

// Time-based uptime: assume 100% for the full range, subtract incident
// windows. This means the service is assumed to have been operational
// before monitoring/incident-tracking started. Shared between the status
// summary, the per-component detail route, the sitewide stats route and the
// client-side uptime bars so every surface reports the same number.
export function computeTimeBasedUptime(rangeMs: number, incidentWindows: DowntimeWindow[], now = Date.now()): number {
    if (!incidentWindows.length) return 100;
    const badMs = downtimeWithin(now - rangeMs, now, incidentWindows);
    return Math.round(((rangeMs - badMs) / rangeMs) * 10000) / 100;
}

function downtimeWithin(start: number, end: number, windows: DowntimeWindow[]): number {
    const clamped = windows
        .map((w) => ({ from: Math.max(w.from, start), to: Math.min(w.to, end) }))
        .filter((w) => w.from < w.to)
        .sort((a, b) => a.from - b.from);
    let total = 0;
    let curFrom = -1;
    let curTo = -1;
    for (const w of clamped) {
        if (curTo >= 0 && w.from <= curTo) {
            curTo = Math.max(curTo, w.to);
        } else {
            if (curTo >= 0) total += curTo - curFrom;
            curFrom = w.from;
            curTo = w.to;
        }
    }
    if (curTo >= 0) total += curTo - curFrom;
    return total;
}

const SEVERITY = ['OPERATIONAL', 'UNDER_MAINTENANCE', 'DEGRADED_PERFORMANCE', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE'];

export function toWindows(incidents: DowntimeIncident[], now = Date.now()): DowntimeWindow[] {
    return incidents.map((i) => ({ from: new Date(i.from).getTime(), to: i.to ? new Date(i.to).getTime() : now }));
}

export function buildHistory(
    incidents: DowntimeIncident[],
    count: number,
    unit: 'day' | 'hour',
    now = Date.now(),
): HistoryBucket[] {
    const windows = toWindows(incidents, now);
    const anchor = new Date(now);
    if (unit === 'day') anchor.setHours(0, 0, 0, 0);
    else anchor.setMinutes(0, 0, 0);

    const buckets: HistoryBucket[] = [];
    for (let i = count - 1; i >= 0; i--) {
        const s = new Date(anchor);
        const e = new Date(anchor);
        if (unit === 'day') {
            s.setDate(s.getDate() - i);
            e.setDate(e.getDate() - i + 1);
        } else {
            s.setHours(s.getHours() - i);
            e.setHours(e.getHours() - i + 1);
        }
        const start = s.getTime();
        const end = Math.min(e.getTime(), now);
        const span = Math.max(end - start, 1);
        const hits = incidents.filter((_, idx) => windows[idx].from < end && windows[idx].to > start);
        const status = hits.reduce(
            (worst, h) => (SEVERITY.indexOf(h.status) > SEVERITY.indexOf(worst) ? h.status : worst),
            'OPERATIONAL',
        );
        const down = downtimeWithin(start, end, windows);
        buckets.push({
            start,
            end,
            uptime: Math.round(((span - down) / span) * 10000) / 100,
            status,
            incidents: hits.map((h) => ({ id: h.id, name: h.name })),
        });
    }
    return buckets;
}
