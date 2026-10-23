'use client';

import {
    Activity,
    Bell,
    Boxes,
    ExternalLink,
    Home,
    LogOut,
    Mail,
    Menu,
    Settings,
    TriangleAlert,
    Users,
    Wrench,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { type ReactNode, useEffect, useState } from 'react';
import AmbientBackground from '@/components/ui/AmbientBackground';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface DashboardLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
    /** Buttons etc. aligned to the right of the title */
    actions?: ReactNode;
}

interface NavItem {
    name: string;
    href: string;
    icon: typeof Home;
    exact?: boolean;
}

const adminNav: { label?: string; items: NavItem[] }[] = [
    { items: [{ name: 'Overview', href: '/admin', icon: Home, exact: true }] },
    {
        label: 'Status',
        items: [
            { name: 'Components', href: '/admin/status/components', icon: Boxes },
            { name: 'Incidents', href: '/admin/status/incidents', icon: TriangleAlert },
            { name: 'Maintenance', href: '/admin/status/maintenances', icon: Wrench },
            { name: 'Monitors', href: '/admin/status/monitors', icon: Activity },
        ],
    },
    {
        label: 'Notifications',
        items: [
            { name: 'Alert channels', href: '/admin/status/alerts', icon: Bell },
            { name: 'Subscribers', href: '/admin/subscribers', icon: Mail },
        ],
    },
    {
        label: 'Manage',
        items: [
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'Settings', href: '/admin/settings', icon: Settings },
        ],
    },
];

function isActive(pathname: string, item: NavItem) {
    return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function activeItem(pathname: string): NavItem | undefined {
    return adminNav.flatMap((g) => g.items).find((i) => isActive(pathname, i));
}

function Sidebar({ onClose }: { onClose?: () => void }) {
    const { data: session } = useSession();
    const pathname = usePathname() ?? '';
    const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMINISTRATOR';

    return (
        <div className="flex h-full flex-col">
            <div className="flex h-14 items-center justify-between px-4">
                <Link href="/admin" className="flex items-center gap-2.5" onClick={onClose}>
                    <BrandLogo size={22} />
                    <span className="text-sm font-bold tracking-tight text-white">Emberly</span>
                    <span className="rounded-md border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[11px] font-medium text-orange-300">
                        Admin
                    </span>
                </Link>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="-mr-1 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
            </div>

            <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3" aria-label="Admin">
                {isAdmin &&
                    adminNav.map((group, gi) => (
                        <div key={group.label ?? gi} className="space-y-0.5">
                            {group.label && (
                                <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                                    {group.label}
                                </p>
                            )}
                            {group.items.map((item) => {
                                const active = isActive(pathname, item);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        aria-current={active ? 'page' : undefined}
                                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                                            active
                                                ? 'bg-stone-800 font-medium text-white'
                                                : 'text-zinc-400 hover:bg-stone-800/50 hover:text-white'
                                        }`}
                                    >
                                        <item.icon
                                            className={`h-4 w-4 shrink-0 ${active ? 'text-orange-400' : 'text-zinc-500'}`}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
            </nav>

            <div className="space-y-1 border-t border-white/[0.06] px-3 py-3">
                <Link
                    href="/"
                    target="_blank"
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:bg-stone-800/50 hover:text-white"
                >
                    <ExternalLink className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                    View status page
                </Link>
                <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                    {session?.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={session.user.image}
                            alt=""
                            width={28}
                            height={28}
                            className="h-7 w-7 shrink-0 rounded-full border border-white/[0.08] object-cover"
                        />
                    ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-semibold text-orange-300 ring-1 ring-orange-500/20">
                            {(session?.user?.name || session?.user?.email || 'U')[0].toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">{session?.user?.name || 'User'}</p>
                        <p className="truncate text-xs capitalize text-zinc-500">
                            {session?.user?.role?.toLowerCase().replace('_', ' ')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: '/' })}
                        aria-label="Sign out"
                        title="Sign out"
                        className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children, title, description, actions }: DashboardLayoutProps) {
    const { status } = useSession();
    const pathname = usePathname() ?? '';
    const [mobileOpen, setMobileOpen] = useState(false);
    const ActiveIcon = activeItem(pathname)?.icon;

    useEffect(() => {
        if (pathname) setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    if (status === 'loading') {
        return (
            <div className="relative flex min-h-screen items-center justify-center">
                <AmbientBackground />
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/[0.1] border-t-orange-400" />
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen">
            <AmbientBackground />

            {/* Desktop: floating glass sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 p-3 md:block">
                <div className="glass-card h-full">
                    <Sidebar />
                </div>
            </aside>

            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] p-3 transition-transform duration-200 ease-out md:hidden ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                inert={!mobileOpen}
            >
                <div className="glass-card h-full">
                    <Sidebar onClose={() => setMobileOpen(false)} />
                </div>
            </aside>

            <div className="min-w-0 flex-1 md:ml-64">
                {/* Mobile: slim bar to open the sidebar */}
                <div className="sticky top-0 z-20 px-3 pt-3 md:hidden">
                    <div className="glass-card flex h-12 items-center gap-2 px-2">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                            aria-label="Open menu"
                            aria-expanded={mobileOpen}
                        >
                            <Menu className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <BrandLogo size={18} />
                        <span className="truncate text-sm font-semibold text-white">{title ?? 'Admin'}</span>
                    </div>
                </div>

                <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-8 md:pt-8">
                    {title && (
                        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                {ActiveIcon && (
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                                        <ActiveIcon className="h-5 w-5 text-orange-400" aria-hidden="true" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
                                    {description && <p className="text-sm text-zinc-400">{description}</p>}
                                </div>
                            </div>
                            {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
                        </header>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}
