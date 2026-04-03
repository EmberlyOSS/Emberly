import Link from 'next/link'

import { getServerSession } from 'next-auth'
import {
    ArrowRight,
    BadgeCheck,
    Briefcase,
    Handshake,
    LogIn,
    Scale,
} from 'lucide-react'

import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import HomeShell from '@/packages/components/layout/home-shell'

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`glass-card overflow-hidden ${className}`}>
            {children}
        </div>
    )
}

export const metadata = buildPageMetadata({
    title: 'Applications',
    description: 'Apply to join the Emberly team, become a partner, request verification, or appeal a ban.',
})

const APPLICATION_CARDS = [
    {
        type: 'staff',
        icon: Briefcase,
        title: 'Join Our Team',
        description: 'We\'re looking for passionate people who want to make a difference.',
        color: 'text-chart-1',
        bg: 'bg-chart-1/10',
        badge: 'Staff Application',
    },
    {
        type: 'partner',
        icon: Handshake,
        title: 'Partner With Us',
        description: 'Collaborate and cross-promote. Grow your audience alongside Emberly.',
        color: 'text-chart-3',
        bg: 'bg-chart-3/10',
        badge: 'Partnership',
    },
    {
        type: 'verification',
        icon: BadgeCheck,
        title: 'Get Verified',
        description: 'Request verification for your profile to build trust with your audience.',
        color: 'text-primary',
        bg: 'bg-primary/10',
        badge: 'Verification',
    },
    {
        type: 'ban-appeal',
        icon: Scale,
        title: 'Appeal a Ban',
        description: 'Request review of an account suspension by a senior team member.',
        color: 'text-chart-5',
        bg: 'bg-chart-5/10',
        badge: 'Ban Appeal',
    },
]

export default async function ApplicationsPage() {
    const session = await getServerSession(authOptions)

    return (
        <HomeShell>
            <div className="container space-y-8">
                {/* Hero */}
                <GlassCard>
                    <div className="p-8 md:p-12">
                        <div className="max-w-2xl">
                            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                                <Briefcase className="h-3 w-3 mr-1" />
                                Applications
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                Get involved with
                                <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                                    Emberly.
                                </span>
                            </h1>
                            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                                Whether you want to join our team, partner with us, get verified, or appeal a decision submit your application below.
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {!session?.user ? (
                    /* Not logged in */
                    <GlassCard>
                        <div className="p-12 flex flex-col items-center text-center gap-4">
                            <div className="p-4 rounded-full bg-muted/50">
                                <LogIn className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Sign in to apply</h2>
                                <p className="mt-2 text-muted-foreground">
                                    You must be logged in to submit an application.
                                </p>
                            </div>
                            <Button asChild>
                                <Link href="/auth/login">
                                    Sign in
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </GlassCard>
                ) : (
                    /* Logged in — show cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {APPLICATION_CARDS.map((card) => (
                            <GlassCard key={card.type} className="group hover:border-primary/30 transition-colors">
                                <div className="p-6 h-full flex flex-col">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${card.bg} shrink-0`}>
                                            <card.icon className={`h-6 w-6 ${card.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="font-semibold text-lg">{card.title}</h2>
                                                <Badge variant="secondary" className="text-xs">
                                                    {card.badge}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                                {card.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border/40">
                                        <Button
                                            className="w-full justify-between group-hover:bg-primary/90"
                                            asChild
                                        >
                                            <Link href={`/applications/${card.type}`}>
                                                Apply now
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </HomeShell>
    )
}
