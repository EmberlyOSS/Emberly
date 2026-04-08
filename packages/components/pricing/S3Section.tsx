'use client'

import { useState } from 'react'
import { AlertTriangle, Check, Database, MapPin } from 'lucide-react'

import CheckoutButton from '@/packages/components/payments/CheckoutButton'

const LOCATIONS = [
    { id: 'hel1', city: 'Helsinki',    country: 'Finland',  flag: '🇫🇮', dc: 'HEL1' },
    { id: 'fsn1', city: 'Falkenstein', country: 'Germany',  flag: '🇩🇪', dc: 'FSN1' },
    { id: 'nbg1', city: 'Nuremberg',   country: 'Germany',  flag: '🇩🇪', dc: 'NBG1' },
]

const FEATURES = [
    'S3-compatible API',
    'No per-bucket charges',
    'Removes all platform storage & upload limits',
    'Dedicated credentials emailed within 24 hours',
    'Backups included available on request',
]

interface Props {
    priceId: string | null | undefined
}

export default function S3Section({ priceId }: Props) {
    const [location, setLocation] = useState(LOCATIONS[0].id)

    const selectedLocation = LOCATIONS.find((l) => l.id === location)!

    const metadata: Record<string, string> = {
        type: 'storage-bucket',
        location: selectedLocation.id,
        locationLabel: `${selectedLocation.city}, ${selectedLocation.country}`,
    }

    return (
        <div className="mt-10 space-y-4">
            {/* ── Main pricing card ─────────────────────────────────── */}
            <div className="glass-card overflow-hidden border-primary/20 ring-1 ring-primary/10 relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-accent" />
                <div className="relative p-8">
                    {/* Header + headline price */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-primary/20 border border-primary/30 shrink-0">
                                <Database className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Object Storage</h2>
                                <p className="text-muted-foreground mt-1 max-w-lg text-sm leading-relaxed">
                                    S3-compatible buckets. Pay only for what you use with a hard cap so you're never hit with a surprise bill.
                                </p>
                            </div>
                        </div>

                        <div className="text-left lg:text-right shrink-0">
                            <div className="flex items-baseline gap-1 lg:justify-end">
                                <span className="text-4xl font-extrabold">$10</span>
                                <span className="text-muted-foreground text-sm">/ month max</span>
                            </div>
                            <p className="text-sm text-primary mt-1">$0.0110 / runtime hour</p>
                        </div>
                    </div>

                    {/* Columns: rates + features */}
                    <div className="mt-8 grid md:grid-cols-2 gap-10">
                        {/* Left — rate breakdown */}
                        <div>
                            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
                                Included per runtime hour
                            </p>
                            <ul className="space-y-2 mb-6">
                                {[
                                    '1 TB of object storage',
                                    '1.5 GB of outbound traffic',
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm">
                                        <div className="p-1 rounded-full bg-primary/20 shrink-0">
                                            <Check className="h-3 w-3 text-primary" />
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
                                Overage rates
                            </p>
                            <div className="rounded-xl border border-border/50 overflow-hidden text-sm">
                                <div className="flex justify-between px-4 py-2.5 bg-muted/20 border-b border-border/40">
                                    <span className="text-muted-foreground">Additional storage</span>
                                    <span className="font-mono font-semibold">$0.0100 / TB·h</span>
                                </div>
                                <div className="flex justify-between px-4 py-2.5 bg-muted/20 border-b border-border/40">
                                    <span className="text-muted-foreground">Additional traffic</span>
                                    <span className="font-mono font-semibold">$1.00 / TB</span>
                                </div>
                                <div className="flex justify-between px-4 py-2.5 bg-muted/20">
                                    <span className="text-muted-foreground">Min. billable object</span>
                                    <span className="font-mono font-semibold">64 kB</span>
                                </div>
                            </div>
                        </div>

                        {/* Right — features */}
                        <div>
                            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
                                What's included
                            </p>
                            <ul className="space-y-3">
                                {FEATURES.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm">
                                        <div className="mt-0.5 p-1 rounded-full bg-primary/20 shrink-0">
                                            <Check className="h-3 w-3 text-primary" />
                                        </div>
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Location + CTA card ───────────────────────────────── */}
            <div className="glass-card overflow-hidden">
                <div className="p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="font-semibold">Choose a datacenter region</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-5">
                        Your bucket will be provisioned in the selected region. The region cannot be
                        changed after purchase a new subscription is required to migrate.
                    </p>

                    <div className="grid sm:grid-cols-3 gap-3">
                        {LOCATIONS.map((loc) => (
                            <button
                                key={loc.id}
                                type="button"
                                onClick={() => setLocation(loc.id)}
                                className={`relative text-left p-4 rounded-xl border transition-all duration-200 ${
                                    location === loc.id
                                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                                        : 'border-border/50 bg-background/30 hover:border-primary/40 hover:bg-primary/5'
                                }`}
                            >
                                {location === loc.id && (
                                    <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
                                )}
                                <span className="text-2xl block mb-2">{loc.flag}</span>
                                <p className="font-semibold text-sm">{loc.city}</p>
                                <p className="text-xs text-muted-foreground">{loc.country}</p>
                                <p className="text-xs font-mono text-muted-foreground/50 mt-0.5">{loc.dc}</p>
                            </button>
                        ))}
                    </div>

                    {/* Setup notice */}
                    <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                            <strong>Setup required:</strong> After purchase, our team will configure your
                            bucket in <strong>{selectedLocation.city}</strong> and send credentials to
                            your email within 12–24 hours.
                        </span>
                    </div>

                    {/* Subscribe */}
                    <div className="mt-5">
                        <CheckoutButton
                            priceId={priceId ?? ''}
                            mode="subscription"
                            label={`Subscribe in ${selectedLocation.city}, ${selectedLocation.country}`}
                            metadata={metadata}
                            className="w-full"
                            disabled={!priceId}
                            title={!priceId ? 'Price not configured yet' : undefined}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
