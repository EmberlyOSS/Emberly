'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface RowAction {
    label: string;
    onSelect: () => void;
    icon?: LucideIcon;
    disabled?: boolean;
    busy?: boolean;
    destructive?: boolean;
    confirmLabel?: string;
    primary?: boolean;
}

interface RowActionsProps {
    actions: (RowAction | false | null | undefined)[];
    breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
    label?: string;
}

const BREAKPOINT = {
    sm: { inline: 'hidden sm:flex', compact: 'flex sm:hidden' },
    md: { inline: 'hidden md:flex', compact: 'flex md:hidden' },
    lg: { inline: 'hidden lg:flex', compact: 'flex lg:hidden' },
    xl: { inline: 'hidden xl:flex', compact: 'flex xl:hidden' },
};

const buttonBase =
    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40';

function buttonClass(action: RowAction, confirming: boolean) {
    if (action.destructive) {
        return `${buttonBase} ${
            confirming
                ? 'border-red-500/50 bg-red-500/15 text-red-300 hover:bg-red-500/25'
                : 'border-white/[0.08] text-zinc-400 hover:border-red-500/40 hover:text-red-400'
        }`;
    }
    return `${buttonBase} border-white/[0.14] text-zinc-100 hover:bg-white/[0.06]`;
}

export function RowActions({ actions, breakpoint = 'lg', label = 'More actions' }: RowActionsProps) {
    const list = actions.filter((a): a is RowAction => Boolean(a));
    const [confirming, setConfirming] = useState<string | null>(null);
    const bp = BREAKPOINT[breakpoint];

    useEffect(() => {
        if (!confirming) return;
        const t = setTimeout(() => setConfirming(null), 4000);
        return () => clearTimeout(t);
    }, [confirming]);

    const run = (a: RowAction) => {
        if (a.destructive && confirming !== a.label) {
            setConfirming(a.label);
            return;
        }
        setConfirming(null);
        a.onSelect();
    };

    const text = (a: RowAction) =>
        a.busy
            ? `${a.label}…`
            : confirming === a.label
              ? (a.confirmLabel ?? `Confirm ${a.label.toLowerCase()}`)
              : a.label;
    const primary = list.filter((a) => a.primary);

    return (
        <div className="flex shrink-0 items-center">
            <div className={`${bp.inline} items-center gap-1.5`}>
                {list.map((a) => (
                    <button
                        key={a.label}
                        type="button"
                        onClick={() => run(a)}
                        disabled={a.disabled || a.busy}
                        className={buttonClass(a, confirming === a.label)}
                    >
                        {a.icon && <a.icon className="h-3.5 w-3.5" aria-hidden="true" />}
                        {text(a)}
                    </button>
                ))}
            </div>

            <div className={`${bp.compact} items-center gap-1.5`}>
                {primary.map((a) => (
                    <button
                        key={a.label}
                        type="button"
                        onClick={() => run(a)}
                        disabled={a.disabled || a.busy}
                        className={buttonClass(a, false)}
                    >
                        {text(a)}
                    </button>
                ))}
                <DropdownMenu.Root onOpenChange={(open) => !open && setConfirming(null)}>
                    <DropdownMenu.Trigger
                        aria-label={label}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] text-zinc-300 outline-none transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:ring-1 focus-visible:ring-white/40 data-[state=open]:bg-white/[0.08] data-[state=open]:text-white"
                    >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            align="end"
                            sideOffset={6}
                            collisionPadding={12}
                            className="z-[60] min-w-[11rem] rounded-lg border border-white/10 bg-zinc-900 p-1 shadow-xl shadow-black/60"
                        >
                            {list.map((a, i) => {
                                const isConfirm = confirming === a.label;
                                return (
                                    <div key={a.label}>
                                        {a.destructive && i > 0 && !list[i - 1].destructive && (
                                            <DropdownMenu.Separator className="my-1 h-px bg-white/[0.08]" />
                                        )}
                                        <DropdownMenu.Item
                                            disabled={a.disabled || a.busy}
                                            onSelect={(e) => {
                                                if (a.destructive && !isConfirm) e.preventDefault();
                                                run(a);
                                            }}
                                            className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 ${
                                                a.destructive
                                                    ? isConfirm
                                                        ? 'bg-red-500/15 text-red-300 data-[highlighted]:bg-red-500/25'
                                                        : 'text-red-400 data-[highlighted]:bg-red-500/10'
                                                    : 'text-zinc-200 data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-white'
                                            }`}
                                        >
                                            {a.icon && <a.icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                                            {text(a)}
                                        </DropdownMenu.Item>
                                    </div>
                                );
                            })}
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            </div>
        </div>
    );
}
