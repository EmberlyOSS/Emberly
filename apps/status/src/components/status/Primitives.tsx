import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { componentPath, type Tone } from '@/lib/status-ui';

export function StatusDot({ tone, pulse = false, size = 'sm' }: { tone: Tone; pulse?: boolean; size?: 'sm' | 'md' }) {
    const dim = size === 'md' ? 'h-2.5 w-2.5' : 'h-2 w-2';
    return (
        <span className={`relative inline-flex shrink-0 ${dim}`} aria-hidden="true">
            {pulse && <span className={`absolute inset-0 rounded-full ${tone.dot} opacity-60 animate-ping`} />}
            <span className={`relative inline-flex rounded-full ${dim} ${tone.dot}`} />
        </span>
    );
}

export function StatusBadge({ tone, pulse = false }: { tone: Tone; pulse?: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone.soft} ${tone.text}`}
        >
            <StatusDot tone={tone} pulse={pulse} />
            {tone.label}
        </span>
    );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`glass-card ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-sky">{children}</h2>
            {action}
        </div>
    );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="-ml-1 mb-6 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm text-zinc-400 transition-colors hover:text-white"
        >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {children}
        </Link>
    );
}

export function PageShell({ children, width = 'md' }: { children: ReactNode; width?: 'md' | 'lg' }) {
    return (
        <div
            className={`mx-auto w-full px-4 pb-20 pt-8 sm:px-6 sm:pt-12 ${width === 'lg' ? 'max-w-4xl' : 'max-w-3xl'}`}
        >
            {children}
        </div>
    );
}

export function PageHeader({
    title,
    description,
    eyebrow,
    action,
}: {
    title: ReactNode;
    description?: ReactNode;
    eyebrow?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <header className="mb-8 sm:mb-10">
            {eyebrow && <div className="mb-3">{eyebrow}</div>}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        {title}
                    </h1>
                    {description && <div className="mt-2 text-sm text-zinc-400">{description}</div>}
                </div>
                {action}
            </div>
        </header>
    );
}

export function EmptyState({ tone, children }: { tone?: Tone; children: ReactNode }) {
    return (
        <Card className="flex items-center gap-3 px-5 py-4">
            {tone && <StatusDot tone={tone} />}
            <p className="text-sm text-zinc-300">{children}</p>
        </Card>
    );
}

export interface ChipComponent {
    id: string;
    name: string;
    groupName?: string | null;
}

export function ComponentChips({ components, link = true }: { components: ChipComponent[]; link?: boolean }) {
    if (!components.length) return null;
    return (
        <div className="flex min-w-0 flex-wrap gap-1.5">
            {components.map((c) => {
                const label = componentPath(c.name, c.groupName);
                const cls =
                    'max-w-full truncate rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-xs text-zinc-300';
                return link ? (
                    <Link
                        key={c.id}
                        href={`/components/${c.id}`}
                        className={`${cls} transition-colors hover:border-white/20 hover:text-white`}
                    >
                        {label}
                    </Link>
                ) : (
                    <span key={c.id} className={cls}>
                        {label}
                    </span>
                );
            })}
        </div>
    );
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <output
            className={`inline-block animate-spin rounded-full border-2 border-white/15 border-t-white/80 ${className}`}
            aria-label="Loading"
        />
    );
}

export function StatTile({
    label,
    value,
    hint,
    valueClass = 'text-white',
}: {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    valueClass?: string;
}) {
    return (
        <Card className="min-w-0 p-4 sm:p-5">
            <p className="truncate text-xs text-zinc-400">{label}</p>
            <p className={`mt-1.5 truncate text-xl font-semibold tabular-nums sm:text-2xl ${valueClass}`}>{value}</p>
            {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
        </Card>
    );
}

export function RangeTabs<T extends string>({
    ranges,
    value,
    onChange,
}: {
    ranges: readonly T[];
    value: T;
    onChange: (r: T) => void;
}) {
    return (
        <div className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5" role="tablist">
            {ranges.map((r) => (
                <button
                    key={r}
                    type="button"
                    role="tab"
                    aria-selected={value === r}
                    onClick={() => onChange(r)}
                    className={`rounded-md px-3 py-1 text-xs font-medium tabular-nums transition-colors ${
                        value === r ? 'bg-brand-blue text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                    }`}
                >
                    {r}
                </button>
            ))}
        </div>
    );
}
