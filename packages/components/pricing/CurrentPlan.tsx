import React from 'react'
import { Crown, ExternalLink } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`glass-card overflow-hidden ${className}`}>
            {children}
        </div>
    )
}

type Props = {
    productId: string
    productName?: string
    status: string
}

export default function CurrentPlan({ productId, productName, status }: Props) {
    const statusDisplay = status === 'active' ? 'Active' : status === 'trialing' ? 'Trial' : status
    const statusColor = status === 'active' || status === 'trialing' 
        ? 'text-green-500 bg-green-500/10' 
        : 'text-muted-foreground bg-muted'

    return (
        <GlassCard>
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/20">
                        <Crown className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Current plan</div>
                        <div className="font-semibold text-lg">{productName || productId}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {statusDisplay}
                    </span>
                    <Button asChild size="sm" className="group">
                        <a href="/api/payments/portal">
                            Manage billing
                            <ExternalLink className="h-3.5 w-3.5 ml-2 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                    </Button>
                </div>
            </div>
        </GlassCard>
    )
}
