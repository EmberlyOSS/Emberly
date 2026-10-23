'use client';

import { ExternalLink, MessageSquarePlus, Pencil, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RowActions } from '@/components/admin/RowActions';
import DashboardLayout from '@/components/layouts/dashboard/DashboardLayout';

type IncidentStatus = 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
type ComponentStatus = 'OPERATIONAL' | 'DEGRADED_PERFORMANCE' | 'PARTIAL_OUTAGE' | 'MAJOR_OUTAGE' | 'UNDER_MAINTENANCE';

interface IncidentUpdate {
    id: string;
    body: string;
    status: IncidentStatus;
    createdAt: string;
}

interface IncidentComponentLink {
    componentId: string;
    status: ComponentStatus;
    component: { id: string; name: string; group: { id: string; name: string } | null };
}

interface Incident {
    id: string;
    name: string;
    status: IncidentStatus;
    impact: string;
    startedAt: string;
    resolvedAt: string | null;
    updates: IncidentUpdate[];
    components: IncidentComponentLink[];
    postmortemBody: string | null;
    postmortemPublishedAt: string | null;
}

interface AvailableComponent {
    id: string;
    name: string;
    status: ComponentStatus;
    group: { id: string; name: string } | null;
}

const STATUS_OPTIONS: { value: IncidentStatus; label: string }[] = [
    { value: 'INVESTIGATING', label: 'Investigating' },
    { value: 'IDENTIFIED', label: 'Identified' },
    { value: 'MONITORING', label: 'Monitoring' },
    { value: 'RESOLVED', label: 'Resolved' },
];

const COMPONENT_STATUS_OPTIONS: { value: ComponentStatus; label: string }[] = [
    { value: 'DEGRADED_PERFORMANCE', label: 'Degraded Performance' },
    { value: 'PARTIAL_OUTAGE', label: 'Partial Outage' },
    { value: 'MAJOR_OUTAGE', label: 'Major Outage' },
    { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
    { value: 'OPERATIONAL', label: 'Operational' },
];

const IMPACT_OPTIONS = ['none', 'minor', 'major', 'critical'];

const statusBadge: Record<IncidentStatus, string> = {
    INVESTIGATING: 'text-red-400',
    IDENTIFIED: 'text-orange-400',
    MONITORING: 'text-orange-400',
    RESOLVED: 'text-emerald-400',
};

const componentStatusColor: Record<ComponentStatus, string> = {
    OPERATIONAL: 'text-emerald-400',
    DEGRADED_PERFORMANCE: 'text-yellow-500',
    PARTIAL_OUTAGE: 'text-orange-500',
    MAJOR_OUTAGE: 'text-red-500',
    UNDER_MAINTENANCE: 'text-orange-400',
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

type AffectedComponent = { componentId: string; status: ComponentStatus };

export default function AdminIncidentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [availableComponents, setAvailableComponents] = useState<AvailableComponent[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        status: 'INVESTIGATING' as IncidentStatus,
        impact: 'minor',
        initialUpdate: '',
    });
    const [createComponents, setCreateComponents] = useState<AffectedComponent[]>([]);
    const [creating, setCreating] = useState(false);

    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [updateForm, setUpdateForm] = useState({ body: '', status: 'INVESTIGATING' as IncidentStatus });
    const [addingUpdate, setAddingUpdate] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        status: 'INVESTIGATING' as IncidentStatus,
        impact: 'minor',
        postmortemBody: '',
        postmortemPublished: false,
    });
    const [editComponents, setEditComponents] = useState<AffectedComponent[]>([]);
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [incRes, compRes] = await Promise.all([
                fetch('/api/admin/incidents'),
                fetch('/api/admin/components'),
            ]);
            const incData = await incRes.json();
            const compData = await compRes.json();
            if (Array.isArray(incData)) setIncidents(incData);
            if (Array.isArray(compData)) setAvailableComponents(compData);
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
            fetchData();
        }
    }, [session, status, router, fetchData]);

    function toggleComponent(
        componentId: string,
        list: AffectedComponent[],
        setList: (v: AffectedComponent[]) => void,
    ) {
        if (list.find((c) => c.componentId === componentId)) {
            setList(list.filter((c) => c.componentId !== componentId));
        } else {
            setList([...list, { componentId, status: 'DEGRADED_PERFORMANCE' }]);
        }
    }

    function setComponentStatus(
        componentId: string,
        s: ComponentStatus,
        list: AffectedComponent[],
        setList: (v: AffectedComponent[]) => void,
    ) {
        setList(list.map((c) => (c.componentId === componentId ? { ...c, status: s } : c)));
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/admin/incidents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: createForm.name,
                    status: createForm.status,
                    impact: createForm.impact,
                    initialUpdate: createForm.initialUpdate || undefined,
                    affectedComponents: createComponents,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to create');
            toast.success('Incident created and subscribers notified');
            setShowCreateModal(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create');
        } finally {
            setCreating(false);
        }
    };

    const openUpdateModal = (incident: Incident) => {
        setSelectedIncident(incident);
        setUpdateForm({ body: '', status: incident.status });
        setShowUpdateModal(true);
    };

    const handleAddUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIncident) return;
        setAddingUpdate(true);
        try {
            const res = await fetch(`/api/admin/incidents/${selectedIncident.id}/updates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updateBody: updateForm.body, status: updateForm.status }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to add update');
            toast.success('Update posted and subscribers notified');
            setShowUpdateModal(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add update');
        } finally {
            setAddingUpdate(false);
        }
    };

    const openEditModal = (incident: Incident) => {
        setSelectedIncident(incident);
        setEditForm({
            name: incident.name,
            status: incident.status,
            impact: incident.impact,
            postmortemBody: incident.postmortemBody ?? '',
            postmortemPublished: incident.postmortemPublishedAt !== null,
        });
        setEditComponents(incident.components.map((c) => ({ componentId: c.componentId, status: c.status })));
        setShowEditModal(true);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIncident) return;
        setEditing(true);
        try {
            const res = await fetch(`/api/admin/incidents/${selectedIncident.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editForm.name,
                    status: editForm.status,
                    impact: editForm.impact,
                    affectedComponents: editComponents,
                    postmortemBody: editForm.postmortemBody.trim() || null,
                    postmortemPublished: editForm.postmortemPublished,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to update');
            toast.success('Incident updated');
            setShowEditModal(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update');
        } finally {
            setEditing(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        try {
            const res = await fetch(`/api/admin/incidents/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Incident deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete incident');
        } finally {
            setDeleting(null);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <DashboardLayout title="Incidents" description="Manage active and past incidents">
                <div className="flex items-center justify-center py-24">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const active = incidents.filter((i) => i.status !== 'RESOLVED');
    const resolved = incidents.filter((i) => i.status === 'RESOLVED');

    return (
        <DashboardLayout title="Incidents" description="Manage active and past incidents">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                {[
                    { label: 'Total Incidents', value: incidents.length },
                    { label: 'Active', value: active.length },
                    { label: 'Resolved', value: resolved.length },
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
                <h2 className="text-xs font-medium tracking-widest uppercase text-[#78716c]">Incidents</h2>
                <button
                    type="button"
                    onClick={() => {
                        setCreateForm({ name: '', status: 'INVESTIGATING', impact: 'minor', initialUpdate: '' });
                        setCreateComponents([]);
                        setShowCreateModal(true);
                    }}
                    className="px-3 py-1.5 text-xs bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] transition-colors"
                >
                    Create incident
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                {incidents.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-[#78716c]">No incidents</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {incidents.map((inc) => (
                            <div key={inc.id} className="px-4 py-4 sm:px-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                                            <p className="min-w-0 break-words text-sm font-medium text-white">
                                                {inc.name}
                                            </p>
                                            <span className={`text-xs ${statusBadge[inc.status]}`}>
                                                {STATUS_OPTIONS.find((s) => s.value === inc.status)?.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                                            <span className="capitalize">Impact: {inc.impact}</span>
                                            <span>Started {formatDate(inc.startedAt)}</span>
                                            {inc.resolvedAt && <span>Resolved {formatDate(inc.resolvedAt)}</span>}
                                            {inc.postmortemPublishedAt ? (
                                                <span className="text-zinc-300">Postmortem published</span>
                                            ) : inc.postmortemBody ? (
                                                <span>Postmortem draft</span>
                                            ) : null}
                                        </div>
                                        {inc.components.length > 0 && (
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                                {inc.components.map((c) => (
                                                    <span
                                                        key={c.componentId}
                                                        className={`text-xs ${componentStatusColor[c.status]}`}
                                                    >
                                                        {c.component.group ? `${c.component.group.name} · ` : ''}
                                                        {c.component.name} ·{' '}
                                                        {
                                                            COMPONENT_STATUS_OPTIONS.find((o) => o.value === c.status)
                                                                ?.label
                                                        }
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {inc.updates[0] && (
                                            <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
                                                {inc.updates[0].body}
                                            </p>
                                        )}
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {inc.updates.length} update{inc.updates.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <RowActions
                                        label={`Actions for ${inc.name}`}
                                        actions={[
                                            {
                                                label: 'Post update',
                                                icon: MessageSquarePlus,
                                                onSelect: () => openUpdateModal(inc),
                                                primary: true,
                                            },
                                            { label: 'Edit', icon: Pencil, onSelect: () => openEditModal(inc) },
                                            {
                                                label: 'View public page',
                                                icon: ExternalLink,
                                                onSelect: () =>
                                                    window.open(`/incidents/${inc.id}`, '_blank', 'noopener'),
                                            },
                                            {
                                                label: 'Delete',
                                                icon: Trash2,
                                                destructive: true,
                                                busy: deleting === inc.id,
                                                onSelect: () => handleDelete(inc.id),
                                            },
                                        ]}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
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
                            <h3 className="text-sm font-medium text-white">Create Incident</h3>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                aria-label="Close"
                                className="-mr-1 rounded-md p-1 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Incident name</label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. API degraded performance"
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">Status</label>
                                    <select
                                        value={createForm.status}
                                        onChange={(e) =>
                                            setCreateForm((f) => ({ ...f, status: e.target.value as IncidentStatus }))
                                        }
                                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                    >
                                        {STATUS_OPTIONS.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">Impact</label>
                                    <select
                                        value={createForm.impact}
                                        onChange={(e) => setCreateForm((f) => ({ ...f, impact: e.target.value }))}
                                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                    >
                                        {IMPACT_OPTIONS.map((o) => (
                                            <option key={o} value={o}>
                                                {o.charAt(0).toUpperCase() + o.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {availableComponents.length > 0 && (
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">
                                        Affected components <span className="text-[#57534e]">(optional)</span>
                                    </label>
                                    <div className="border border-white/[0.08] rounded-lg divide-y divide-white/[0.04] max-h-44 overflow-y-auto">
                                        {availableComponents.map((comp) => {
                                            const sel = createComponents.find((c) => c.componentId === comp.id);
                                            return (
                                                <div key={comp.id} className="px-3 py-2 flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id={`cc-${comp.id}`}
                                                        checked={!!sel}
                                                        onChange={() =>
                                                            toggleComponent(
                                                                comp.id,
                                                                createComponents,
                                                                setCreateComponents,
                                                            )
                                                        }
                                                        className="accent-white shrink-0"
                                                    />
                                                    <label
                                                        htmlFor={`cc-${comp.id}`}
                                                        className="text-xs text-white flex-1 cursor-pointer truncate"
                                                    >
                                                        {comp.name}
                                                        {comp.group && (
                                                            <span className="text-[#57534e] ml-1">
                                                                · {comp.group.name}
                                                            </span>
                                                        )}
                                                    </label>
                                                    {sel && (
                                                        <select
                                                            value={sel.status}
                                                            onChange={(e) =>
                                                                setComponentStatus(
                                                                    comp.id,
                                                                    e.target.value as ComponentStatus,
                                                                    createComponents,
                                                                    setCreateComponents,
                                                                )
                                                            }
                                                            className="bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded px-2 py-1 text-xs focus:outline-none shrink-0"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {COMPONENT_STATUS_OPTIONS.map((o) => (
                                                                <option key={o.value} value={o.value}>
                                                                    {o.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">
                                    Initial update <span className="text-[#57534e]">(optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={createForm.initialUpdate}
                                    onChange={(e) => setCreateForm((f) => ({ ...f, initialUpdate: e.target.value }))}
                                    placeholder="We are currently investigating…"
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c] resize-none"
                                />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2 text-sm border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-2 text-sm bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] disabled:opacity-50 transition-colors"
                                >
                                    {creating ? 'Creating…' : 'Create incident'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Update Modal */}
            {showUpdateModal && selectedIncident && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowUpdateModal(false)}
                >
                    <div
                        className="w-full max-w-md glass-card overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                            <div>
                                <h3 className="text-sm font-medium text-white">Post Update</h3>
                                <p className="text-xs text-[#78716c] mt-0.5">{selectedIncident.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowUpdateModal(false)}
                                aria-label="Close"
                                className="-mr-1 rounded-md p-1 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                        <form onSubmit={handleAddUpdate} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Update</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={updateForm.body}
                                    onChange={(e) => setUpdateForm((f) => ({ ...f, body: e.target.value }))}
                                    placeholder="Describe the current situation…"
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c] resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Status</label>
                                <select
                                    value={updateForm.status}
                                    onChange={(e) =>
                                        setUpdateForm((f) => ({ ...f, status: e.target.value as IncidentStatus }))
                                    }
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowUpdateModal(false)}
                                    className="flex-1 py-2 text-sm border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingUpdate}
                                    className="flex-1 py-2 text-sm bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] disabled:opacity-50 transition-colors"
                                >
                                    {addingUpdate ? 'Posting…' : 'Post update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedIncident && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowEditModal(false)}
                >
                    <div
                        className="w-full max-w-md glass-card overflow-hidden max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
                            <h3 className="text-sm font-medium text-white">Edit Incident</h3>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                aria-label="Close"
                                className="-mr-1 rounded-md p-1 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                        <form onSubmit={handleEdit} className="p-5 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">Status</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) =>
                                            setEditForm((f) => ({ ...f, status: e.target.value as IncidentStatus }))
                                        }
                                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                    >
                                        {STATUS_OPTIONS.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">Impact</label>
                                    <select
                                        value={editForm.impact}
                                        onChange={(e) => setEditForm((f) => ({ ...f, impact: e.target.value }))}
                                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                    >
                                        {IMPACT_OPTIONS.map((o) => (
                                            <option key={o} value={o}>
                                                {o.charAt(0).toUpperCase() + o.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {availableComponents.length > 0 && (
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">Affected components</label>
                                    {editForm.status === 'RESOLVED' && (
                                        <p className="text-xs text-[#57534e] mb-2">
                                            Components revert to Operational on resolve.
                                        </p>
                                    )}
                                    <div className="border border-white/[0.08] rounded-lg divide-y divide-white/[0.04] max-h-44 overflow-y-auto">
                                        {availableComponents.map((comp) => {
                                            const sel = editComponents.find((c) => c.componentId === comp.id);
                                            return (
                                                <div key={comp.id} className="px-3 py-2 flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id={`ec-${comp.id}`}
                                                        checked={!!sel}
                                                        onChange={() =>
                                                            toggleComponent(comp.id, editComponents, setEditComponents)
                                                        }
                                                        className="accent-white shrink-0"
                                                    />
                                                    <label
                                                        htmlFor={`ec-${comp.id}`}
                                                        className="text-xs text-white flex-1 cursor-pointer truncate"
                                                    >
                                                        {comp.name}
                                                        {comp.group && (
                                                            <span className="text-[#57534e] ml-1">
                                                                · {comp.group.name}
                                                            </span>
                                                        )}
                                                    </label>
                                                    {sel && (
                                                        <select
                                                            value={sel.status}
                                                            onChange={(e) =>
                                                                setComponentStatus(
                                                                    comp.id,
                                                                    e.target.value as ComponentStatus,
                                                                    editComponents,
                                                                    setEditComponents,
                                                                )
                                                            }
                                                            className="bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded px-2 py-1 text-xs focus:outline-none shrink-0"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {COMPONENT_STATUS_OPTIONS.map((o) => (
                                                                <option key={o.value} value={o.value}>
                                                                    {o.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div className="border-t border-white/[0.06] pt-4">
                                <label className="block text-xs text-[#78716c] mb-1.5">Postmortem (Markdown)</label>
                                <textarea
                                    rows={6}
                                    value={editForm.postmortemBody}
                                    onChange={(e) => setEditForm((f) => ({ ...f, postmortemBody: e.target.value }))}
                                    placeholder="What happened, root cause, and what's changing so it doesn't happen again…"
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c] resize-y"
                                />
                                <label className="flex items-center gap-2 cursor-pointer mt-2.5">
                                    <input
                                        type="checkbox"
                                        checked={editForm.postmortemPublished}
                                        onChange={(e) =>
                                            setEditForm((f) => ({ ...f, postmortemPublished: e.target.checked }))
                                        }
                                        className="w-4 h-4 rounded border-white/[0.2] bg-[#0f0c0b] accent-orange-500"
                                    />
                                    <span className="text-sm text-white">Published</span>
                                    <span className="text-xs text-[#57534e]">
                                       Visible on the public incident page
                                    </span>
                                </label>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-2 text-sm border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editing}
                                    className="flex-1 py-2 text-sm bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] disabled:opacity-50 transition-colors"
                                >
                                    {editing ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
