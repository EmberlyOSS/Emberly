'use client';

import { Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { type RowAction, RowActions } from '@/components/admin/RowActions';
import DashboardLayout from '@/components/layouts/dashboard/DashboardLayout';
import { SITE } from '@/lib/site';

type MonitorType = 'HTTP' | 'PING' | 'TCP';
type MonitorStatus = 'ACTIVE' | 'PAUSED' | 'UP' | 'DOWN' | 'DEGRADED';

interface StatusComponent {
    id: string;
    name: string;
    group: { id: string; name: string } | null;
}

interface MonitorCheck {
    id: string;
    result: 'UP' | 'DOWN' | 'DEGRADED';
    responseMs: number | null;
    checkedAt: string;
}

interface Monitor {
    id: string;
    name: string;
    type: MonitorType;
    target: string;
    port: number | null;
    interval: number;
    timeout: number;
    status: MonitorStatus;
    lastStatus: 'UP' | 'DOWN' | 'DEGRADED' | null;
    lastResponseMs: number | null;
    lastCheckedAt: string | null;
    componentId: string | null;
    component: { id: string; name: string; group: { id: string; name: string } | null } | null;
    checks: MonitorCheck[];
    headers: Record<string, string> | null;
    expectedStatusCodes: number[];
    expectedBodyContains: string | null;
    bodyMatchType: BodyMatchType;
    expectedBodyValue: string | null;
}

type BodyMatchType = 'NONE' | 'CONTAINS' | 'REGEX' | 'JSON_PATH';

const BODY_MATCH_OPTIONS: { value: BodyMatchType; label: string; placeholder: string; help: string }[] = [
    { value: 'NONE', label: 'None (status code only)', placeholder: '', help: '' },
    {
        value: 'CONTAINS',
        label: 'Body contains (text or JSON fragment)',
        placeholder: 'e.g. "status":"ok"',
        help: 'Response body must include this text.',
    },
    {
        value: 'REGEX',
        label: 'Body matches regex',
        placeholder: 'e.g. "status"\\s*:\\s*"ok"',
        help: 'Response body must match this pattern.',
    },
    {
        value: 'JSON_PATH',
        label: 'JSON field equals',
        placeholder: 'e.g. data.status',
        help: 'Dot-path into the JSON response body, checked against the value below.',
    },
];

interface HeaderRow {
    id: string;
    key: string;
    value: string;
}

let headerRowSeq = 0;
function newHeaderRowId() {
    headerRowSeq += 1;
    return `hr-${headerRowSeq}`;
}

function headersToRows(headers: Record<string, string> | null | undefined): HeaderRow[] {
    return headers ? Object.entries(headers).map(([key, value]) => ({ id: newHeaderRowId(), key, value })) : [];
}

function rowsToHeaders(rows: HeaderRow[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const row of rows) {
        if (row.key.trim()) out[row.key.trim()] = row.value;
    }
    return out;
}

// Empty segments must be dropped before Number(): Number('') is 0, not NaN,
// so a blank field would otherwise silently become "expect status 0".
function parseStatusCodes(input: string): number[] {
    return input
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => Number.isInteger(n));
}

const TYPE_OPTIONS: { value: MonitorType; label: string }[] = [
    { value: 'HTTP', label: 'HTTP' },
    { value: 'PING', label: 'PING' },
    { value: 'TCP', label: 'TCP' },
];

const statusDot: Record<string, string> = {
    UP: 'bg-green-400',
    DOWN: 'bg-red-400',
    DEGRADED: 'bg-yellow-400',
};

const typeLabel: Record<MonitorType, string> = {
    HTTP: 'HTTP',
    PING: 'PING',
    TCP: 'TCP',
};

function timeAgo(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.round(diff)}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    return `${Math.round(diff / 3600)}h ago`;
}

type MonitorFormValues = {
    name: string;
    type: MonitorType;
    target: string;
    port: string;
    interval: string;
    timeout: string;
    componentId: string;
    headers: HeaderRow[];
    expectedStatusCodes: string;
    bodyMatchType: BodyMatchType;
    expectedBodyContains: string;
    expectedBodyValue: string;
};

interface MonitorPreset {
    key: string;
    label: string;
    help: string;
    apply: (f: MonitorFormValues) => MonitorFormValues;
}

// Presets scaffold the generic HTTP check fields for Emberly's own health
// endpoint rather than adding dedicated monitor types: under the hood they're
// still plain HTTP monitors with a JSON field check. Emberly wraps its health
// payload in { data: … }, hence the data. prefix on every path.
const healthCheck = (path: string, expected: string) => (f: MonitorFormValues): MonitorFormValues => ({
    ...f,
    type: 'HTTP',
    target: `${SITE.appUrl}/api/health`,
    port: '',
    headers: [],
    expectedStatusCodes: '',
    bodyMatchType: 'JSON_PATH',
    expectedBodyContains: path,
    expectedBodyValue: expected,
});

const MONITOR_PRESETS: MonitorPreset[] = [
    { key: 'CUSTOM', label: 'Custom / generic', help: '', apply: (f) => f },
    {
        key: 'EMBERLY_HEALTH',
        label: 'Emberly: overall health',
        help: 'Up only when every Emberly subsystem reports healthy. Degraded subsystems (Redis, storage, jobs) also mark this down.',
        apply: healthCheck('data.status', 'ok'),
    },
    {
        key: 'EMBERLY_DATABASE',
        label: 'Emberly: database',
        help: 'PostgreSQL reachability as reported by Emberly.',
        apply: healthCheck('data.checks.database.status', 'up'),
    },
    {
        key: 'EMBERLY_REDIS',
        label: 'Emberly: Redis',
        help: 'Redis (cache, sessions, rate limits and the job queue).',
        apply: healthCheck('data.checks.redis.status', 'up'),
    },
    {
        key: 'EMBERLY_STORAGE',
        label: 'Emberly: file storage',
        help: 'A real write and delete against the active storage provider (cached for 30s on Emberly’s side).',
        apply: healthCheck('data.checks.storage.status', 'up'),
    },
    {
        key: 'EMBERLY_JOBS',
        label: 'Emberly: background jobs',
        help: 'The BullMQ event queue and worker. Reports "disabled" if the worker runs in a different process from the one answering.',
        apply: healthCheck('data.checks.eventQueue.status', 'up'),
    },
];

const emptyCreate: MonitorFormValues = {
    name: '',
    type: 'HTTP' as MonitorType,
    target: '',
    port: '',
    interval: '60',
    timeout: '60',
    componentId: '',
    headers: [] as HeaderRow[],
    expectedStatusCodes: '',
    bodyMatchType: 'NONE' as BodyMatchType,
    expectedBodyContains: '',
    expectedBodyValue: '',
};

function MonitorForm({
    form,
    setForm,
    onSubmit,
    submitting,
    submitLabel,
    onCancel,
    components,
}: {
    form: typeof emptyCreate;
    setForm: React.Dispatch<React.SetStateAction<typeof emptyCreate>>;
    onSubmit: (e: React.FormEvent) => void;
    submitting: boolean;
    submitLabel: string;
    onCancel: () => void;
    components: StatusComponent[];
}) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [preset, setPreset] = useState('CUSTOM');

    function applyPreset(key: string) {
        setPreset(key);
        const found = MONITOR_PRESETS.find((p) => p.key === key);
        if (!found) return;
        setForm((f) => found.apply(f));
        if (key !== 'CUSTOM') setShowAdvanced(true);
    }

    function updateHeaderRow(index: number, patch: Partial<HeaderRow>) {
        setForm((f) => ({ ...f, headers: f.headers.map((row, i) => (i === index ? { ...row, ...patch } : row)) }));
    }
    function addHeaderRow() {
        setForm((f) => ({ ...f, headers: [...f.headers, { id: newHeaderRowId(), key: '', value: '' }] }));
    }
    function removeHeaderRow(index: number) {
        setForm((f) => ({ ...f, headers: f.headers.filter((_, i) => i !== index) }));
    }
    return (
        <form onSubmit={onSubmit} className="p-5 space-y-4 overflow-y-auto">
            <div>
                <label className="block text-xs text-[#78716c] mb-1.5">
                    Preset <span className="text-[#57534e]">(optional: scaffolds fields below)</span>
                </label>
                <select
                    value={preset}
                    onChange={(e) => applyPreset(e.target.value)}
                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                >
                    {MONITOR_PRESETS.map((p) => (
                        <option key={p.key} value={p.key}>
                            {p.label}
                        </option>
                    ))}
                </select>
                {MONITOR_PRESETS.find((p) => p.key === preset)?.help && (
                    <p className="text-[10px] text-[#57534e] mt-1.5">
                        {MONITOR_PRESETS.find((p) => p.key === preset)?.help}
                    </p>
                )}
            </div>
            <div>
                <label className="block text-xs text-[#78716c] mb-1.5">Name</label>
                <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. API Gateway"
                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-[#78716c] mb-1.5">Type</label>
                    <select
                        value={form.type}
                        onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as MonitorType }))}
                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                    >
                        {TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
                {form.type === 'TCP' ? (
                    <div>
                        <label className="block text-xs text-[#78716c] mb-1.5">Port</label>
                        <input
                            type="number"
                            min={1}
                            max={65535}
                            required
                            value={form.port}
                            onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                            placeholder="443"
                            className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                        />
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs text-[#78716c] mb-1.5">Interval (s)</label>
                        <input
                            type="number"
                            min={30}
                            required
                            value={form.interval}
                            onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value }))}
                            className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                        />
                    </div>
                )}
            </div>
            <div>
                <label className="block text-xs text-[#78716c] mb-1.5">
                    Target {form.type === 'HTTP' ? 'URL' : 'Host'}
                </label>
                <input
                    type="text"
                    required
                    value={form.target}
                    onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                    placeholder={form.type === 'HTTP' ? 'https://api.example.com/health' : 'example.com'}
                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                />
            </div>
            {form.type === 'TCP' && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-[#78716c] mb-1.5">Interval (s)</label>
                        <input
                            type="number"
                            min={30}
                            required
                            value={form.interval}
                            onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value }))}
                            className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-[#78716c] mb-1.5">Timeout (s)</label>
                        <input
                            type="number"
                            min={5}
                            required
                            value={form.timeout}
                            onChange={(e) => setForm((f) => ({ ...f, timeout: e.target.value }))}
                            className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                        />
                    </div>
                </div>
            )}
            {form.type !== 'TCP' && (
                <div>
                    <label className="block text-xs text-[#78716c] mb-1.5">Timeout (s)</label>
                    <input
                        type="number"
                        min={5}
                        required
                        value={form.timeout}
                        onChange={(e) => setForm((f) => ({ ...f, timeout: e.target.value }))}
                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                    />
                </div>
            )}
            {(form.type === 'HTTP' || form.type === 'TCP') && (
                <div>
                    <button
                        type="button"
                        onClick={() => setShowAdvanced((v) => !v)}
                        className="text-xs text-[#78716c] hover:text-white transition-colors underline underline-offset-2"
                    >
                        {showAdvanced
                            ? 'Hide advanced options'
                            : form.type === 'HTTP'
                              ? 'Advanced options (headers, expected response)'
                              : 'Advanced options (expected response)'}
                    </button>

                    {showAdvanced && (
                        <div className="mt-3 space-y-3 border border-white/[0.08] rounded-lg p-3">
                            {form.type === 'HTTP' && (
                                <>
                                    <div>
                                        <label className="block text-xs text-[#78716c] mb-1.5">
                                            Request headers{' '}
                                            <span className="text-[#57534e]">(e.g. Authorization: Bearer …)</span>
                                        </label>
                                        <div className="space-y-2">
                                            {form.headers.map((row, i) => (
                                                <div key={row.id} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={row.key}
                                                        onChange={(e) => updateHeaderRow(i, { key: e.target.value })}
                                                        placeholder="Authorization"
                                                        className="flex-1 min-w-0 bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={row.value}
                                                        onChange={(e) => updateHeaderRow(i, { value: e.target.value })}
                                                        placeholder="Bearer xxxxxxxx"
                                                        className="flex-1 min-w-0 bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeHeaderRow(i)}
                                                        className="px-2 text-[#78716c] hover:text-red-400 transition-colors shrink-0"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addHeaderRow}
                                            className="mt-2 text-xs text-[#78716c] hover:text-white transition-colors underline underline-offset-2"
                                        >
                                            + Add header
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-[#78716c] mb-1.5">
                                            Expected status code(s){' '}
                                            <span className="text-[#57534e]">
                                                (optional: comma separated, e.g. 200, 201, 204)
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.expectedStatusCodes}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, expectedStatusCodes: e.target.value }))
                                            }
                                            placeholder="Defaults to any 2xx/3xx"
                                            className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">
                                    Expected {form.type === 'TCP' ? 'response / banner' : 'response body'}{' '}
                                    <span className="text-[#57534e]">(optional)</span>
                                </label>
                                <select
                                    value={form.bodyMatchType}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, bodyMatchType: e.target.value as BodyMatchType }))
                                    }
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 mb-2"
                                >
                                    {BODY_MATCH_OPTIONS.filter((o) =>
                                        form.type === 'TCP' ? o.value !== 'JSON_PATH' : true,
                                    ).map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>

                                {form.bodyMatchType !== 'NONE' && (
                                    <>
                                        <input
                                            type="text"
                                            value={form.expectedBodyContains}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, expectedBodyContains: e.target.value }))
                                            }
                                            placeholder={
                                                form.type === 'TCP'
                                                    ? 'e.g. 220 (SMTP greeting)'
                                                    : BODY_MATCH_OPTIONS.find((o) => o.value === form.bodyMatchType)
                                                          ?.placeholder
                                            }
                                            className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                                        />
                                        {form.bodyMatchType === 'JSON_PATH' && (
                                            <input
                                                type="text"
                                                value={form.expectedBodyValue}
                                                onChange={(e) =>
                                                    setForm((f) => ({ ...f, expectedBodyValue: e.target.value }))
                                                }
                                                placeholder="Expected value at that path, e.g. ok"
                                                className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c] mt-2"
                                            />
                                        )}
                                        <p className="text-[10px] text-[#57534e] mt-1">
                                            {form.type === 'TCP'
                                                ? 'After connecting, the monitor waits for the server’s first response (e.g. an SMTP "220" greeting) and checks it against this pattern.'
                                                : `${BODY_MATCH_OPTIONS.find((o) => o.value === form.bodyMatchType)?.help} The monitor fetches the full response body (instead of a lightweight HEAD request) to check it.`}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div>
                <label className="block text-xs text-[#78716c] mb-1.5">
                    Linked component <span className="text-[#57534e]">(optional)</span>
                </label>
                <select
                    value={form.componentId}
                    onChange={(e) => setForm((f) => ({ ...f, componentId: e.target.value }))}
                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                >
                    <option value="">None</option>
                    {components.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.group ? `${c.name} (${c.group.name})` : c.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex gap-2 pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-2 text-sm border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 text-sm bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] disabled:opacity-50 transition-colors"
                >
                    {submitting ? 'Saving…' : submitLabel}
                </button>
            </div>
        </form>
    );
}

export default function AdminMonitorsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [monitors, setMonitors] = useState<Monitor[]>([]);
    const [components, setComponents] = useState<StatusComponent[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState(emptyCreate);
    const [creating, setCreating] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
    const [editForm, setEditForm] = useState(emptyCreate);
    const [editing, setEditing] = useState(false);

    const [toggling, setToggling] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    function toggleGroupCollapse(key: string) {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    const fetchMonitors = useCallback(async () => {
        try {
            const [mRes, cRes] = await Promise.all([fetch('/api/admin/monitors'), fetch('/api/admin/components')]);
            const [mData, cData] = await Promise.all([mRes.json(), cRes.json()]);
            if (Array.isArray(mData)) setMonitors(mData);
            if (Array.isArray(cData)) setComponents(cData);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMINISTRATOR';
            if (!isAdmin) {
                router.push('/dashboard');
                return;
            }
            fetchMonitors();
        }
    }, [session, status, router, fetchMonitors]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const body: Record<string, unknown> = {
                name: createForm.name,
                type: createForm.type,
                target: createForm.target,
                interval: Number(createForm.interval),
                timeout: Number(createForm.timeout),
                componentId: createForm.componentId || null,
            };
            if (createForm.type === 'TCP' && createForm.port) body.port = Number(createForm.port);
            if (createForm.type === 'HTTP') {
                body.headers = rowsToHeaders(createForm.headers);
                body.expectedStatusCodes = parseStatusCodes(createForm.expectedStatusCodes);
            }
            if (createForm.type === 'HTTP' || createForm.type === 'TCP') {
                body.expectedBodyContains = createForm.expectedBodyContains || null;
                body.bodyMatchType = createForm.expectedBodyContains ? createForm.bodyMatchType : 'NONE';
                body.expectedBodyValue =
                    createForm.bodyMatchType === 'JSON_PATH' ? createForm.expectedBodyValue || null : null;
            }
            const res = await fetch('/api/admin/monitors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to create');
            toast.success('Monitor created');
            setShowCreateModal(false);
            fetchMonitors();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create');
        } finally {
            setCreating(false);
        }
    };

    const openEditModal = (m: Monitor) => {
        setSelectedMonitor(m);
        setEditForm({
            name: m.name,
            type: m.type,
            target: m.target,
            port: m.port?.toString() ?? '',
            interval: m.interval.toString(),
            timeout: m.timeout.toString(),
            componentId: m.componentId ?? '',
            headers: headersToRows(m.headers),
            expectedStatusCodes: m.expectedStatusCodes?.join(', ') ?? '',
            bodyMatchType: m.bodyMatchType ?? 'NONE',
            expectedBodyContains: m.expectedBodyContains ?? '',
            expectedBodyValue: m.expectedBodyValue ?? '',
        });
        setShowEditModal(true);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMonitor) return;
        setEditing(true);
        try {
            const body: Record<string, unknown> = {
                name: editForm.name,
                type: editForm.type,
                target: editForm.target,
                interval: Number(editForm.interval),
                timeout: Number(editForm.timeout),
                port: editForm.port ? Number(editForm.port) : null,
                componentId: editForm.componentId || null,
            };
            if (editForm.type === 'HTTP') {
                body.headers = rowsToHeaders(editForm.headers);
                body.expectedStatusCodes = parseStatusCodes(editForm.expectedStatusCodes);
            }
            if (editForm.type === 'HTTP' || editForm.type === 'TCP') {
                body.expectedBodyContains = editForm.expectedBodyContains || null;
                body.bodyMatchType = editForm.expectedBodyContains ? editForm.bodyMatchType : 'NONE';
                body.expectedBodyValue =
                    editForm.bodyMatchType === 'JSON_PATH' ? editForm.expectedBodyValue || null : null;
            }
            const res = await fetch(`/api/admin/monitors/${selectedMonitor.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to update');
            toast.success('Monitor updated');
            setShowEditModal(false);
            fetchMonitors();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update');
        } finally {
            setEditing(false);
        }
    };

    const handleToggle = async (m: Monitor) => {
        setToggling(m.id);
        try {
            const newStatus = m.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
            const res = await fetch(`/api/admin/monitors/${m.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error();
            fetchMonitors();
        } catch {
            toast.error('Failed to toggle monitor');
        } finally {
            setToggling(null);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        try {
            const res = await fetch(`/api/admin/monitors/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success('Monitor deleted');
            fetchMonitors();
        } catch {
            toast.error('Failed to delete monitor');
        } finally {
            setDeleting(null);
        }
    };

    const monitorActions = (m: Monitor): RowAction[] => [
        {
            label: m.status === 'PAUSED' ? 'Resume' : 'Pause',
            icon: m.status === 'PAUSED' ? Play : Pause,
            busy: toggling === m.id,
            onSelect: () => handleToggle(m),
        },
        { label: 'Edit', icon: Pencil, onSelect: () => openEditModal(m) },
        {
            label: 'Delete',
            icon: Trash2,
            destructive: true,
            busy: deleting === m.id,
            onSelect: () => handleDelete(m.id),
        },
    ];

    if (status === 'loading' || loading) {
        return (
            <DashboardLayout title="Monitors" description="HTTP, PING and TCP uptime monitors">
                <div className="flex items-center justify-center py-24">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const active = monitors.filter((m) => m.status !== 'PAUSED');
    const up = monitors.filter((m) => m.lastStatus === 'UP');
    const down = monitors.filter((m) => m.lastStatus === 'DOWN' || m.lastStatus === 'DEGRADED');

    // Group by the linked component's group: monitors with no component, or a
    // component with no group, fall into "Ungrouped" at the end.
    const groupMap = new Map<string, { key: string; name: string; monitors: Monitor[] }>();
    for (const m of monitors) {
        const group = m.component?.group;
        const key = group?.id ?? '__ungrouped';
        const name = group?.name ?? 'Ungrouped';
        if (!groupMap.has(key)) groupMap.set(key, { key, name, monitors: [] });
        groupMap.get(key)!.monitors.push(m);
    }
    const monitorGroups = [...groupMap.values()].sort((a, b) => {
        if (a.key === '__ungrouped') return 1;
        if (b.key === '__ungrouped') return -1;
        return a.name.localeCompare(b.name);
    });

    return (
        <DashboardLayout title="Monitors" description="HTTP, PING and TCP uptime monitors">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                {[
                    { label: 'Active monitors', value: active.length },
                    { label: 'Up', value: up.length },
                    { label: 'Down / Degraded', value: down.length },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="min-w-0 glass-card p-3 sm:p-5"
                    >
                        <p className="truncate text-xs text-zinc-400 mb-1">{s.label}</p>
                        <p className="text-xl sm:text-2xl font-semibold tabular-nums text-white">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium tracking-widest uppercase text-[#78716c]">Monitors</h2>
                <button
                    type="button"
                    onClick={() => {
                        setCreateForm(emptyCreate);
                        setShowCreateModal(true);
                    }}
                    className="px-3 py-1.5 text-xs bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] transition-colors"
                >
                    Add monitor
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                {monitors.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-[#78716c]">No monitors configured</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <table className="w-full hidden md:table">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#78716c]">Monitor</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#78716c]">Type</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#78716c]">Target</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#78716c]">
                                        Component
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#78716c]">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#78716c]">Response</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#78716c]">Checked</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {monitorGroups.map((group) => {
                                    const isCollapsed = collapsedGroups.has(group.key);
                                    return (
                                        <Fragment key={group.key}>
                                            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                                                <td colSpan={8} className="px-4 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleGroupCollapse(group.key)}
                                                        className="w-full flex items-center gap-2 text-left"
                                                    >
                                                        <svg
                                                            width="10"
                                                            height="10"
                                                            viewBox="0 0 12 12"
                                                            fill="none"
                                                            className={`text-[#78716c] transition-transform duration-150 shrink-0 ${isCollapsed ? '-rotate-90' : ''}`}
                                                            aria-hidden="true"
                                                        >
                                                            <path
                                                                d="M2 4l4 4 4-4"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                        <span className="text-xs font-medium text-white">
                                                            {group.name}
                                                        </span>
                                                        <span className="text-xs text-[#78716c]">
                                                            ({group.monitors.length})
                                                        </span>
                                                    </button>
                                                </td>
                                            </tr>
                                            {!isCollapsed &&
                                                group.monitors.map((m) => (
                                                    <tr
                                                        key={m.id}
                                                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2 pl-4">
                                                                {m.status === 'PAUSED' && (
                                                                    <span className="w-2 h-2 rounded-full bg-[#57534e] shrink-0" />
                                                                )}
                                                                {m.status !== 'PAUSED' && m.lastStatus && (
                                                                    <span
                                                                        className={`w-2 h-2 rounded-full shrink-0 ${statusDot[m.lastStatus]}`}
                                                                    />
                                                                )}
                                                                {m.status !== 'PAUSED' && !m.lastStatus && (
                                                                    <span className="w-2 h-2 rounded-full bg-[#44403c] shrink-0" />
                                                                )}
                                                                <span className="text-sm text-white">{m.name}</span>
                                                                {m.status === 'PAUSED' && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/[0.08] text-[#57534e]">
                                                                        Paused
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-[#78716c]">
                                                            {typeLabel[m.type]}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-[#57534e] font-mono max-w-[180px] truncate">
                                                            {m.target}
                                                            {m.port ? `:${m.port}` : ''}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-[#78716c]">
                                                            {m.component?.name ?? (
                                                                <span className="text-[#44403c]">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-[#78716c]">
                                                            {m.lastStatus ?? '—'}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-[#78716c]">
                                                            {m.lastResponseMs != null ? `${m.lastResponseMs}ms` : '—'}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-[#57534e]">
                                                            {m.lastCheckedAt ? timeAgo(m.lastCheckedAt) : '—'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-end">
                                                                <RowActions
                                                                    breakpoint="xl"
                                                                    label={`Actions for ${m.name}`}
                                                                    actions={monitorActions(m)}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Mobile cards */}
                        <div className="md:hidden">
                            {monitorGroups.map((group) => {
                                const isCollapsed = collapsedGroups.has(group.key);
                                return (
                                    <div key={group.key} className="border-b border-white/[0.04] last:border-0">
                                        <button
                                            type="button"
                                            onClick={() => toggleGroupCollapse(group.key)}
                                            className="w-full flex items-center gap-2 text-left px-4 py-2.5 bg-white/[0.02]"
                                        >
                                            <svg
                                                width="10"
                                                height="10"
                                                viewBox="0 0 12 12"
                                                fill="none"
                                                className={`text-[#78716c] transition-transform duration-150 shrink-0 ${isCollapsed ? '-rotate-90' : ''}`}
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M2 4l4 4 4-4"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            <span className="text-xs font-medium text-white">{group.name}</span>
                                            <span className="text-xs text-[#78716c]">({group.monitors.length})</span>
                                        </button>
                                        {!isCollapsed && (
                                            <div className="divide-y divide-white/[0.04]">
                                                {group.monitors.map((m) => (
                                                    <div key={m.id} className="p-4">
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                {m.lastStatus ? (
                                                                    <span
                                                                        className={`w-2 h-2 rounded-full shrink-0 ${m.status === 'PAUSED' ? 'bg-[#57534e]' : statusDot[m.lastStatus]}`}
                                                                    />
                                                                ) : (
                                                                    <span className="w-2 h-2 rounded-full bg-[#44403c] shrink-0" />
                                                                )}
                                                                <span className="text-sm text-white truncate">
                                                                    {m.name}
                                                                </span>
                                                                <span className="text-xs text-[#57534e]">
                                                                    {typeLabel[m.type]}
                                                                </span>
                                                            </div>
                                                            <RowActions
                                                                breakpoint="xl"
                                                                label={`Actions for ${m.name}`}
                                                                actions={monitorActions(m)}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-[#57534e] font-mono truncate">
                                                            {m.target}
                                                            {m.port ? `:${m.port}` : ''}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-[#44403c]">
                                                            {m.lastResponseMs != null && (
                                                                <span>{m.lastResponseMs}ms</span>
                                                            )}
                                                            {m.lastCheckedAt && <span>{timeAgo(m.lastCheckedAt)}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        className="w-full max-w-md glass-card overflow-hidden max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
                            <h3 className="text-sm font-medium text-white">Add Monitor</h3>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="text-[#78716c] hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <MonitorForm
                            form={createForm}
                            setForm={setCreateForm}
                            onSubmit={handleCreate}
                            submitting={creating}
                            submitLabel="Add monitor"
                            onCancel={() => setShowCreateModal(false)}
                            components={components}
                        />
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedMonitor && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowEditModal(false)}
                >
                    <div
                        className="w-full max-w-md glass-card overflow-hidden max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
                            <h3 className="text-sm font-medium text-white">Edit Monitor</h3>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="text-[#78716c] hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <MonitorForm
                            form={editForm}
                            setForm={setEditForm}
                            onSubmit={handleEdit}
                            submitting={editing}
                            submitLabel="Save changes"
                            onCancel={() => setShowEditModal(false)}
                            components={components}
                        />
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
