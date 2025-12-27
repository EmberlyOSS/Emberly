import Image from 'next/image'
import Link from 'next/link'

import {
    ArrowLeft,
    BookOpen,
    Check,
    Copy,
    Download,
    ExternalLink,
    Github,
    Mail,
    Palette,
    Shield,
    Sparkles,
    Type,
    X,
} from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import HomeShell from '@/packages/components/layout/home-shell'

// Reusable GlassCard component
function GlassCard({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
    return (
        <div id={id} className={`relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${className}`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative">{children}</div>
        </div>
    )
}

const BRAND_ASSETS = [
    {
        title: 'Primary Logo',
        description: 'Full-color logo for light and dark backgrounds.',
        preview: 'primary',
        theme: 'dark',
        download: '/icon.svg',
    },
    {
        title: 'Icon Mark',
        description: 'Minimal ember icon for favicons and avatars.',
        preview: 'icon',
        theme: 'light',
        download: '/icon.svg',
    },
    {
        title: 'Wordmark',
        description: 'Text-only logo for inline use and headers.',
        preview: 'wordmark',
        theme: 'dark',
        download: '/icon.svg',
    },
    {
        title: 'Monochrome',
        description: 'Single-color version for limited color contexts.',
        preview: 'mono',
        theme: 'light',
        download: '/icon.svg',
    },
]

const BRAND_COLORS = [
    { name: 'Ember', value: '#F97316', rgb: '249, 115, 22', usage: 'Primary brand color, CTAs' },
    { name: 'Amber', value: '#F59E0B', rgb: '245, 158, 11', usage: 'Accents, highlights' },
    { name: 'Midnight', value: '#0F172A', rgb: '15, 23, 42', usage: 'Dark backgrounds' },
    { name: 'Slate', value: '#64748B', rgb: '100, 116, 139', usage: 'Body text, muted' },
    { name: 'Cream', value: '#F8FAFC', rgb: '248, 250, 252', usage: 'Light backgrounds' },
]

const TYPOGRAPHY = [
    { name: 'Headings', family: 'Inter', weight: 'Bold (700-800)', usage: 'Page titles, section headers' },
    { name: 'Body', family: 'Inter', weight: 'Regular (400)', usage: 'Paragraphs, descriptions' },
    { name: 'UI Elements', family: 'Inter', weight: 'Medium (500)', usage: 'Buttons, labels, navigation' },
]

const USAGE_DOS = [
    'Use official logos from this kit',
    'Maintain clear space around the logo',
    'Use on appropriate contrast backgrounds',
    'Scale proportionally',
]

const USAGE_DONTS = [
    'Stretch or distort the logo',
    'Change brand colors',
    'Add effects like shadows or gradients',
    'Use on busy or clashing backgrounds',
]

const CONTACT_POINTS = [
    {
        label: 'Press inquiries',
        href: 'mailto:press@embrly.ca',
        icon: Mail,
    },
    {
        label: 'GitHub Issues',
        href: 'https://github.com/EmberlyOSS/Website/issues',
        icon: Github,
    },
]

const KIT_DOWNLOAD = 'https://github.com/EmberlyOSS/Website/releases/latest'

import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'Media Kit',
    description: 'Brand assets, logos, colors, and guidelines for press and partners.',
})

export default function MediaKitPage() {
    return (
        <HomeShell>
            <div className="container space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground mb-4">
                            <Link href="/press" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back to Press
                            </Link>
                        </Button>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Media Kit</h1>
                        <p className="mt-3 text-muted-foreground max-w-2xl">
                            Official brand assets, color palette, and usage guidelines.
                            Everything you need to represent Emberly correctly.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button size="lg" asChild>
                            <Link href={KIT_DOWNLOAD} target="_blank" rel="noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Download Full Kit
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Logo Assets */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Logo Assets</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {BRAND_ASSETS.map((asset) => (
                            <GlassCard key={asset.title} className="group">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold">{asset.title}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{asset.description}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={asset.download} download>
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                    <AssetPreview variant={asset.preview as any} theme={asset.theme as any} />
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>

                {/* Color Palette */}
                <GlassCard id="guidelines">
                    <div className="p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <Palette className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold">Color Palette</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {BRAND_COLORS.map((color) => (
                                <div
                                    key={color.name}
                                    className="group rounded-xl border border-border/50 bg-background/30 overflow-hidden"
                                >
                                    <div
                                        className="h-24 flex items-end justify-start p-3"
                                        style={{ backgroundColor: color.value }}
                                    >
                                        <span className={`text-xs font-mono ${color.name === 'Midnight' ? 'text-white/70' : 'text-black/50'}`}>
                                            {color.value}
                                        </span>
                                    </div>
                                    <div className="p-3">
                                        <div className="font-medium text-sm">{color.name}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">RGB: {color.rgb}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{color.usage}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>

                {/* Typography */}
                <GlassCard>
                    <div className="p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <Type className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold">Typography</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {TYPOGRAPHY.map((type) => (
                                <div key={type.name} className="p-4 rounded-xl bg-background/30 border border-border/50">
                                    <div className="text-2xl font-bold mb-2" style={{ fontFamily: type.family }}>
                                        Aa
                                    </div>
                                    <div className="font-medium text-sm">{type.name}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {type.family} · {type.weight}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">{type.usage}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 rounded-xl bg-background/30 border border-border/50">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-foreground">Note:</strong> Inter is available for free from{' '}
                                <a href="https://fonts.google.com/specimen/Inter" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                    Google Fonts
                                </a>
                                . Use system fonts as a fallback.
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Usage Guidelines */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <GlassCard>
                        <div className="p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <Check className="h-5 w-5 text-emerald-500" />
                                <h2 className="text-xl font-semibold">Do's</h2>
                            </div>
                            <ul className="space-y-3">
                                {USAGE_DOS.map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <div className="mt-0.5 p-1 rounded-full bg-emerald-500/20">
                                            <Check className="h-3 w-3 text-emerald-500" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <div className="p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <X className="h-5 w-5 text-red-500" />
                                <h2 className="text-xl font-semibold">Don'ts</h2>
                            </div>
                            <ul className="space-y-3">
                                {USAGE_DONTS.map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <div className="mt-0.5 p-1 rounded-full bg-red-500/20">
                                            <X className="h-3 w-3 text-red-500" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </GlassCard>
                </div>

                {/* Voice & Tone + Contact */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <GlassCard className="lg:col-span-2">
                        <div className="p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-semibold">Voice & Tone</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-medium mb-3">How to describe Emberly</h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li>• Developer-first file sharing platform</li>
                                        <li>• Privacy-focused and open source</li>
                                        <li>• Self-hostable with modern architecture</li>
                                        <li>• Simple, fast, and reliable</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-medium mb-3">Naming conventions</h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li>• Always capitalize: <strong>Emberly</strong></li>
                                        <li>• Don't abbreviate or stylize (not "EMBERLY")</li>
                                        <li>• Reference the project, not "the Emberly team"</li>
                                        <li>• Use "Emberly" alone, not "Emberly app/service"</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <div className="p-6 h-full flex flex-col">
                            <h3 className="font-semibold mb-2">Need something else?</h3>
                            <p className="text-sm text-muted-foreground flex-1">
                                Contact us for custom assets, interview requests, or bespoke materials.
                            </p>
                            <div className="mt-4 space-y-2">
                                {CONTACT_POINTS.map((point) => (
                                    <Button
                                        key={point.label}
                                        variant="outline"
                                        className="w-full justify-start gap-2 bg-background/50"
                                        asChild
                                    >
                                        <Link href={point.href} target="_blank" rel="noreferrer">
                                            <point.icon className="h-4 w-4 text-primary" /> {point.label}
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Download CTA */}
                <GlassCard>
                    <div className="p-8 text-center">
                        <Download className="h-12 w-12 mx-auto text-primary/50 mb-4" />
                        <h2 className="text-2xl font-bold">Ready to go?</h2>
                        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                            Download the complete media kit including high-resolution logos,
                            color swatches, and additional assets.
                        </p>
                        <div className="mt-6">
                            <Button size="lg" asChild>
                                <Link href={KIT_DOWNLOAD} target="_blank" rel="noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Media Kit
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </HomeShell>
    )
}

type AssetPreviewProps = {
    variant: 'primary' | 'icon' | 'wordmark' | 'mono'
    theme: 'light' | 'dark'
}

function AssetPreview({ variant, theme }: AssetPreviewProps) {
    const baseClasses = 'flex h-40 w-full items-center justify-center rounded-xl border border-border/50'

    const background =
        theme === 'dark'
            ? 'bg-gradient-to-br from-background via-muted to-background'
            : 'bg-gradient-to-br from-slate-100 via-white to-slate-50'

    if (variant === 'wordmark') {
        return (
            <div className={`${baseClasses} ${background}`}>
                <span className={`text-3xl font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    EMBERLY
                </span>
            </div>
        )
    }

    if (variant === 'icon') {
        return (
            <div className={`${baseClasses} ${background}`}>
                <Image src="/icon.svg" alt="Emberly icon" width={64} height={64} />
            </div>
        )
    }

    if (variant === 'mono') {
        return (
            <div className={`${baseClasses} ${background}`}>
                <div className="rounded-full border border-dashed border-slate-300/70 p-6">
                    <Image src="/icon.svg" alt="Emberly monochrome" width={48} height={48} className={theme === 'light' ? '' : 'invert'} />
                </div>
            </div>
        )
    }

    // Primary
    return (
        <div className={`${baseClasses} ${background}`}>
            <div className="flex items-center gap-3">
                <Image src="/icon.svg" alt="Emberly logo" width={48} height={48} />
                <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Emberly
                </span>
            </div>
        </div>
    )
}
