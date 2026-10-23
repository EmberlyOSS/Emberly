'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RowActions } from '@/components/admin/RowActions';
import DashboardLayout from '@/components/layouts/dashboard/DashboardLayout';

const EVENT_LABELS: Record<string, string> = {
    INCIDENT_CREATED: 'New incidents',
    INCIDENT_UPDATED: 'Incident updates',
    INCIDENT_RESOLVED: 'Incidents resolved',
    MAINTENANCE_SCHEDULED: 'Maintenance scheduled',
    MAINTENANCE_UPDATED: 'Maintenance updates',
};

interface Subscriber {
    id: string;
    email: string;
    verified: boolean;
    createdAt: string;
    events: string[];
    components: { id: string; name: string }[];
    groups: { id: string; name: string }[];
}

export default function AdminStatusSubscribersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchSubscribers = async () => {
        try {
            const res = await fetch('/api/admin/status-subscribers');
            const data = await res.json();
            if (Array.isArray(data)) setSubscribers(data);
        } catch {
            toast.error('Failed to load subscribers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMINISTRATOR';
            if (!isAdmin) {
                router.push('/dashboard');
                return;
            }
            fetchSubscribers();
        }
    }, [session, status, router]);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/admin/status-subscribers?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSubscribers((prev) => prev.filter((s) => s.id !== id));
                toast.success('Subscriber removed.');
            } else {
                toast.error('Failed to remove subscriber.');
            }
        } catch {
            toast.error('Network error.');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const verified = subscribers.filter((s) => s.verified);
    const pending = subscribers.filter((s) => !s.verified);

    return (
        <DashboardLayout title="Subscribers" description="People receiving status notifications by email">
            <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
                {[
                    { label: 'Total', value: subscribers.length },
                    { label: 'Verified', value: verified.length },
                    { label: 'Pending', value: pending.length },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="min-w-0 glass-card p-3 sm:p-5"
                    >
                        <p className="mb-1 truncate text-xs text-zinc-400">{s.label}</p>
                        <p className="text-xl font-semibold tabular-nums text-white sm:text-2xl">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="overflow-hidden glass-card">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    </div>
                ) : subscribers.length === 0 ? (
                    <p className="p-12 text-center text-sm text-zinc-400">No subscribers yet.</p>
                ) : (
                    <ul className="divide-y divide-white/[0.05]">
                        {subscribers.map((sub) => {
                            const scopeNames = [...sub.groups.map((g) => g.name), ...sub.components.map((c) => c.name)];
                            return (
                                <li key={sub.id} className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
                                    <div className="min-w-0 flex-1">
                                        <p className="break-all font-mono text-sm text-white">{sub.email}</p>
                                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
                                            <span className={sub.verified ? 'text-emerald-400' : 'text-amber-400'}>
                                                {sub.verified ? 'Verified' : 'Pending verification'}
                                            </span>
                                            <span>·</span>
                                            <span>Subscribed {formatDate(sub.createdAt)}</span>
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            <span className="max-w-full truncate rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-xs text-zinc-300">
                                                {scopeNames.length ? scopeNames.join(', ') : 'All services'}
                                            </span>
                                            {sub.events.map((ev) => (
                                                <span
                                                    key={ev}
                                                    className="rounded-md border border-white/[0.06] px-2 py-0.5 text-xs text-zinc-400"
                                                >
                                                    {EVENT_LABELS[ev] ?? ev}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <RowActions
                                        breakpoint="sm"
                                        label={`Actions for ${sub.email}`}
                                        actions={[
                                            {
                                                label: 'Remove',
                                                icon: Trash2,
                                                destructive: true,
                                                confirmLabel: 'Confirm remove',
                                                busy: deletingId === sub.id,
                                                onSelect: () => handleDelete(sub.id),
                                            },
                                        ]}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </DashboardLayout>
    );
}
