'use client';

import { Activity as ActivityIcon, Bell, Boxes, TriangleAlert, Users, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/dashboard/DashboardLayout';
import { useLoading } from '@/components/providers/LoadingProvider';

interface Activity {
    id: string;
    action: string;
    entityType: string;
    entityId?: string;
    entityTitle?: string;
    userName?: string;
    createdAt: string;
}

export default function AdminDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { setIsLoading } = useLoading();
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeIncidents: 0,
        monitorsUp: 0,
        monitorsDown: 0,
        totalComponents: 0,
        upcomingMaintenances: 0,
    });
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [usersRes, incidentsRes, monitorsRes, maintenancesRes, componentsRes, activityRes] =
                await Promise.all([
                    fetch('/api/admin/stats'),
                    fetch('/api/admin/incidents'),
                    fetch('/api/admin/monitors'),
                    fetch('/api/admin/maintenances'),
                    fetch('/api/admin/components'),
                    fetch('/api/admin/activity'),
                ]);
            const [usersData, incidentsData, monitorsData, maintenancesData, componentsData, activityData] =
                await Promise.all([
                    usersRes.json(),
                    incidentsRes.json(),
                    monitorsRes.json(),
                    maintenancesRes.json(),
                    componentsRes.json(),
                    activityRes.json(),
                ]);
            const activeIncidents = Array.isArray(incidentsData)
                ? incidentsData.filter((i: { status: string }) => i.status !== 'RESOLVED').length
                : 0;
            const monitorsUp = Array.isArray(monitorsData)
                ? monitorsData.filter((m: { lastStatus: string }) => m.lastStatus === 'UP').length
                : 0;
            const monitorsDown = Array.isArray(monitorsData)
                ? monitorsData.filter(
                      (m: { lastStatus: string }) => m.lastStatus === 'DOWN' || m.lastStatus === 'DEGRADED',
                  ).length
                : 0;
            const totalComponents = Array.isArray(componentsData) ? componentsData.length : 0;
            const upcomingMaintenances = Array.isArray(maintenancesData)
                ? maintenancesData.filter((m: { status: string }) => m.status !== 'COMPLETED').length
                : 0;
            setStats({
                totalUsers: usersData?.totalUsers ?? 0,
                activeIncidents,
                monitorsUp,
                monitorsDown,
                totalComponents,
                upcomingMaintenances,
            });
            if (Array.isArray(activityData)) setActivities(activityData);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setIsLoading(false);
            setLoadingActivities(false);
        }
    }, [setIsLoading]);

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

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const diff = Date.now() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    const actionLabel = (action: string) => {
        const map: Record<string, string> = {
            CREATE: 'created',
            UPDATE: 'updated',
            DELETE: 'deleted',
            APPROVE: 'approved',
            REJECT: 'rejected',
        };
        return map[action] ?? action.toLowerCase();
    };

    if (status === 'loading') {
        return (
            <DashboardLayout title="Overview" description="Loading…">
                <div className="flex items-center justify-center py-24">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                </div>
            </DashboardLayout>
        );
    }

    const statCards = [
        {
            label: 'Active incidents',
            value: stats.activeIncidents,
            href: '/admin/status/incidents',
            alert: stats.activeIncidents > 0 ? 'text-red-400' : '',
        },
        {
            label: 'Monitors down',
            value: stats.monitorsDown,
            href: '/admin/status/monitors',
            alert: stats.monitorsDown > 0 ? 'text-red-400' : '',
        },
        {
            label: 'Monitors up',
            value: stats.monitorsUp,
            href: '/admin/status/monitors',
            alert: stats.monitorsUp > 0 ? 'text-emerald-400' : '',
        },
        {
            label: 'Active maintenances',
            value: stats.upcomingMaintenances,
            href: '/admin/status/maintenances',
            alert: stats.upcomingMaintenances > 0 ? 'text-orange-400' : '',
        },
        { label: 'Components', value: stats.totalComponents, href: '/admin/status/components', alert: '' },
        { label: 'Users', value: stats.totalUsers, href: '/admin/users', alert: '' },
    ];

    const quickLinks = [
        {
            title: 'Report an incident',
            description: 'Create and post updates to incidents',
            href: '/admin/status/incidents',
            icon: TriangleAlert,
        },
        {
            title: 'Schedule maintenance',
            description: 'Plan and announce maintenance windows',
            href: '/admin/status/maintenances',
            icon: Wrench,
        },
        {
            title: 'Components',
            description: 'Manage service components and groups',
            href: '/admin/status/components',
            icon: Boxes,
        },
        {
            title: 'Monitors',
            description: 'Configure uptime monitors',
            href: '/admin/status/monitors',
            icon: ActivityIcon,
        },
        {
            title: 'Alert channels',
            description: 'Manage alert routing rules',
            href: '/admin/status/alerts',
            icon: Bell,
        },
        { title: 'Users', description: 'Manage admin accounts', href: '/admin/users', icon: Users },
    ];

    return (
        <DashboardLayout title="Overview" description="Status management at a glance">
            <div className="mb-8 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
                {statCards.map((s) => (
                    <Link
                        key={s.label}
                        href={s.href}
                        className="min-w-0 glass-card p-4 transition-colors hover:border-orange-500/30 sm:p-5"
                    >
                        <p className="truncate text-xs text-zinc-400">{s.label}</p>
                        <p
                            className={`mt-1.5 text-2xl font-semibold tabular-nums sm:text-3xl ${s.alert || 'text-white'}`}
                        >
                            {s.value}
                        </p>
                    </Link>
                ))}
            </div>

            <div className="mb-8">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">Quick actions</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                    {quickLinks.map((a) => (
                        <Link
                            key={a.title}
                            href={a.href}
                            className="group flex items-start gap-3 glass-card p-4 transition-colors hover:border-orange-500/30"
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 ring-1 ring-orange-500/20">
                                <a.icon className="h-4 w-4 text-orange-400" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-sm font-medium text-white">{a.title}</span>
                                <span className="mt-0.5 block text-xs text-zinc-400">{a.description}</span>
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="glass-card">
                <h2 className="border-b border-white/[0.06] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-orange-400 sm:px-5">
                    Recent activity
                </h2>
                {loadingActivities ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    </div>
                ) : activities.length === 0 ? (
                    <p className="py-10 text-center text-sm text-zinc-400">No recent activity</p>
                ) : (
                    <ul className="divide-y divide-white/[0.05]">
                        {activities.map((activity) => (
                            <li key={activity.id} className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
                                <p className="min-w-0 text-sm text-zinc-300">
                                    <span className="font-medium text-white">{activity.userName || 'System'}</span>{' '}
                                    {actionLabel(activity.action)} {activity.entityType.toLowerCase()}
                                    {activity.entityTitle && (
                                        <span className="text-zinc-100"> &quot;{activity.entityTitle}&quot;</span>
                                    )}
                                </p>
                                <span className="shrink-0 text-xs text-zinc-500">{formatTime(activity.createdAt)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </DashboardLayout>
    );
}
