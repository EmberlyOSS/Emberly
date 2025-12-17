import React from 'react'

type Props = {
    title?: string
    children: React.ReactNode
    variant?: 'info' | 'warning' | 'danger'
}

export default function DocsAlert({ title, children, variant = 'info' }: Props) {
    const base = 'rounded-lg p-4 border flex gap-3 items-start'
    const styles: Record<string, string> = {
        info: 'bg-blue-950/40 border-blue-600/30',
        warning: 'bg-yellow-950/30 border-yellow-600/30',
        danger: 'bg-rose-950/30 border-rose-600/30',
    }

    return (
        <div className={`${base} ${styles[variant]}`}>
            <div className="text-sm">
                {title && <div className="font-medium mb-1">{title}</div>}
                <div className="text-sm text-muted-foreground">{children}</div>
            </div>
        </div>
    )
}
