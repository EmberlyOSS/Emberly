'use client';

import { useEffect, useState } from 'react';

type SubscriberEvent = 'INCIDENT_CREATED' | 'INCIDENT_UPDATED' | 'INCIDENT_RESOLVED' | 'MAINTENANCE_SCHEDULED' | 'MAINTENANCE_UPDATED';

const EVENT_OPTIONS: { value: SubscriberEvent; label: string }[] = [
    { value: 'INCIDENT_CREATED', label: 'New incidents' },
    { value: 'INCIDENT_UPDATED', label: 'Incident updates' },
    { value: 'INCIDENT_RESOLVED', label: 'Incidents resolved' },
    { value: 'MAINTENANCE_SCHEDULED', label: 'Scheduled maintenance' },
    { value: 'MAINTENANCE_UPDATED', label: 'Maintenance updates' },
];

interface StatusComponentLite {
    id: string;
    name: string;
    groupId: string | null;
}

interface StatusGroupLite {
    id: string;
    name: string;
    components: StatusComponentLite[];
    children: StatusGroupLite[];
}

interface Subscriber {
    id: string;
    verified: boolean;
    events: SubscriberEvent[];
    components: { id: string; name: string }[];
    groups: { id: string; name: string }[];
    createdAt: string;
}

function ScopePicker({
    groups,
    ungrouped,
    selectedGroupIds,
    selectedComponentIds,
    toggleGroup,
    toggleComponent,
    depth = 0,
}: {
    groups: StatusGroupLite[];
    ungrouped: StatusComponentLite[];
    selectedGroupIds: Set<string>;
    selectedComponentIds: Set<string>;
    toggleGroup: (id: string) => void;
    toggleComponent: (id: string) => void;
    depth?: number;
}) {
    return (
        <div className="space-y-1" style={{ marginLeft: depth ? 12 : 0 }}>
            {groups.map((g) => (
                <div key={g.id}>
                    <label className="flex items-center gap-2 py-1 cursor-pointer">
                        <input type="checkbox" checked={selectedGroupIds.has(g.id)} onChange={() => toggleGroup(g.id)} className="accent-white" />
                        <span className="text-xs text-[#a8a29e]">{g.name}</span>
                    </label>
                    <div className="ml-4 space-y-1">
                        {g.components.map((c) => (
                            <label key={c.id} className="flex items-center gap-2 py-0.5 cursor-pointer">
                                <input type="checkbox" checked={selectedComponentIds.has(c.id)} onChange={() => toggleComponent(c.id)} className="accent-white" />
                                <span className="text-[11px] text-[#78716c]">{c.name}</span>
                            </label>
                        ))}
                        {g.children.length > 0 && (
                            <ScopePicker
                                groups={g.children}
                                ungrouped={[]}
                                selectedGroupIds={selectedGroupIds}
                                selectedComponentIds={selectedComponentIds}
                                toggleGroup={toggleGroup}
                                toggleComponent={toggleComponent}
                                depth={depth + 1}
                            />
                        )}
                    </div>
                </div>
            ))}
            {ungrouped.map((c) => (
                <label key={c.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="checkbox" checked={selectedComponentIds.has(c.id)} onChange={() => toggleComponent(c.id)} className="accent-white" />
                    <span className="text-xs text-[#a8a29e]">{c.name}</span>
                </label>
            ))}
        </div>
    );
}

export default function DashboardSubscriptionsPage() {
    const [loading, setLoading] = useState(true);
    const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
    const [groups, setGroups] = useState<StatusGroupLite[]>([]);
    const [ungrouped, setUngrouped] = useState<StatusComponentLite[]>([]);
    const [showScope, setShowScope] = useState(false);

    const [selectedEvents, setSelectedEvents] = useState<Set<SubscriberEvent>>(new Set(EVENT_OPTIONS.map((o) => o.value)));
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
    const [selectedComponentIds, setSelectedComponentIds] = useState<Set<string>>(new Set());

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/status/subscribe').then((r) => (r.ok ? r.json() : { subscriber: null })),
            fetch('/api/status').then((r) => (r.ok ? r.json() : { groups: [], components: [] })),
        ]).then(([subData, statusData]) => {
            setGroups(statusData.groups ?? []);
            setUngrouped((statusData.components ?? []).filter((c: StatusComponentLite) => !c.groupId));
            if (subData.subscriber) {
                const sub: Subscriber = subData.subscriber;
                setSubscriber(sub);
                setSelectedEvents(new Set(sub.events));
                setSelectedGroupIds(new Set(sub.groups.map((g) => g.id)));
                setSelectedComponentIds(new Set(sub.components.map((c) => c.id)));
            }
            setLoading(false);
        });
    }, []);

    function toggleEvent(value: SubscriberEvent) {
        setSelectedEvents((prev) => {
            const next = new Set(prev);
            if (next.has(value)) next.delete(value);
            else next.add(value);
            return next;
        });
    }

    function toggleGroup(id: string) {
        setSelectedGroupIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleComponent(id: string) {
        setSelectedComponentIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setMessage(null);
        try {
            const res = await fetch('/api/status/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    events: Array.from(selectedEvents),
                    groupIds: Array.from(selectedGroupIds),
                    componentIds: Array.from(selectedComponentIds),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message ?? 'Preferences saved.');
                setSubscriber((prev) =>
                    prev
                        ? { ...prev, events: Array.from(selectedEvents) }
                        : {
                              id: 'pending',
                              verified: false,
                              events: Array.from(selectedEvents),
                              components: [],
                              groups: [],
                              createdAt: new Date().toISOString(),
                          },
                );
            } else {
                setError(data.error ?? 'Something went wrong.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    async function handleUnsubscribe() {
        setSaving(true);
        setError(null);
        setMessage(null);
        try {
            const res = await fetch('/api/status/subscribe', { method: 'DELETE' });
            if (res.ok) {
                setSubscriber(null);
                setSelectedGroupIds(new Set());
                setSelectedComponentIds(new Set());
                setMessage('Unsubscribed.');
            } else {
                const data = await res.json();
                setError(data.error ?? 'Something went wrong.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-white/[0.1] border-t-white animate-spin" />
                <p className="text-sm text-[#78716c]">Loading your subscription...</p>
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-medium text-white">Status alerts</h2>
                {subscriber && (
                    <span className={`text-xs px-2 py-1 rounded-md border ${subscriber.verified ? 'border-emerald-500/20 text-emerald-400' : 'border-yellow-400/20 text-yellow-400'}`}>
                        {subscriber.verified ? 'Confirmed' : 'Pending confirmation'}
                    </span>
                )}
            </div>

            {!subscriber?.verified && subscriber && (
                <p className="text-xs text-[#a8a29e] mb-4 leading-relaxed">
                    We sent a confirmation email. Click the link in it to start receiving alerts.
                </p>
            )}

            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <p className="text-xs font-medium text-white mb-2">Notify me about</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
                        {EVENT_OPTIONS.map((opt) => (
                            <label key={opt.value} className="flex items-center gap-2 py-0.5 cursor-pointer">
                                <input type="checkbox" checked={selectedEvents.has(opt.value)} onChange={() => toggleEvent(opt.value)} className="accent-white" />
                                <span className="text-xs text-[#a8a29e]">{opt.label}</span>
                            </label>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowScope((v) => !v)}
                        className="text-xs text-[#78716c] hover:text-white transition-colors underline underline-offset-2"
                    >
                        {showScope ? 'Hide' : 'Only for specific services'}
                    </button>

                    {showScope && (groups.length > 0 || ungrouped.length > 0) && (
                        <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-white/[0.08] p-3">
                            <p className="text-[10px] text-[#57534e] mb-2">
                                Leave everything unchecked to be notified about all services.
                            </p>
                            <ScopePicker
                                groups={groups}
                                ungrouped={ungrouped}
                                selectedGroupIds={selectedGroupIds}
                                selectedComponentIds={selectedComponentIds}
                                toggleGroup={toggleGroup}
                                toggleComponent={toggleComponent}
                            />
                        </div>
                    )}
                </div>

                {message && <p className="text-xs text-emerald-400">{message}</p>}
                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#F97316] text-[#140b05] font-semibold text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#EA580C] transition-colors disabled:opacity-50"
                    >
                        {saving ? '...' : subscriber ? 'Save preferences' : 'Subscribe'}
                    </button>
                    {subscriber && (
                        <button
                            type="button"
                            onClick={handleUnsubscribe}
                            disabled={saving}
                            className="text-sm text-[#78716c] hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                            Unsubscribe
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
