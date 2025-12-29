import React from 'react'
import { Info, AlertTriangle, AlertCircle } from 'lucide-react'

type Props = {
    title?: string
    children: React.ReactNode
    variant?: 'info' | 'warning' | 'danger'
}

const variantConfig = {
    info: {
        bg: 'bg-blue-500/10 dark:bg-blue-500/5',
        border: 'border-blue-500/20',
        icon: Info,
        iconColor: 'text-blue-400',
    },
    warning: {
        bg: 'bg-yellow-500/10 dark:bg-yellow-500/5',
        border: 'border-yellow-500/20',
        icon: AlertTriangle,
        iconColor: 'text-yellow-400',
    },
    danger: {
        bg: 'bg-rose-500/10 dark:bg-rose-500/5',
        border: 'border-rose-500/20',
        icon: AlertCircle,
        iconColor: 'text-rose-400',
    },
}

export default function DocsAlert({ title, children, variant = 'info' }: Props) {
    const config = variantConfig[variant]
    const Icon = config.icon

    return (
        <div className={`relative rounded-xl ${config.bg} backdrop-blur-sm border ${config.border} overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative p-4 flex gap-3 items-start">
                <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-4 w-4 ${config.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                    {title && <div className="font-medium mb-1">{title}</div>}
                    <div className="text-sm text-muted-foreground">{children}</div>
                </div>
            </div>
        </div>
    )
}
