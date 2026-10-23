'use client';

import { CheckCircle2, ExternalLink, MessageSquarePlus, Pencil, Play, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RowActions } from '@/components/admin/RowActions';
import DashboardLayout from '@/components/layouts/dashboard/DashboardLayout';

type MaintenanceStatus = 'NOT_STARTED_YET' | 'IN_PROGRESS' | 'COMPLETED';

interface MaintenanceComponent {
    componentId: string;
    component: { id: string; name: string; group: { id: string; name: string } | null };
}

interface MaintenanceUpdateEntry {
    id: string;
    message: string;
    createdAt: string;
}

interface Maintenance {
    id: string;
    name: string;
    status: MaintenanceStatus;
    impact: string;
    scheduledStart: string;
    scheduledEnd: string;
    description: string | null;
    components: MaintenanceComponent[];
    updates: MaintenanceUpdateEntry[];
}

interface AvailableComponent {
    id: string;
    name: string;
    group: { id: string; name: string } | null;
}

const STATUS_OPTIONS: { value: MaintenanceStatus; label: string }[] = [
    { value: 'NOT_STARTED_YET', label: 'Scheduled' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
];

const IMPACT_OPTIONS = ['none', 'minor', 'major', 'critical'];

const statusBadge: Record<MaintenanceStatus, string> = {
    NOT_STARTED_YET: 'text-zinc-300',
    IN_PROGRESS: 'text-orange-400',
    COMPLETED: 'text-emerald-400',
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function AdminMaintenancesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [availableComponents, setAvailableComponents] = useState<AvailableComponent[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        status: 'NOT_STARTED_YET' as MaintenanceStatus,
        impact: 'minor',
        scheduledStart: '',
        scheduledEnd: '',
        description: '',
    });
    const [createComponents, setCreateComponents] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);

    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');
    const [addingUpdate, setAddingUpdate] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        status: 'NOT_STARTED_YET' as MaintenanceStatus,
        impact: 'minor',
        scheduledStart: '',
        scheduledEnd: '',
        description: '',
    });
    const [editComponents, setEditComponents] = useState<string[]>([]);
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [mRes, cRes] = await Promise.all([fetch('/api/admin/maintenances'), fetch('/api/admin/components')]);
            const mData = await mRes.json();
            const cData = await cRes.json();
            if (Array.isArray(mData)) setMaintenances(mData);
            if (Array.isArray(cData)) setAvailableComponents(cData);
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

    function toggleComponent(id: string, list: string[], setList: (v: string[]) => void) {
        if (list.includes(id)) {
            setList(list.filter((c) => c !== id));
        } else {
            setList([...list, id]);
        }
    }

    function toLocalDatetimeString(iso: string) {
        if (!iso) return '';
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/admin/maintenances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: createForm.name,
                    status: createForm.status,
                    impact: createForm.impact,
                    scheduledStart: new Date(createForm.scheduledStart).toISOString(),
                    scheduledEnd: new Date(createForm.scheduledEnd).toISOString(),
                    description: createForm.description || undefined,
                    affectedComponents: createComponents,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to create');
            toast.success('Maintenance created');
            setShowCreateModal(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create');
        } finally {
            setCreating(false);
        }
    };

    const openUpdateModal = (m: Maintenance) => {
        setSelectedMaintenance(m);
        setUpdateMessage('');
        setShowUpdateModal(true);
    };

    const handleAddUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaintenance) return;
        setAddingUpdate(true);
        try {
            const res = await fetch(`/api/admin/maintenances/${selectedMaintenance.id}/updates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: updateMessage }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to post update');
            toast.success('Update posted and subscribers notified');
            setShowUpdateModal(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to post update');
        } finally {
            setAddingUpdate(false);
        }
    };

    const openEditModal = (m: Maintenance) => {
        setSelectedMaintenance(m);
        setEditForm({
            name: m.name,
            status: m.status,
            impact: m.impact,
            scheduledStart: toLocalDatetimeString(m.scheduledStart),
            scheduledEnd: toLocalDatetimeString(m.scheduledEnd),
            description: m.description ?? '',
        });
        setEditComponents(m.components.map((c) => c.componentId));
        setShowEditModal(true);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaintenance) return;
        setEditing(true);
        try {
            const res = await fetch(`/api/admin/maintenances/${selectedMaintenance.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editForm.name,
                    status: editForm.status,
                    impact: editForm.impact,
                    scheduledStart: new Date(editForm.scheduledStart).toISOString(),
                    scheduledEnd: new Date(editForm.scheduledEnd).toISOString(),
                    description: editForm.description || undefined,
                    affectedComponents: editComponents,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to update');
            toast.success('Maintenance updated');
            setShowEditModal(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update');
        } finally {
            setEditing(false);
        }
    };

    const [changingStatus, setChangingStatus] = useState<string | null>(null);

    const handleQuickStatus = async (m: Maintenance, newStatus: MaintenanceStatus) => {
        setChangingStatus(m.id);
        try {
            const res = await fetch(`/api/admin/maintenances/${m.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to update status');
            toast.success(newStatus === 'IN_PROGRESS' ? 'Maintenance started' : 'Maintenance marked complete');
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update status');
        } finally {
            setChangingStatus(null);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        try {
            const res = await fetch(`/api/admin/maintenances/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Maintenance deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete maintenance');
        } finally {
            setDeleting(null);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <DashboardLayout title="Maintenances" description="Manage scheduled maintenance windows">
                <div className="flex items-center justify-center py-24">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const upcoming = maintenances.filter((m) => m.status === 'NOT_STARTED_YET');
    const inProgress = maintenances.filter((m) => m.status === 'IN_PROGRESS');
    const completed = maintenances.filter((m) => m.status === 'COMPLETED');

    return (
        <DashboardLayout title="Maintenances" description="Manage scheduled maintenance windows">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                {[
                    { label: 'Scheduled', value: upcoming.length },
                    { label: 'In progress', value: inProgress.length },
                    { label: 'Completed', value: completed.length },
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
                <h2 className="text-xs font-medium tracking-widest uppercase text-[#78716c]">Maintenances</h2>
                <button
                    type="button"
                    onClick={() => {
                        setCreateForm({
                            name: '',
                            status: 'NOT_STARTED_YET',
                            impact: 'minor',
                            scheduledStart: '',
                            scheduledEnd: '',
                            description: '',
                        });
                        setCreateComponents([]);
                        setShowCreateModal(true);
                    }}
                    className="px-3 py-1.5 text-xs bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] transition-colors"
                >
                    Create maintenance
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                {maintenances.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-[#78716c]">No maintenances</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {maintenances.map((m) => (
                            <div key={m.id} className="px-4 py-4 sm:px-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                                            <p className="min-w-0 break-words text-sm font-medium text-white">
                                                {m.name}
                                            </p>
                                            <span className={`text-xs ${statusBadge[m.status]}`}>
                                                {STATUS_OPTIONS.find((s) => s.value === m.status)?.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                                            <span className="capitalize">Impact: {m.impact}</span>
                                            <span>
                                                {formatDate(m.scheduledStart)} to {formatDate(m.scheduledEnd)}
                                            </span>
                                        </div>
                                        {m.components.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {m.components.map((c) => (
                                                    <span
                                                        key={c.componentId}
                                                        className="max-w-full truncate rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-xs text-zinc-300"
                                                    >
                                                        {c.component.group
                                                            ? `${c.component.group.name} · ${c.component.name}`
                                                            : c.component.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {m.description && (
                                            <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{m.description}</p>
                                        )}
                                        {m.updates[0] && (
                                            <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
                                                {m.updates[0].message}
                                            </p>
                                        )}
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {m.updates.length} update{m.updates.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <RowActions
                                        label={`Actions for ${m.name}`}
                                        actions={[
                                            m.status === 'NOT_STARTED_YET' && {
                                                label: 'Start',
                                                icon: Play,
                                                primary: true,
                                                busy: changingStatus === m.id,
                                                onSelect: () => handleQuickStatus(m, 'IN_PROGRESS'),
                                            },
                                            m.status === 'IN_PROGRESS' && {
                                                label: 'Complete',
                                                icon: CheckCircle2,
                                                primary: true,
                                                busy: changingStatus === m.id,
                                                onSelect: () => handleQuickStatus(m, 'COMPLETED'),
                                            },
                                            {
                                                label: 'Post update',
                                                icon: MessageSquarePlus,
                                                onSelect: () => openUpdateModal(m),
                                                primary: m.status === 'COMPLETED',
                                            },
                                            { label: 'Edit', icon: Pencil, onSelect: () => openEditModal(m) },
                                            {
                                                label: 'View public page',
                                                icon: ExternalLink,
                                                onSelect: () =>
                                                    window.open(`/maintenances/${m.id}`, '_blank', 'noopener'),
                                            },
                                            {
                                                label: 'Delete',
                                                icon: Trash2,
                                                destructive: true,
                                                busy: deleting === m.id,
                                                onSelect: () => handleDelete(m.id),
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
                            <h3 className="text-sm font-medium text-white">Create Maintenance</h3>
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
                                <label className="block text-xs text-[#78716c] mb-1.5">Maintenance name</label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Database migration"
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">Status</label>
                                    <select
                                        value={createForm.status}
                                        onChange={(e) =>
                                            setCreateForm((f) => ({
                                                ...f,
                                                status: e.target.value as MaintenanceStatus,
                                            }))
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
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">Start</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={createForm.scheduledStart}
                                        onChange={(e) =>
                                            setCreateForm((f) => ({ ...f, scheduledStart: e.target.value }))
                                        }
                                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">End</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={createForm.scheduledEnd}
                                        onChange={(e) => setCreateForm((f) => ({ ...f, scheduledEnd: e.target.value }))}
                                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                            {availableComponents.length > 0 && (
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">
                                        Affected components <span className="text-[#57534e]">(optional)</span>
                                    </label>
                                    <p className="text-xs text-[#57534e] mb-2">
                                        Set to Under Maintenance when window is In Progress.
                                    </p>
                                    <div className="border border-white/[0.08] rounded-lg divide-y divide-white/[0.04] max-h-44 overflow-y-auto">
                                        {availableComponents.map((comp) => (
                                            <div key={comp.id} className="px-3 py-2 flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id={`cm-${comp.id}`}
                                                    checked={createComponents.includes(comp.id)}
                                                    onChange={() =>
                                                        toggleComponent(comp.id, createComponents, setCreateComponents)
                                                    }
                                                    className="accent-white shrink-0"
                                                />
                                                <label
                                                    htmlFor={`cm-${comp.id}`}
                                                    className="text-xs text-white flex-1 cursor-pointer truncate"
                                                >
                                                    {comp.name}
                                                    {comp.group && (
                                                        <span className="text-[#57534e] ml-1">· {comp.group.name}</span>
                                                    )}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">
                                    Description <span className="text-[#57534e]">(optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="Describe the maintenance work…"
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
                                    {creating ? 'Creating…' : 'Create maintenance'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Update Modal */}
            {showUpdateModal && selectedMaintenance && (
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
                                <p className="text-xs text-[#78716c] mt-0.5">{selectedMaintenance.name}</p>
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
                                    value={updateMessage}
                                    onChange={(e) => setUpdateMessage(e.target.value)}
                                    placeholder="Describe progress on the maintenance…"
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c] resize-none"
                                />
                            </div>
                            <p className="text-xs text-[#57534e]">
                                To mark this maintenance as In Progress or Completed, use Edit. Status changes there
                                also update linked component statuses.
                            </p>
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
            {showEditModal && selectedMaintenance && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowEditModal(false)}
                >
                    <div
                        className="w-full max-w-md glass-card overflow-hidden max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
                            <h3 className="text-sm font-medium text-white">Edit Maintenance</h3>
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
                                            setEditForm((f) => ({ ...f, status: e.target.value as MaintenanceStatus }))
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
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">Start</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={editForm.scheduledStart}
                                        onChange={(e) => setEditForm((f) => ({ ...f, scheduledStart: e.target.value }))}
                                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">End</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={editForm.scheduledEnd}
                                        onChange={(e) => setEditForm((f) => ({ ...f, scheduledEnd: e.target.value }))}
                                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                            {availableComponents.length > 0 && (
                                <div>
                                    <label className="block text-xs text-[#78716c] mb-1.5">Affected components</label>
                                    {editForm.status === 'COMPLETED' && (
                                        <p className="text-xs text-[#57534e] mb-2">
                                            Components revert to Operational on complete.
                                        </p>
                                    )}
                                    {editForm.status === 'IN_PROGRESS' && (
                                        <p className="text-xs text-[#57534e] mb-2">
                                            Components will be set to Under Maintenance.
                                        </p>
                                    )}
                                    <div className="border border-white/[0.08] rounded-lg divide-y divide-white/[0.04] max-h-44 overflow-y-auto">
                                        {availableComponents.map((comp) => (
                                            <div key={comp.id} className="px-3 py-2 flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id={`em-${comp.id}`}
                                                    checked={editComponents.includes(comp.id)}
                                                    onChange={() =>
                                                        toggleComponent(comp.id, editComponents, setEditComponents)
                                                    }
                                                    className="accent-white shrink-0"
                                                />
                                                <label
                                                    htmlFor={`em-${comp.id}`}
                                                    className="text-xs text-white flex-1 cursor-pointer truncate"
                                                >
                                                    {comp.name}
                                                    {comp.group && (
                                                        <span className="text-[#57534e] ml-1">· {comp.group.name}</span>
                                                    )}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">
                                    Description <span className="text-[#57534e]">(optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 resize-none"
                                />
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
