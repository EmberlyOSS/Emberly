'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layouts/dashboard/DashboardLayout';

type HomePageDisplay = 'COMPONENTS' | 'RESPONSE_TIMES' | 'BOTH';

const HOME_PAGE_DISPLAY_OPTIONS: { value: HomePageDisplay; label: string; description: string }[] = [
    {
        value: 'BOTH',
        label: 'Components & response times',
        description: 'Show the component list and the response time graphs.',
    },
    { value: 'COMPONENTS', label: 'Components only', description: 'Hide the response time graphs section.' },
    { value: 'RESPONSE_TIMES', label: 'Response times only', description: 'Hide the component list section.' },
];

export default function AdminSettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        emailNotificationsEnabled: true,
    });
    const [saved, setSaved] = useState(false);

    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
    const [homePageDisplay, setHomePageDisplay] = useState<HomePageDisplay | null>(null);
    const [homePageDisplaySaving, setHomePageDisplaySaving] = useState(false);
    const [pageSettings, setPageSettings] = useState<{ showRecentHistory: boolean; recentHistoryDays: number } | null>(
        null,
    );

    useEffect(() => {
        if (status === 'authenticated') {
            const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMINISTRATOR';
            if (!isAdmin) {
                router.push('/dashboard');
                return;
            }
        }
    }, [session, status, router]);

    useEffect(() => {
        if (!isSuperAdmin) return;
        fetch('/api/admin/settings/status-page')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data) {
                    setHomePageDisplay(data.homePageDisplay);
                    setPageSettings({
                        showRecentHistory: data.showRecentHistory,
                        recentHistoryDays: data.recentHistoryDays,
                    });
                }
            });
    }, [isSuperAdmin]);

    async function handlePageSettingsChange(
        patch: Partial<{ homePageDisplay: HomePageDisplay; showRecentHistory: boolean; recentHistoryDays: number }>,
    ) {
        setHomePageDisplaySaving(true);
        try {
            const res = await fetch('/api/admin/settings/status-page', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data) throw new Error(data?.error ?? 'Failed to save setting');
            setHomePageDisplay(data.homePageDisplay);
            setPageSettings({ showRecentHistory: data.showRecentHistory, recentHistoryDays: data.recentHistoryDays });
            toast.success('Status page updated');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save setting');
        } finally {
            setHomePageDisplaySaving(false);
        }
    }

    const handleHomePageDisplayChange = (value: HomePageDisplay) =>
        handlePageSettingsChange({ homePageDisplay: value });

    const handleToggle = (key: keyof typeof settings) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
        setSaved(false);
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const settingGroups = [
        {
            title: 'System',
            settings: [
                {
                    key: 'maintenanceMode' as const,
                    label: 'Maintenance Mode',
                    description: 'Put the site in maintenance mode',
                },
            ],
        },
        {
            title: 'Notifications',
            settings: [
                {
                    key: 'emailNotificationsEnabled' as const,
                    label: 'Email Notifications',
                    description: 'Send email notifications to administrators',
                },
            ],
        },
    ];

    if (status === 'loading') {
        return (
            <DashboardLayout title="Site Settings" description="Configure system settings">
                <div className="flex items-center justify-center py-24">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Site Settings" description="Configure system settings and preferences">
            {saved && (
                <div className="mb-6 p-3 border border-white/[0.08] rounded-lg text-sm text-white bg-white/[0.03]">
                    Settings saved successfully
                </div>
            )}

            {isSuperAdmin && (
                <div className="glass-card p-5 mb-4">
                    <h2 className="text-xs font-medium text-[#78716c] uppercase tracking-widest mb-1">Status Page</h2>
                    <p className="text-xs text-[#57534e] mb-4">
                        Super admin only: controls what shows on the public home page.
                    </p>
                    {homePageDisplay === null || pageSettings === null ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <div className="space-y-5">
                            <fieldset>
                                <legend className="text-sm font-medium text-white mb-2">Home page sections</legend>
                                <div className="space-y-1">
                                    {HOME_PAGE_DISPLAY_OPTIONS.map((opt) => (
                                        <label key={opt.value} className="flex items-start gap-3 py-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="homePageDisplay"
                                                checked={homePageDisplay === opt.value}
                                                onChange={() => handleHomePageDisplayChange(opt.value)}
                                                disabled={homePageDisplaySaving}
                                                className="accent-white mt-0.5"
                                            />
                                            <span>
                                                <span className="block text-sm text-white">{opt.label}</span>
                                                <span className="block text-xs text-zinc-400 mt-0.5">
                                                    {opt.description}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                            <div className="border-t border-white/[0.06] pt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-white">Recent history</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                        Show recently resolved incidents and completed maintenance on the home page.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <select
                                        aria-label="History window"
                                        value={pageSettings.recentHistoryDays}
                                        disabled={homePageDisplaySaving || !pageSettings.showRecentHistory}
                                        onChange={(e) =>
                                            handlePageSettingsChange({ recentHistoryDays: Number(e.target.value) })
                                        }
                                        className="bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-40"
                                    >
                                        {[7, 14, 30].map((d) => (
                                            <option key={d} value={d}>
                                                Past {d} days
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-label="Show recent history"
                                        aria-checked={pageSettings.showRecentHistory}
                                        disabled={homePageDisplaySaving}
                                        onClick={() =>
                                            handlePageSettingsChange({
                                                showRecentHistory: !pageSettings.showRecentHistory,
                                            })
                                        }
                                        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 disabled:opacity-60 ${pageSettings.showRecentHistory ? 'bg-white' : 'bg-white/[0.1]'}`}
                                    >
                                        <span
                                            className={`absolute top-0.5 w-4 h-4 bg-black rounded-full transition-transform ${pageSettings.showRecentHistory ? 'translate-x-5' : 'translate-x-0.5'}`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4 mb-6">
                {settingGroups.map((group) => (
                    <div key={group.title} className="glass-card p-5">
                        <h2 className="text-xs font-medium text-[#78716c] uppercase tracking-widest mb-4">
                            {group.title}
                        </h2>
                        <div className="space-y-3">
                            {group.settings.map((setting) => (
                                <div key={setting.key} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-white">{setting.label}</p>
                                        <p className="text-xs text-[#78716c] mt-0.5">{setting.description}</p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={settings[setting.key]}
                                        onClick={() => handleToggle(setting.key)}
                                        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${settings[setting.key] ? 'bg-white' : 'bg-white/[0.1]'}`}
                                    >
                                        <span
                                            className={`absolute top-0.5 w-4 h-4 bg-black rounded-full transition-transform ${settings[setting.key] ? 'translate-x-5' : 'translate-x-0.5'}`}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-[#F97316] text-[#140b05] font-semibold text-sm font-medium rounded-lg hover:bg-[#EA580C] transition-colors"
            >
                Save Settings
            </button>
        </DashboardLayout>
    );
}
