import { Suspense } from 'react'
import Link from 'next/link'

import { Bell, ExternalLink, Shield } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import HomeShell from '@/packages/components/layout/home-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { getFullStatusData } from '@/packages/lib/instatus'

import StatusPageClient from './client'

export const metadata = buildPageMetadata({
    title: 'System Status',
    description:
        'Real time system status and incident history for the Emberly services.',
})

// Revalidate every 60 seconds
export const revalidate = 60

// Reusable GlassCard component (consistent with other pages)
function GlassCard({
    children,
    className = '',
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={`glass-card overflow-hidden ${className}`}
        >
            {children}
        </div>
    )
}

async function StatusContent() {
    const data = await getFullStatusData()

    if (!data) {
        return (
            <GlassCard>
                <div className="p-8 text-center">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold">
                        Unable to fetch status
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Please check our Instatus page directly for current
                        status.
                    </p>
                    <Button className="mt-4" asChild>
                        <Link
                            href="https://status.emberly.site"
                            target="_blank"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Status Page
                        </Link>
                    </Button>
                </div>
            </GlassCard>
        )
    }

    return <StatusPageClient initialData={data} />
}

export default function StatusPage() {
    return (
        <HomeShell>
            <div className="container space-y-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">
                            <Shield className="h-3 w-3 mr-1" />
                            System Status
                        </Badge>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            Service Status
                        </h1>
                        <p className="mt-3 text-muted-foreground max-w-2xl">
                            Real time status and incident history for all
                            the Emberly services. Subscribe to updates or check our
                            Instatus page for detailed information.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" className="bg-background/50" asChild>
                            <Link
                                href="https://status.emberly.site"
                                target="_blank"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Instatus Page
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link
                                href="https://status.emberly.site/subscribe"
                                target="_blank"
                            >
                                <Bell className="h-4 w-4 mr-2" />
                                Subscribe
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Status Content */}
                <Suspense
                    fallback={
                        <div className="space-y-6 animate-pulse">
                            <GlassCard>
                                <div className="p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-muted" />
                                        <div className="space-y-2">
                                            <div className="h-8 w-64 bg-muted rounded" />
                                            <div className="h-4 w-40 bg-muted rounded" />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                            <GlassCard>
                                <div className="p-6">
                                    <div className="h-6 w-32 bg-muted rounded mb-6" />
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div
                                                key={i}
                                                className="h-14 bg-muted/50 rounded-xl"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    }
                >
                    <StatusContent />
                </Suspense>

                {/* Footer Info */}
                <GlassCard>
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h3 className="font-semibold">
                                    Need to report an issue?
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    If you're experiencing problems not shown
                                    here, please let us know.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="bg-background/50"
                                    asChild
                                >
                                    <Link href="/contact">Contact Support</Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="bg-background/50"
                                    asChild
                                >
                                    <Link href="/discord">Join Discord</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </HomeShell>
    )
}
