'use client'

import { Sparkles, Zap } from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'

export default function PricingHero() {
    return (
        <div className="text-center space-y-6">
            <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Simple Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                Plans that scale
                <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                    with you.
                </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Flexible plans for individuals, teams, and self hosted deployments. Start free or scale up 
                with advanced features like custom domains, SSO, and team management.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Cancel anytime</span>
                </div>
            </div>
        </div>
    )
}
