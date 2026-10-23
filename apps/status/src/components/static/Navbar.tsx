'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LayoutDashboard, LogOut, Menu, Shield, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { FaDiscord, FaGithub, FaGlobe } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { useSiteConfig } from '@/components/providers/SiteConfigProvider';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { companyInfo, mainNavItems } from '@/constants/navigation';
import { hasPermission } from '@/lib/permissions';

const socialLinks = [
    { name: 'GitHub', href: companyInfo.contact.socialMedia.github, icon: FaGithub },
    { name: 'Discord', href: companyInfo.contact.socialMedia.discord, icon: FaDiscord },
    { name: 'X', href: companyInfo.contact.socialMedia.twitter, icon: FaXTwitter },
    { name: 'Website', href: companyInfo.contact.socialMedia.website, icon: FaGlobe },
];

function Avatar({ name, image, size = 20 }: { name?: string | null; image?: string | null; size?: number }) {
    if (image) {
        // eslint-disable-next-line @next/next/no-img-element
        return (
            <img
                src={image}
                alt=""
                width={size}
                height={size}
                className="rounded-full object-cover"
                style={{ width: size, height: size }}
            />
        );
    }
    return (
        <span
            className="flex items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-white"
            style={{ width: size, height: size }}
        >
            {(name || '?')[0].toUpperCase()}
        </span>
    );
}

export default function Navbar() {
    const { data: session, status } = useSession();
    const { config } = useSiteConfig();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 8);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (pathname) setMobileMenuOpen(false);
    }, [pathname]);

    const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);
    const showAuth = isClient && !config.isLoading && config.authEnabled && status !== 'loading';
    const isAdmin = hasPermission(session?.user?.role, 'canAccessAdmin');
    const displayName = session?.user?.name || session?.user?.email;

    return (
        <header className="sticky top-0 z-50 px-4 pt-4">
            <div
                className={`glass-card mx-auto max-w-5xl px-4 transition-shadow duration-200 sm:px-5 ${
                    scrolled || mobileMenuOpen ? 'shadow-lg shadow-black/40' : ''
                }`}
            >
                <div className="flex h-14 items-center justify-between gap-4">
                    <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-md">
                        <BrandLogo size={22} />
                        <span className="text-sm font-bold tracking-tight text-white">
                            Emberly
                        </span>
                        <span className="hidden rounded-md border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[11px] font-medium text-orange-300 sm:inline">
                            Status
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
                        {mainNavItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                aria-current={isActive(item.path) ? 'page' : undefined}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                    isActive(item.path)
                                        ? 'bg-stone-800 text-white'
                                        : 'text-zinc-400 hover:bg-stone-800/60 hover:text-white'
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-3 md:flex">
                        <div className="flex items-center gap-3">
                            {socialLinks.map((s) => (
                                <a
                                    key={s.name}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.name}
                                    className="text-zinc-500 transition-colors hover:text-white"
                                >
                                    <s.icon size={15} />
                                </a>
                            ))}
                        </div>

                        {showAuth &&
                            (session ? (
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger className="flex items-center gap-2 rounded-lg border border-white/[0.08] py-1 pl-1.5 pr-2 text-sm text-zinc-300 outline-none transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:ring-1 focus-visible:ring-white/40 data-[state=open]:bg-white/[0.05]">
                                        <Avatar name={displayName} image={session.user?.image} />
                                        <span className="max-w-[10rem] truncate">{displayName}</span>
                                        <ChevronDown className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Portal>
                                        <DropdownMenu.Content
                                            align="end"
                                            sideOffset={6}
                                            className="z-[60] min-w-[11rem] rounded-lg border border-white/10 bg-zinc-900 p-1 shadow-xl shadow-black/50"
                                        >
                                            <DropdownMenu.Item asChild>
                                                <Link
                                                    href="/dashboard"
                                                    className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-zinc-300 outline-none data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-white"
                                                >
                                                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Account
                                                </Link>
                                            </DropdownMenu.Item>
                                            {isAdmin && (
                                                <DropdownMenu.Item asChild>
                                                    <Link
                                                        href="/admin"
                                                        className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-zinc-300 outline-none data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-white"
                                                    >
                                                        <Shield className="h-4 w-4" aria-hidden="true" /> Admin
                                                    </Link>
                                                </DropdownMenu.Item>
                                            )}
                                            <DropdownMenu.Separator className="my-1 h-px bg-white/[0.08]" />
                                            <DropdownMenu.Item
                                                onSelect={() => signOut()}
                                                className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-zinc-300 outline-none data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-white"
                                            >
                                                <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                </DropdownMenu.Root>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <Link
                                        href="/auth/signin"
                                        className="rounded-md px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href="/auth/signup"
                                        className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-semibold text-[#140b05] transition-colors hover:bg-[#EA580C]"
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            ))}
                    </div>

                    <button
                        type="button"
                        className="-mr-1.5 rounded-md p-1.5 text-zinc-300 transition-colors hover:text-white md:hidden"
                        onClick={() => setMobileMenuOpen((v) => !v)}
                        aria-expanded={mobileMenuOpen}
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="border-t border-white/[0.08] py-3 md:hidden">
                        <nav className="flex flex-col gap-0.5" aria-label="Main">
                            {[{ name: 'Status', path: '/' }, ...mainNavItems].map((item) => {
                                const active = item.path === '/' ? pathname === '/' : isActive(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        aria-current={active ? 'page' : undefined}
                                        className={`rounded-md px-3 py-2.5 text-[15px] transition-colors ${
                                            active
                                                ? 'bg-white/[0.08] text-white'
                                                : 'text-zinc-300 hover:bg-white/[0.05] hover:text-white'
                                        }`}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-3">
                            {showAuth &&
                                (session ? (
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2.5 px-3 py-2">
                                            <Avatar name={displayName} image={session.user?.image} size={24} />
                                            <span className="truncate text-sm text-white">{displayName}</span>
                                        </div>
                                        <Link
                                            href="/dashboard"
                                            className="rounded-md px-3 py-2.5 text-[15px] text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                                        >
                                            Account
                                        </Link>
                                        {isAdmin && (
                                            <Link
                                                href="/admin"
                                                className="rounded-md px-3 py-2.5 text-[15px] text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                                            >
                                                Admin
                                            </Link>
                                        )}
                                        <button
                                            type="button"
                                            className="rounded-md px-3 py-2.5 text-left text-[15px] text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                signOut();
                                            }}
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link
                                            href="/auth/signin"
                                            className="rounded-md border border-white/[0.1] px-4 py-2.5 text-center text-sm text-zinc-200 hover:bg-white/[0.05]"
                                        >
                                            Sign in
                                        </Link>
                                        <Link
                                            href="/auth/signup"
                                            className="rounded-lg bg-brand-blue px-4 py-2.5 text-center text-sm font-semibold text-[#140b05] hover:bg-[#EA580C]"
                                        >
                                            Sign up
                                        </Link>
                                    </div>
                                ))}
                            <div className="flex items-center gap-5 px-3 pt-2">
                                {socialLinks.map((s) => (
                                    <a
                                        key={s.name}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={s.name}
                                        className="text-zinc-500 transition-colors hover:text-white"
                                    >
                                        <s.icon size={17} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
