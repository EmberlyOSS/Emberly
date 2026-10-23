'use client';

import { Pencil, Power, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RowActions } from '@/components/admin/RowActions';
import DashboardLayout from '@/components/layouts/dashboard/DashboardLayout';

type AlertChannelType = 'DISCORD_WEBHOOK' | 'SLACK_WEBHOOK' | 'GENERIC_WEBHOOK' | 'EMAIL';

interface AlertChannel {
    id: string;
    name: string;
    type: AlertChannelType;
    enabled: boolean;
    rules: AlertRule[];
}

interface AlertRule {
    id: string;
    monitorId: string | null;
    groupId: string | null;
    channelId: string;
    events: string[];
    enabled: boolean;
    monitor?: { name: string } | null;
    group?: { name: string } | null;
    channel?: { name: string };
}

interface Monitor {
    id: string;
    name: string;
}

interface Group {
    id: string;
    name: string;
    parentId: string | null;
}

const CHANNEL_TYPE_OPTIONS: { value: AlertChannelType; label: string }[] = [
    { value: 'DISCORD_WEBHOOK', label: 'Discord webhook' },
    { value: 'SLACK_WEBHOOK', label: 'Slack webhook' },
    { value: 'GENERIC_WEBHOOK', label: 'Generic webhook' },
    { value: 'EMAIL', label: 'Email' },
];

const EVENT_OPTIONS = ['DOWN', 'DEGRADED', 'UP'];
const EVENT_LABELS: Record<string, string> = { DOWN: 'Down', DEGRADED: 'Degraded', UP: 'Recovered' };

const channelTypeBadge: Record<AlertChannelType, string> = {
    DISCORD_WEBHOOK: 'text-[#5865F2]',
    SLACK_WEBHOOK: 'text-[#4A154B]',
    GENERIC_WEBHOOK: 'text-[#a8a29e]',
    EMAIL: 'text-[#78716c]',
};

function isWebhookType(type: AlertChannelType) {
    return type === 'DISCORD_WEBHOOK' || type === 'SLACK_WEBHOOK' || type === 'GENERIC_WEBHOOK';
}

const emptyChannelForm = { name: '', type: 'DISCORD_WEBHOOK' as AlertChannelType, url: '', email: '' };

function ChannelFormFields({
    form,
    setForm,
}: {
    form: typeof emptyChannelForm;
    setForm: React.Dispatch<React.SetStateAction<typeof emptyChannelForm>>;
}) {
    return (
        <>
            <div>
                <label className="block text-xs text-[#78716c] mb-1.5">Name</label>
                <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. #alerts-discord"
                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                />
            </div>
            <div>
                <label className="block text-xs text-[#78716c] mb-1.5">Type</label>
                <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AlertChannelType }))}
                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                >
                    {CHANNEL_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>
            {isWebhookType(form.type) ? (
                <div>
                    <label className="block text-xs text-[#78716c] mb-1.5">Webhook URL</label>
                    <input
                        type="url"
                        required
                        value={form.url}
                        onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                        placeholder="https://discord.com/api/webhooks/…"
                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                    />
                </div>
            ) : (
                <div>
                    <label className="block text-xs text-[#78716c] mb-1.5">Email address</label>
                    <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="alerts@example.com"
                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 placeholder:text-[#44403c]"
                    />
                </div>
            )}
        </>
    );
}

export default function AdminAlertsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [channels, setChannels] = useState<AlertChannel[]>([]);
    const [rules, setRules] = useState<AlertRule[]>([]);
    const [monitors, setMonitors] = useState<Monitor[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    // Channel modals
    const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
    const [channelForm, setChannelForm] = useState(emptyChannelForm);
    const [creatingChannel, setCreatingChannel] = useState(false);

    const [showEditChannelModal, setShowEditChannelModal] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<AlertChannel | null>(null);
    const [editChannelForm, setEditChannelForm] = useState(emptyChannelForm);
    const [editingChannel, setEditingChannel] = useState(false);

    // Rule modal
    const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
    const [ruleForm, setRuleForm] = useState({
        targetType: 'monitor' as 'monitor' | 'group',
        monitorId: '',
        groupId: '',
        channelId: '',
        events: [] as string[],
    });
    const [creatingRule, setCreatingRule] = useState(false);

    const [deletingChannel, setDeletingChannel] = useState<string | null>(null);
    const [deletingRule, setDeletingRule] = useState<string | null>(null);
    const [togglingRule, setTogglingRule] = useState<string | null>(null);
    const [togglingChannel, setTogglingChannel] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [cRes, rRes, mRes, gRes] = await Promise.all([
                fetch('/api/admin/alert-channels'),
                fetch('/api/admin/alert-rules'),
                fetch('/api/admin/monitors'),
                fetch('/api/admin/groups'),
            ]);
            const [cData, rData, mData, gData] = await Promise.all([
                cRes.json(),
                rRes.json(),
                mRes.json(),
                gRes.json(),
            ]);
            if (Array.isArray(cData)) setChannels(cData);
            if (Array.isArray(rData)) setRules(rData);
            if (Array.isArray(mData)) setMonitors(mData);
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

    const handleCreateChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingChannel(true);
        try {
            const config = isWebhookType(channelForm.type) ? { url: channelForm.url } : { email: channelForm.email };
            const res = await fetch('/api/admin/alert-channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: channelForm.name, type: channelForm.type, config }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to create');
            toast.success('Alert channel created');
            setShowCreateChannelModal(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create');
        } finally {
            setCreatingChannel(false);
        }
    };

    const openEditChannel = (ch: AlertChannel) => {
        setSelectedChannel(ch);
        const cfg = ch as unknown as { config?: { url?: string; email?: string } };
        setEditChannelForm({
            name: ch.name,
            type: ch.type,
            url: cfg.config?.url ?? '',
            email: cfg.config?.email ?? '',
        });
        setShowEditChannelModal(true);
    };

    const handleEditChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChannel) return;
        setEditingChannel(true);
        try {
            const config = isWebhookType(editChannelForm.type)
                ? { url: editChannelForm.url }
                : { email: editChannelForm.email };
            const res = await fetch(`/api/admin/alert-channels/${selectedChannel.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editChannelForm.name, type: editChannelForm.type, config }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to update');
            toast.success('Channel updated');
            setShowEditChannelModal(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update');
        } finally {
            setEditingChannel(false);
        }
    };

    const handleToggleChannel = async (ch: AlertChannel) => {
        setTogglingChannel(ch.id);
        try {
            const res = await fetch(`/api/admin/alert-channels/${ch.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !ch.enabled }),
            });
            if (!res.ok) throw new Error();
            fetchData();
        } catch {
            toast.error('Failed to toggle channel');
        } finally {
            setTogglingChannel(null);
        }
    };

    const handleDeleteChannel = async (id: string) => {
        setDeletingChannel(id);
        try {
            const res = await fetch(`/api/admin/alert-channels/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success('Channel deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete channel');
        } finally {
            setDeletingChannel(null);
        }
    };

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (ruleForm.events.length === 0) {
            toast.error('Select at least one event');
            return;
        }
        setCreatingRule(true);
        try {
            const res = await fetch('/api/admin/alert-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    monitorId: ruleForm.targetType === 'monitor' ? ruleForm.monitorId : undefined,
                    groupId: ruleForm.targetType === 'group' ? ruleForm.groupId : undefined,
                    channelId: ruleForm.channelId,
                    events: ruleForm.events,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to create');
            toast.success('Alert rule created');
            setShowCreateRuleModal(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create');
        } finally {
            setCreatingRule(false);
        }
    };

    const handleToggleRule = async (rule: AlertRule) => {
        setTogglingRule(rule.id);
        try {
            const res = await fetch(`/api/admin/alert-rules/${rule.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !rule.enabled }),
            });
            if (!res.ok) throw new Error();
            fetchData();
        } catch {
            toast.error('Failed to toggle rule');
        } finally {
            setTogglingRule(null);
        }
    };

    const handleDeleteRule = async (id: string) => {
        setDeletingRule(id);
        try {
            const res = await fetch(`/api/admin/alert-rules/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success('Rule deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete rule');
        } finally {
            setDeletingRule(null);
        }
    };

    const toggleEvent = (
        evt: string,
        current: string[],
        setter: React.Dispatch<
            React.SetStateAction<{
                targetType: 'monitor' | 'group';
                monitorId: string;
                groupId: string;
                channelId: string;
                events: string[];
            }>
        >,
    ) => {
        setter((f) => ({
            ...f,
            events: f.events.includes(evt) ? f.events.filter((e) => e !== evt) : [...f.events, evt],
        }));
    };

    if (status === 'loading' || loading) {
        return (
            <DashboardLayout title="Alert Channels" description="Manage alert channels and routing rules">
                <div className="flex items-center justify-center py-24">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Alert Channels" description="Manage alert channels and routing rules">
            {/* Channels */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium tracking-widest uppercase text-[#78716c]">Channels</h2>
                <button
                    type="button"
                    onClick={() => {
                        setChannelForm(emptyChannelForm);
                        setShowCreateChannelModal(true);
                    }}
                    className="px-3 py-1.5 text-xs bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] transition-colors"
                >
                    Add channel
                </button>
            </div>

            <div className="glass-card overflow-hidden mb-6">
                {channels.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-sm text-[#78716c]">No alert channels configured</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {channels.map((ch) => (
                            <div key={ch.id} className="px-5 py-4 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                        <span className="min-w-0 break-words text-sm text-white font-medium">
                                            {ch.name}
                                        </span>
                                        <span className={`text-xs ${channelTypeBadge[ch.type]}`}>
                                            {CHANNEL_TYPE_OPTIONS.find((o) => o.value === ch.type)?.label}
                                        </span>
                                        {!ch.enabled && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/[0.08] text-[#57534e]">
                                                Disabled
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[#44403c] mt-0.5">
                                        {ch.rules?.length ?? 0} rule{(ch.rules?.length ?? 0) !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <RowActions
                                    label={`Actions for ${ch.name}`}
                                    actions={[
                                        {
                                            label: ch.enabled ? 'Disable' : 'Enable',
                                            icon: Power,
                                            busy: togglingChannel === ch.id,
                                            onSelect: () => handleToggleChannel(ch),
                                        },
                                        { label: 'Edit', icon: Pencil, onSelect: () => openEditChannel(ch) },
                                        {
                                            label: 'Delete',
                                            icon: Trash2,
                                            destructive: true,
                                            busy: deletingChannel === ch.id,
                                            onSelect: () => handleDeleteChannel(ch.id),
                                        },
                                    ]}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Rules */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium tracking-widest uppercase text-[#78716c]">Alert Rules</h2>
                <button
                    type="button"
                    onClick={() => {
                        setRuleForm({
                            targetType: 'monitor',
                            monitorId: monitors[0]?.id ?? '',
                            groupId: groups[0]?.id ?? '',
                            channelId: channels[0]?.id ?? '',
                            events: ['DOWN', 'UP'],
                        });
                        setShowCreateRuleModal(true);
                    }}
                    disabled={(monitors.length === 0 && groups.length === 0) || channels.length === 0}
                    className="px-3 py-1.5 text-xs bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] disabled:opacity-40 transition-colors"
                >
                    Add rule
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                {rules.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-sm text-[#78716c]">
                            {(monitors.length === 0 && groups.length === 0) || channels.length === 0
                                ? 'Add monitors/groups and channels first'
                                : 'No alert rules configured'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {rules.map((rule) => {
                            const mon = rule.monitorId ? monitors.find((m) => m.id === rule.monitorId) : null;
                            const grp = rule.groupId ? groups.find((g) => g.id === rule.groupId) : null;
                            const ch = channels.find((c) => c.id === rule.channelId);
                            const targetLabel = rule.groupId
                                ? `Group: ${rule.group?.name ?? grp?.name ?? 'Unknown group'}`
                                : (rule.monitor?.name ?? mon?.name ?? 'Unknown monitor');
                            return (
                                <div key={rule.id} className="px-5 py-4 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm text-white">{targetLabel}</span>
                                            <span className="text-xs text-[#57534e]">→</span>
                                            <span className="text-sm text-[#a8a29e]">
                                                {ch?.name ?? 'Unknown channel'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                            {rule.events.map((evt) => (
                                                <span
                                                    key={evt}
                                                    className="text-[10px] px-1.5 py-0.5 rounded border border-white/[0.08] text-[#78716c]"
                                                >
                                                    {EVENT_LABELS[evt] ?? evt}
                                                </span>
                                            ))}
                                            {!rule.enabled && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/[0.08] text-[#57534e]">
                                                    Disabled
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <RowActions
                                        breakpoint="md"
                                        label={`Actions for rule ${targetLabel}`}
                                        actions={[
                                            {
                                                label: rule.enabled ? 'Disable' : 'Enable',
                                                icon: Power,
                                                busy: togglingRule === rule.id,
                                                onSelect: () => handleToggleRule(rule),
                                            },
                                            {
                                                label: 'Delete',
                                                icon: Trash2,
                                                destructive: true,
                                                busy: deletingRule === rule.id,
                                                onSelect: () => handleDeleteRule(rule.id),
                                            },
                                        ]}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Channel Modal */}
            {showCreateChannelModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowCreateChannelModal(false)}
                >
                    <div
                        className="w-full max-w-md glass-card overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                            <h3 className="text-sm font-medium text-white">Add Channel</h3>
                            <button
                                type="button"
                                onClick={() => setShowCreateChannelModal(false)}
                                className="text-[#78716c] hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateChannel} className="p-5 space-y-4">
                            <ChannelFormFields form={channelForm} setForm={setChannelForm} />
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateChannelModal(false)}
                                    className="flex-1 py-2 text-sm border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingChannel}
                                    className="flex-1 py-2 text-sm bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] disabled:opacity-50 transition-colors"
                                >
                                    {creatingChannel ? 'Creating…' : 'Add channel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Channel Modal */}
            {showEditChannelModal && selectedChannel && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowEditChannelModal(false)}
                >
                    <div
                        className="w-full max-w-md glass-card overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                            <h3 className="text-sm font-medium text-white">Edit Channel</h3>
                            <button
                                type="button"
                                onClick={() => setShowEditChannelModal(false)}
                                className="text-[#78716c] hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleEditChannel} className="p-5 space-y-4">
                            <ChannelFormFields form={editChannelForm} setForm={setEditChannelForm} />
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowEditChannelModal(false)}
                                    className="flex-1 py-2 text-sm border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editingChannel}
                                    className="flex-1 py-2 text-sm bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] disabled:opacity-50 transition-colors"
                                >
                                    {editingChannel ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Rule Modal */}
            {showCreateRuleModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowCreateRuleModal(false)}
                >
                    <div
                        className="w-full max-w-md glass-card overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                            <h3 className="text-sm font-medium text-white">Add Alert Rule</h3>
                            <button
                                type="button"
                                onClick={() => setShowCreateRuleModal(false)}
                                className="text-[#78716c] hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateRule} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Applies to</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setRuleForm((f) => ({ ...f, targetType: 'monitor' }))}
                                        className={`flex-1 py-2 text-xs rounded-lg border transition-colors ${ruleForm.targetType === 'monitor' ? 'bg-[#F97316] text-[#140b05] font-semibold border-[#F97316]' : 'border-white/[0.1] text-[#78716c] hover:border-white/[0.3] hover:text-white'}`}
                                    >
                                        Single monitor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRuleForm((f) => ({ ...f, targetType: 'group' }))}
                                        disabled={groups.length === 0}
                                        className={`flex-1 py-2 text-xs rounded-lg border transition-colors disabled:opacity-40 ${ruleForm.targetType === 'group' ? 'bg-[#F97316] text-[#140b05] font-semibold border-[#F97316]' : 'border-white/[0.1] text-[#78716c] hover:border-white/[0.3] hover:text-white'}`}
                                    >
                                        Component group
                                    </button>
                                </div>
                                {ruleForm.targetType === 'monitor' ? (
                                    <select
                                        value={ruleForm.monitorId}
                                        onChange={(e) => setRuleForm((f) => ({ ...f, monitorId: e.target.value }))}
                                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                    >
                                        {monitors.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        value={ruleForm.groupId}
                                        onChange={(e) => setRuleForm((f) => ({ ...f, groupId: e.target.value }))}
                                        className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                    >
                                        {groups.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-[10px] text-[#57534e] mt-1.5">
                                    {ruleForm.targetType === 'group'
                                        ? 'Fires for any monitor whose linked component belongs to this group.'
                                        : 'Fires only for this specific monitor.'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">Channel</label>
                                <select
                                    value={ruleForm.channelId}
                                    onChange={(e) => setRuleForm((f) => ({ ...f, channelId: e.target.value }))}
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                >
                                    {channels.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-[#78716c] mb-2">Trigger on</label>
                                <div className="flex flex-wrap gap-2">
                                    {EVENT_OPTIONS.map((evt) => (
                                        <button
                                            key={evt}
                                            type="button"
                                            onClick={() => toggleEvent(evt, ruleForm.events, setRuleForm)}
                                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${ruleForm.events.includes(evt) ? 'bg-[#F97316] text-[#140b05] font-semibold border-[#F97316]' : 'border-white/[0.1] text-[#78716c] hover:border-white/[0.3] hover:text-white'}`}
                                        >
                                            {EVENT_LABELS[evt] ?? evt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateRuleModal(false)}
                                    className="flex-1 py-2 text-sm border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingRule}
                                    className="flex-1 py-2 text-sm bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] disabled:opacity-50 transition-colors"
                                >
                                    {creatingRule ? 'Creating…' : 'Add rule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
