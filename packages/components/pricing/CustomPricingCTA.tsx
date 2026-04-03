import React from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, Mail } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`glass-card overflow-hidden ${className}`}>
            {children}
        </div>
    )
}

export default function CustomPricingCTA() {
    return (
        <GlassCard className="mt-10">
            <div className="p-8 text-center">
                <div className="inline-flex p-3 rounded-xl bg-primary/20 mb-4">
                    <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Need custom pricing?</h2>
                <p className="mt-3 text-muted-foreground max-w-xl mx-auto leading-relaxed">
                    If the plans we offer just aren't quite what you're looking for, we're here to help. 
                    Reach out to our sales team to discuss tailored solutions that fit your unique needs.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button size="lg" asChild className="group">
                        <Link href="/contact">
                            Contact sales
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="bg-background/50">
                        <a href="mailto:sales@embrly.ca">
                            <Mail className="h-4 w-4 mr-2" />
                            sales@embrly.ca
                        </a>
                    </Button>
                </div>
            </div>
        </GlassCard>
    )
}
