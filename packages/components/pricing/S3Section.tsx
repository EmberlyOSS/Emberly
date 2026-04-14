'use client'

import { useState } from 'react'
import { AlertTriangle, Check, Database, MapPin, ServerOff, Star } from 'lucide-react'
import * as Flags from 'country-flag-icons/react/3x2'

import CheckoutButton from '@/packages/components/payments/CheckoutButton'
import { Badge } from '@/packages/components/ui/badge'

function FlagSVG({ countryCode, className }: { countryCode: string; className?: string }) {
    const Icon = (Flags as any)[countryCode] as React.ComponentType<React.SVGProps<SVGSVGElement>> | undefined
    return Icon ? <Icon className={className} /> : null
}

// Canonical region metadata
const REGION_META: Record<string, { city: string; country: string; countryCode: string; dc: string }> = {
    ewr: { city: 'New York',      country: 'United States',  countryCode: 'US', dc: 'EWR' },
    ord: { city: 'Chicago',       country: 'United States',  countryCode: 'US', dc: 'ORD' },
    lax: { city: 'Los Angeles',   country: 'United States',  countryCode: 'US', dc: 'LAX' },
    sea: { city: 'Seattle',       country: 'United States',  countryCode: 'US', dc: 'SEA' },
    atl: { city: 'Atlanta',       country: 'United States',  countryCode: 'US', dc: 'ATL' },
    mia: { city: 'Miami',         country: 'United States',  countryCode: 'US', dc: 'MIA' },
    dfw: { city: 'Dallas',        country: 'United States',  countryCode: 'US', dc: 'DFW' },
    ams: { city: 'Amsterdam',     country: 'Netherlands',    countryCode: 'NL', dc: 'AMS' },
    lhr: { city: 'London',        country: 'United Kingdom', countryCode: 'GB', dc: 'LHR' },
    fra: { city: 'Frankfurt',     country: 'Germany',        countryCode: 'DE', dc: 'FRA' },
    par: { city: 'Paris',         country: 'France',         countryCode: 'FR', dc: 'PAR' },
    mad: { city: 'Madrid',        country: 'Spain',          countryCode: 'ES', dc: 'MAD' },
    waw: { city: 'Warsaw',        country: 'Poland',         countryCode: 'PL', dc: 'WAW' },
    sgp: { city: 'Singapore',     country: 'Singapore',      countryCode: 'SG', dc: 'SGP' },
    syd: { city: 'Sydney',        country: 'Australia',      countryCode: 'AU', dc: 'SYD' },
    nrt: { city: 'Tokyo',         country: 'Japan',          countryCode: 'JP', dc: 'NRT' },
    itm: { city: 'Osaka',         country: 'Japan',          countryCode: 'JP', dc: 'ITM' },
    bom: { city: 'Mumbai',        country: 'India',          countryCode: 'IN', dc: 'BOM' },
    blr: { city: 'Bangalore',     country: 'India',          countryCode: 'IN', dc: 'BLR' },
    del: { city: 'Delhi',         country: 'India',          countryCode: 'IN', dc: 'DEL' },
    jnb: { city: 'Johannesburg',  country: 'South Africa',   countryCode: 'ZA', dc: 'JNB' },
    mex: { city: 'Mexico City',   country: 'Mexico',         countryCode: 'MX', dc: 'MEX' },
    sao: { city: 'Sao Paulo',     country: 'Brazil',         countryCode: 'BR', dc: 'SAO' },
    yto: { city: 'Toronto',       country: 'Canada',         countryCode: 'CA', dc: 'YTO' },
    sjc: { city: 'Silicon Valley',country: 'United States',  countryCode: 'US', dc: 'SJC' },
}

const TIER_META: Record<string, { description: string; features: string[]; popular?: boolean }> = {
    'storage-bucket-archival': {
        description: 'Ultra low-cost storage for infrequent access, backups, and cold data.',
        features: ['1 TB archived + 100 GB unarchived', '1 TB bandwidth included', 'Lifecycle policy support'],
    },
    'storage-bucket-standard': {
        description: 'General-purpose bulk storage for everyday workloads and media.',
        features: ['1 TB storage + 1 TB bandwidth', '800 IOPS / 600 Mbps', 'HDD+SSD indexed'],
        popular: true,
    },
    'storage-bucket-premium': {
        description: 'Higher IOPS for mixed read/write production workloads.',
        features: ['1 TB storage + 1 TB bandwidth', '1,000 IOPS / 800 Mbps', 'HDD+SSD indexed'],
    },
    'storage-bucket-performance': {
        description: 'Low-latency NVMe for demanding datacenter-grade applications.',
        features: ['NVMe storage + 1 TB bandwidth', '4,000 IOPS / 1 Gbps', 'Low-latency NVMe'],
    },
    'storage-bucket-accelerated': {
        description: 'Maximum throughput NVMe for write-intensive, high-performance workloads.',
        features: ['NVMe storage + 5 TB bandwidth', '10,000 IOPS / 5 Gbps', 'Write-optimised NVMe'],
    },
}

const INCLUDED = [
    'S3-compatible API',
    'No per-bucket overage charges',
    'Removes all platform storage & upload limits',
    'Credentials delivered automatically after purchase',
]

export interface StorageTier {
    slug: string
    name: string
    priceId: string
    priceCents: number
    availableRegions: string[]
}

interface Props {
    tiers: StorageTier[]
}

export default function S3Section({ tiers }: Props) {
    const defaultTier = tiers.find((t) => t.availableRegions.length > 0) ?? tiers[0]
    const [selectedSlug, setSelectedSlug] = useState<string>(defaultTier?.slug ?? '')
    const [selectedRegion, setSelectedRegion] = useState<string>(defaultTier?.availableRegions[0] ?? '')

    const selectedTier = tiers.find((t) => t.slug === selectedSlug) ?? tiers[0]

    const locations = (selectedTier?.availableRegions ?? [])
        .map((id) => {
            const meta = REGION_META[id]
            if (!meta) return null
            return { id, ...meta }
        })
        .filter(Boolean) as Array<{ id: string; city: string; country: string; countryCode: string; dc: string }>

    const effectiveRegion = locations.find((l) => l.id === selectedRegion) ? selectedRegion : (locations[0]?.id ?? '')
    const selectedLocation = locations.find((l) => l.id === effectiveRegion) ?? locations[0]

    const tierWord = selectedSlug.replace('storage-bucket-', '')

    const metadata: Record<string, string> = selectedLocation
        ? {
              type: 'storage-bucket',
              location: selectedLocation.id,
              locationLabel: `${selectedLocation.city}, ${selectedLocation.country}`,
              tier: tierWord,
          }
        : {}

    const hasAnyRegions = tiers.some((t) => t.availableRegions.length > 0)

    if (tiers.length === 0) {
        return (
            <div className="glass-card overflow-hidden mt-10">
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
                    <ServerOff className="h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium text-muted-foreground">Object Storage coming soon</p>
                    <p className="text-sm text-muted-foreground/70 max-w-sm">Check back later or contact us if you need storage now.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="mt-10 space-y-4">
            {/* Header card */}
            <div className="glass-card overflow-hidden border-primary/20 ring-1 ring-primary/10 relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-accent" />
                <div className="relative p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-primary/20 border border-primary/30 shrink-0">
                            <Database className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Object Storage</h2>
                            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                                Dedicated S3-compatible buckets backed by Vultr infrastructure. Choose the performance
                                tier that fits your workload all tiers remove platform storage and upload limits.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {INCLUDED.map((f) => (
                            <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs text-muted-foreground">
                                <Check className="h-3 w-3 text-primary" />
                                {f}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tier cards — same grid + glass-card pattern as PlanSection */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {tiers.map((tier) => {
                    const meta = TIER_META[tier.slug]
                    const isSelected = tier.slug === selectedSlug
                    const noRegions = tier.availableRegions.length === 0
                    const priceDisplay = `$${(tier.priceCents / 100).toFixed(0)}`
                    const tierLabel = tier.name.replace('Object Storage — ', '')

                    return (
                        <div
                            key={tier.slug}
                            className={`glass-card overflow-hidden transition-all duration-300 cursor-pointer ${
                                isSelected
                                    ? 'border-primary/50 shadow-primary/10 ring-1 ring-primary/20'
                                    : noRegions
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'hover:shadow-xl hover:border-border/80'
                            }`}
                            onClick={() => {
                                if (noRegions) return
                                setSelectedSlug(tier.slug)
                                setSelectedRegion(tier.availableRegions[0] ?? '')
                            }}
                        >
                            {isSelected && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-accent" />
                            )}
                            <div className="relative p-6 h-full flex flex-col">
                                <div className="flex items-start justify-between gap-2 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold">{tierLabel}</h3>
                                            {meta?.popular && (
                                                <Badge className="bg-primary/20 text-primary border-primary/30">
                                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                                    Popular
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{meta?.description}</p>
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-extrabold">{priceDisplay}</span>
                                        <span className="text-muted-foreground text-sm">/ mo</span>
                                    </div>
                                </div>

                                <ul className="space-y-2 mt-auto">
                                    {meta?.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {noRegions && (
                                    <p className="mt-3 text-xs text-muted-foreground/60 italic">Not yet available</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Region picker + checkout */}
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

                    {!hasAnyRegions ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/40 bg-muted/10 py-10 text-center">
                            <ServerOff className="h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm font-medium text-muted-foreground">No regions available yet</p>
                            <p className="text-xs text-muted-foreground/70 max-w-xs">
                                Object Storage regions are coming soon. Check back later or contact us if you need storage now.
                            </p>
                        </div>
                    ) : locations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/40 bg-muted/10 py-8 text-center">
                            <ServerOff className="h-6 w-6 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                                No regions available for <strong>{selectedTier?.name.replace('Object Storage — ', '')}</strong> yet.
                            </p>
                            <p className="text-xs text-muted-foreground/60">Select a different tier or check back later.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {locations.map((loc) => (
                                    <button
                                        key={loc.id}
                                        type="button"
                                        onClick={() => setSelectedRegion(loc.id)}
                                        className={`relative text-left p-4 rounded-xl border transition-all duration-200 ${
                                            effectiveRegion === loc.id
                                                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                                                : 'border-border/50 bg-background/30 hover:border-primary/40 hover:bg-primary/5'
                                        }`}
                                    >
                                        {effectiveRegion === loc.id && (
                                            <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
                                        )}
                                        <FlagSVG countryCode={loc.countryCode} className="h-8 w-12 mb-2 rounded-sm" />
                                        <p className="font-semibold text-sm">{loc.city}</p>
                                        <p className="text-xs text-muted-foreground">{loc.country}</p>
                                        <p className="text-xs font-mono text-muted-foreground/50 mt-0.5">{loc.dc}</p>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>
                                    <strong>Automatic setup:</strong> Your{' '}
                                    <strong>{selectedTier?.name.replace('Object Storage — ', '')}</strong> bucket in{' '}
                                    <strong>{selectedLocation?.city}</strong> will be provisioned automatically
                                    after purchase and credentials will be available in your dashboard shortly after.
                                </span>
                            </div>

                            <div className="mt-5">
                                <CheckoutButton
                                    priceId={selectedTier?.priceId ?? ''}
                                    mode="subscription"
                                    label={`Subscribe — ${selectedTier?.name.replace('Object Storage — ', '')} in ${selectedLocation?.city}`}
                                    metadata={metadata}
                                    className="w-full"
                                    disabled={!selectedTier?.priceId || !selectedLocation}
                                    title={!selectedTier?.priceId ? 'Price not configured yet' : undefined}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}