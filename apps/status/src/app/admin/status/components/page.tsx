'use client';

import { ArrowDown, ArrowUp, FolderPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RowActions } from '@/components/admin/RowActions';
import { LocationBadge } from '@/components/status/LocationBadge';
import DashboardLayout from '@/components/layouts/dashboard/DashboardLayout';

type ComponentStatus = 'OPERATIONAL' | 'DEGRADED_PERFORMANCE' | 'PARTIAL_OUTAGE' | 'MAJOR_OUTAGE' | 'UNDER_MAINTENANCE';

interface Group {
    id: string;
    name: string;
    order: number;
    parentId: string | null;
    defaultOpen: boolean;
}

interface Component {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    status: ComponentStatus;
    groupId: string | null;
    order: number;
    showUptime: boolean;
}

interface TreeState {
    groups: Group[];
    components: Component[];
    collapsed: Set<string>;
    reordering: string | null;
    deleting: string | null;
    deletingGroup: string | null;
}

interface TreeHandlers {
    openEditComponent: (c: Component) => void;
    handleDeleteComponent: (id: string) => void;
    openCreateComponent: (groupId?: string) => void;
    openEditGroup: (g: Group) => void;
    handleDeleteGroup: (id: string) => void;
    openCreateGroup: (parentId?: string) => void;
    toggleCollapse: (id: string) => void;
    moveGroup: (id: string, dir: 'up' | 'down') => void;
    moveComponent: (id: string, dir: 'up' | 'down') => void;
}

const STATUS_OPTIONS: { value: ComponentStatus; label: string }[] = [
    { value: 'OPERATIONAL', label: 'Operational' },
    { value: 'DEGRADED_PERFORMANCE', label: 'Degraded Performance' },
    { value: 'PARTIAL_OUTAGE', label: 'Partial Outage' },
    { value: 'MAJOR_OUTAGE', label: 'Major Outage' },
    { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
];

const statusDot: Record<ComponentStatus, string> = {
    OPERATIONAL: 'bg-emerald-500',
    DEGRADED_PERFORMANCE: 'bg-yellow-400',
    PARTIAL_OUTAGE: 'bg-orange-400',
    MAJOR_OUTAGE: 'bg-red-500',
    UNDER_MAINTENANCE: 'bg-orange-400',
};

const statusColor: Record<ComponentStatus, string> = {
    OPERATIONAL: 'text-emerald-400',
    DEGRADED_PERFORMANCE: 'text-yellow-400',
    PARTIAL_OUTAGE: 'text-orange-400',
    MAJOR_OUTAGE: 'text-red-400',
    UNDER_MAINTENANCE: 'text-orange-400',
};

function ComponentRow({
    comp,
    state,
    handlers,
    depth,
}: {
    comp: Component;
    state: TreeState;
    handlers: TreeHandlers;
    depth: number;
}) {
    const { deleting, reordering } = state;
    return (
        <div
            className="flex items-center justify-between gap-2 py-2.5 hover:bg-white/[0.02] group"
            style={{ paddingLeft: `${16 + depth * 20}px`, paddingRight: '16px' }}
        >
            <div className="flex items-center gap-2 min-w-0">
                <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[comp.status]}`} />
                <span className="text-sm text-[#a8a29e] truncate">{comp.name}</span>
                {comp.location && <LocationBadge location={comp.location} className="hidden sm:inline-flex" />}
                {comp.description && (
                    <span className="text-xs text-[#57534e] truncate hidden sm:inline">{comp.description}</span>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className={`hidden sm:inline text-xs ${statusColor[comp.status]}`}>
                    {STATUS_OPTIONS.find((s) => s.value === comp.status)?.label}
                </span>
                <RowActions
                    breakpoint="xl"
                    label={`Actions for ${comp.name}`}
                    actions={[
                        {
                            label: 'Move up',
                            icon: ArrowUp,
                            disabled: reordering === comp.id,
                            onSelect: () => handlers.moveComponent(comp.id, 'up'),
                        },
                        {
                            label: 'Move down',
                            icon: ArrowDown,
                            disabled: reordering === comp.id,
                            onSelect: () => handlers.moveComponent(comp.id, 'down'),
                        },
                        { label: 'Edit', icon: Pencil, onSelect: () => handlers.openEditComponent(comp) },
                        {
                            label: 'Delete',
                            icon: Trash2,
                            destructive: true,
                            busy: deleting === comp.id,
                            onSelect: () => handlers.handleDeleteComponent(comp.id),
                        },
                    ]}
                />
            </div>
        </div>
    );
}

function GroupRow({
    group,
    state,
    handlers,
    depth,
}: {
    group: Group;
    state: TreeState;
    handlers: TreeHandlers;
    depth: number;
}) {
    const { collapsed, deletingGroup, reordering, groups, components } = state;
    const isCollapsed = collapsed.has(group.id);
    const childGroups = groups.filter((g) => g.parentId === group.id).sort((a, b) => a.order - b.order);
    const childComponents = components.filter((c) => c.groupId === group.id).sort((a, b) => a.order - b.order);
    const hasKids = childGroups.length > 0 || childComponents.length > 0;
    return (
        <div>
            <div
                className="flex items-center gap-2 py-2.5 hover:bg-white/[0.02] group/row border-b border-white/[0.04] last:border-b-0"
                style={{ paddingLeft: `${16 + depth * 20}px`, paddingRight: '16px' }}
            >
                <button
                    type="button"
                    onClick={() => handlers.toggleCollapse(group.id)}
                    disabled={!hasKids}
                    className={`shrink-0 w-4 text-center text-xs transition-colors ${hasKids ? 'text-[#57534e] hover:text-white cursor-pointer' : 'text-[#292524] cursor-default'}`}
                >
                    {hasKids ? (isCollapsed ? '▶' : '▼') : '·'}
                </button>
                <span className="text-sm text-white font-medium flex-1 truncate">{group.name}</span>
                <RowActions
                    breakpoint="xl"
                    label={`Actions for ${group.name}`}
                    actions={[
                        {
                            label: 'Move up',
                            icon: ArrowUp,
                            disabled: reordering === group.id,
                            onSelect: () => handlers.moveGroup(group.id, 'up'),
                        },
                        {
                            label: 'Move down',
                            icon: ArrowDown,
                            disabled: reordering === group.id,
                            onSelect: () => handlers.moveGroup(group.id, 'down'),
                        },
                        { label: 'Add subgroup', icon: FolderPlus, onSelect: () => handlers.openCreateGroup(group.id) },
                        { label: 'Add component', icon: Plus, onSelect: () => handlers.openCreateComponent(group.id) },
                        { label: 'Edit', icon: Pencil, onSelect: () => handlers.openEditGroup(group) },
                        {
                            label: 'Delete',
                            icon: Trash2,
                            destructive: true,
                            busy: deletingGroup === group.id,
                            onSelect: () => handlers.handleDeleteGroup(group.id),
                        },
                    ]}
                />
            </div>
            {!isCollapsed && hasKids && (
                <GroupTree containerId={group.id} depth={depth + 1} state={state} handlers={handlers} />
            )}
        </div>
    );
}

function GroupTree({
    containerId,
    depth,
    state,
    handlers,
}: {
    containerId: string | null;
    depth: number;
    state: TreeState;
    handlers: TreeHandlers;
}) {
    const { groups, components } = state;
    // Groups and components sharing a parent are one ordered sequence: interleave
    // by `order` rather than always listing subgroups before components.
    const items: { order: number; node: React.ReactNode }[] = [
        ...groups
            .filter((g) => g.parentId === containerId)
            .map((g) => ({
                order: g.order,
                node: <GroupRow key={g.id} group={g} state={state} handlers={handlers} depth={depth} />,
            })),
        ...components
            .filter((c) => c.groupId === containerId)
            .map((c) => ({
                order: c.order,
                node: <ComponentRow key={c.id} comp={c} state={state} handlers={handlers} depth={depth} />,
            })),
    ].sort((a, b) => a.order - b.order);
    return <>{items.map((i) => i.node)}</>;
}

export default function AdminComponentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [components, setComponents] = useState<Component[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [reordering, setReordering] = useState<string | null>(null);

    // Component modal
    const [showComponentModal, setShowComponentModal] = useState(false);
    const [editingComponent, setEditingComponent] = useState<Component | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [componentForm, setComponentForm] = useState({
        name: '',
        description: '',
        location: '',
        status: 'OPERATIONAL' as ComponentStatus,
        groupId: '',
        showUptime: true,
    });

    // Group modal
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [groupForm, setGroupForm] = useState({ name: '', parentId: '', defaultOpen: true });
    const [savingGroup, setSavingGroup] = useState(false);
    const [deletingGroup, setDeletingGroup] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [cRes, gRes] = await Promise.all([fetch('/api/admin/components'), fetch('/api/admin/groups')]);
            const [cData, gData] = await Promise.all([cRes.json(), gRes.json()]);
            if (Array.isArray(cData)) setComponents(cData);
            if (Array.isArray(gData)) setGroups(gData);
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

    // ── Components ──────────────────────────────────────────────────────────

    const openCreateComponent = useCallback((groupId?: string) => {
        setEditingComponent(null);
        setComponentForm({
            name: '',
            description: '',
            location: '',
            status: 'OPERATIONAL',
            groupId: groupId ?? '',
            showUptime: true,
        });
        setShowComponentModal(true);
    }, []);

    const openEditComponent = useCallback((c: Component) => {
        setEditingComponent(c);
        setComponentForm({
            name: c.name,
            description: c.description ?? '',
            location: c.location ?? '',
            status: c.status,
            groupId: c.groupId ?? '',
            showUptime: c.showUptime,
        });
        setShowComponentModal(true);
    }, []);

    const handleSaveComponent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: componentForm.name,
                description: componentForm.description || null,
                location: componentForm.location.trim() || null,
                status: componentForm.status,
                groupId: componentForm.groupId || null,
                showUptime: componentForm.showUptime,
            };
            const url = editingComponent ? `/api/admin/components/${editingComponent.id}` : '/api/admin/components';
            const method = editingComponent ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to save');
            toast.success(`Component ${editingComponent ? 'updated' : 'created'}`);
            setShowComponentModal(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteComponent = useCallback(
        async (id: string) => {
            setDeleting(id);
            try {
                const res = await fetch(`/api/admin/components/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete');
                toast.success('Component deleted');
                fetchData();
            } catch {
                toast.error('Failed to delete component');
            } finally {
                setDeleting(null);
            }
        },
        [fetchData],
    );

    // ── Groups ───────────────────────────────────────────────────────────────

    const openCreateGroup = useCallback((parentId?: string) => {
        setEditingGroup(null);
        setGroupForm({ name: '', parentId: parentId ?? '', defaultOpen: true });
        setShowGroupModal(true);
    }, []);

    const openEditGroup = useCallback((g: Group) => {
        setEditingGroup(g);
        setGroupForm({ name: g.name, parentId: g.parentId ?? '', defaultOpen: g.defaultOpen });
        setShowGroupModal(true);
    }, []);

    const handleSaveGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingGroup(true);
        try {
            const payload = {
                name: groupForm.name,
                parentId: groupForm.parentId || null,
                defaultOpen: groupForm.defaultOpen,
            };
            const url = editingGroup ? `/api/admin/groups/${editingGroup.id}` : '/api/admin/groups';
            const method = editingGroup ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to save');
            toast.success(`Group ${editingGroup ? 'updated' : 'created'}`);
            setShowGroupModal(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSavingGroup(false);
        }
    };

    const handleDeleteGroup = useCallback(
        async (id: string) => {
            setDeletingGroup(id);
            try {
                const res = await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete');
                toast.success('Group deleted');
                fetchData();
            } catch {
                toast.error('Failed to delete group');
            } finally {
                setDeletingGroup(null);
            }
        },
        [fetchData],
    );

    // ── Reorder & collapse ────────────────────────────────────────────────────

    const toggleCollapse = useCallback((id: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // Subgroups and components under the same parent share one order sequence
    // (see the create routes), so "siblings" here means both types combined:
    // otherwise a group could never move past/before a component and vice versa.
    type Sibling = { id: string; order: number; kind: 'group' | 'component' };

    const moveSibling = useCallback(
        async (id: string, kind: 'group' | 'component', dir: 'up' | 'down') => {
            const parentId =
                kind === 'group'
                    ? (groups.find((g) => g.id === id)?.parentId ?? null)
                    : (components.find((c) => c.id === id)?.groupId ?? null);
            const self = kind === 'group' ? groups.find((g) => g.id === id) : components.find((c) => c.id === id);
            if (!self) return;

            const siblings: Sibling[] = [
                ...groups
                    .filter((g) => g.parentId === parentId)
                    .map((g) => ({ id: g.id, order: g.order, kind: 'group' as const })),
                ...components
                    .filter((c) => c.groupId === parentId)
                    .map((c) => ({ id: c.id, order: c.order, kind: 'component' as const })),
            ].sort((a, b) => a.order - b.order);

            const idx = siblings.findIndex((s) => s.id === id && s.kind === kind);
            const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
            if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return;
            const sibling = siblings[swapIdx];

            setReordering(id);
            try {
                await Promise.all([
                    fetch(`/api/admin/${kind === 'group' ? 'groups' : 'components'}/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order: sibling.order }),
                    }),
                    fetch(`/api/admin/${sibling.kind === 'group' ? 'groups' : 'components'}/${sibling.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order: self.order }),
                    }),
                ]);
                fetchData();
            } finally {
                setReordering(null);
            }
        },
        [groups, components, fetchData],
    );

    const moveGroup = useCallback((id: string, dir: 'up' | 'down') => moveSibling(id, 'group', dir), [moveSibling]);
    const moveComponent = useCallback(
        (id: string, dir: 'up' | 'down') => moveSibling(id, 'component', dir),
        [moveSibling],
    );

    function getDescendantIds(id: string): string[] {
        const children = groups.filter((g) => g.parentId === id);
        return [id, ...children.flatMap((c) => getDescendantIds(c.id))];
    }

    const treeState: TreeState = { groups, components, collapsed, reordering, deleting, deletingGroup };
    const handlers: TreeHandlers = {
        openEditComponent,
        handleDeleteComponent,
        openCreateComponent,
        openEditGroup,
        handleDeleteGroup,
        openCreateGroup,
        toggleCollapse,
        moveGroup,
        moveComponent,
    };

    if (status === 'loading' || loading) {
        return (
            <DashboardLayout title="Components" description="Manage status components and groups">
                <div className="flex items-center justify-center py-24">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const operational = components.filter((c) => c.status === 'OPERATIONAL').length;
    const hasAnything = groups.length > 0 || components.length > 0;

    return (
        <DashboardLayout title="Components" description="Manage status components and groups">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                {[
                    { label: 'Total Components', value: components.length },
                    { label: 'Operational', value: operational },
                    { label: 'Groups', value: groups.length },
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

            {/* Tree */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-medium tracking-widest uppercase text-[#78716c]">
                        Components &amp; Groups
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => openCreateGroup()}
                            className="px-3 py-1.5 text-xs font-medium border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                        >
                            Add group
                        </button>
                        <button
                            type="button"
                            onClick={() => openCreateComponent()}
                            className="px-3 py-1.5 text-xs bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] transition-colors"
                        >
                            Add component
                        </button>
                    </div>
                </div>
                {!hasAnything ? (
                    <div className="glass-card p-12 text-center">
                        <p className="text-sm text-[#78716c]">No components or groups yet</p>
                    </div>
                ) : (
                    <div className="glass-card overflow-hidden">
                        <GroupTree containerId={null} depth={0} state={treeState} handlers={handlers} />
                    </div>
                )}
            </div>

            {/* Component Modal */}
            {showComponentModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowComponentModal(false)}
                >
                    <div
                        className="w-full max-w-md glass-card overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                            <h3 className="text-sm font-medium text-white">
                                {editingComponent ? 'Edit Component' : 'Add Component'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowComponentModal(false)}
                                className="text-[#78716c] hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSaveComponent} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={componentForm.name}
                                    onChange={(e) => setComponentForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. API Gateway"
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Description</label>
                                <input
                                    type="text"
                                    value={componentForm.description}
                                    onChange={(e) => setComponentForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="Optional description"
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Location</label>
                                <input
                                    type="text"
                                    maxLength={60}
                                    value={componentForm.location}
                                    onChange={(e) => setComponentForm((f) => ({ ...f, location: e.target.value }))}
                                    placeholder="Optional, e.g. US · N. Virginia"
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Status</label>
                                <select
                                    value={componentForm.status}
                                    onChange={(e) =>
                                        setComponentForm((f) => ({ ...f, status: e.target.value as ComponentStatus }))
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
                                <label className="block text-xs text-[#78716c] mb-1.5">Group</label>
                                <select
                                    value={componentForm.groupId}
                                    onChange={(e) => setComponentForm((f) => ({ ...f, groupId: e.target.value }))}
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                >
                                    <option value="">No group</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Show uptime</label>
                                <select
                                    value={componentForm.showUptime ? 'yes' : 'no'}
                                    onChange={(e) =>
                                        setComponentForm((f) => ({ ...f, showUptime: e.target.value === 'yes' }))
                                    }
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                >
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowComponentModal(false)}
                                    className="flex-1 py-2 text-sm border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-2 text-sm bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] disabled:opacity-50 transition-colors"
                                >
                                    {saving ? 'Saving…' : editingComponent ? 'Save changes' : 'Add component'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Group Modal */}
            {showGroupModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowGroupModal(false)}
                >
                    <div
                        className="w-full max-w-sm glass-card overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                            <h3 className="text-sm font-medium text-white">
                                {editingGroup ? 'Edit Group' : 'Add Group'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowGroupModal(false)}
                                className="text-[#78716c] hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSaveGroup} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={groupForm.name}
                                    onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Core Infrastructure"
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Parent group</label>
                                <select
                                    value={groupForm.parentId}
                                    onChange={(e) => setGroupForm((f) => ({ ...f, parentId: e.target.value }))}
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                >
                                    <option value="">No parent (root)</option>
                                    {groups
                                        .filter(
                                            (g) => !editingGroup || !getDescendantIds(editingGroup.id).includes(g.id),
                                        )
                                        .map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={groupForm.defaultOpen}
                                    onChange={(e) => setGroupForm((f) => ({ ...f, defaultOpen: e.target.checked }))}
                                    className="w-4 h-4 rounded border-white/[0.2] bg-[#0f0c0b] accent-orange-500"
                                />
                                <span className="text-sm text-white">Expanded by default</span>
                            </label>
                            <p className="text-xs text-[#78716c] -mt-2">
                                Whether this group (and its subgroups) starts open on the public status page. Visitors
                                can still toggle it either way.
                            </p>
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowGroupModal(false)}
                                    className="flex-1 py-2 text-sm border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingGroup}
                                    className="flex-1 py-2 text-sm bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] disabled:opacity-50 transition-colors"
                                >
                                    {savingGroup ? 'Saving…' : editingGroup ? 'Save changes' : 'Add group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
