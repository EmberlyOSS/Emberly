import React from 'react'
import { Button } from '@/packages/components/ui/button'

export default function CustomPricingCTA() {
    return (
        <section className="mt-12">
            <div className="rounded-2xl border border-border/40 bg-background/60 p-6 shadow-sm text-center space-y-3">
                <h2 className="text-2xl font-semibold">Need custom pricing?</h2>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    If the plans we offer just aren't quite what you're looking for, we're here to help. Reach out to our sales team to discuss tailored solutions that fit your unique needs.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <Button asChild>
                        <a href="/contact">Contact sales</a>
                    </Button>
                    <Button variant="outline" asChild>
                        <a href="mailto:sales@embrly.ca">sales@embrly.ca</a>
                    </Button>
                </div>
            </div>
        </section>
    )
}
