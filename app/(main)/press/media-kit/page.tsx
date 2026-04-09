'use client'

import { useEffect, useState, useRef } from 'react'
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
    Play,
    Shield,
    Sparkles,
    Type,
    Video,
    X,
} from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import HomeShell from '@/packages/components/layout/home-shell'

// Reusable GlassCard component
function GlassCard({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
    return (
        <div id={id} className={`glass-card overflow-hidden ${className}`}>
            {children}
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

// Theme-aware colors that pull from CSS variables
const THEME_COLORS = [
    { name: 'Primary', cssVar: '--primary', usage: 'Brand color, CTAs, links' },
    { name: 'Accent', cssVar: '--accent', usage: 'Highlights, badges' },
    { name: 'Background', cssVar: '--background', usage: 'Page backgrounds' },
    { name: 'Card', cssVar: '--card', usage: 'Card surfaces' },
    { name: 'Muted', cssVar: '--muted', usage: 'Subtle backgrounds' },
    { name: 'Foreground', cssVar: '--foreground', usage: 'Primary text' },
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

const PROMO_VIDEOS = [
    {
        title: 'Site Preview',
        description: 'Quick overview of the Emberly interface and main features.',
        src: '/videos/site-preview-ad.mp4',
        duration: '~15s',
    },
    {
        title: 'Upload Flow',
        description: 'Demonstration of the seamless file upload experience.',
        src: '/videos/uploading-ad.mp4',
        duration: '~10s',
    },
]

const CONTACT_POINTS = [
    {
        label: 'Press inquiries',
        href: 'mailto:press@embrly.ca',
        icon: Mail,
    },
    {
        label: 'GitHub Issues',
        href: 'https://github.com/EmberlyOSS/Emberly/issues',
        icon: Github,
    },
]

const KIT_DOWNLOAD = '/emberly-media-kit.zip'

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

                {/* Promotional Videos */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Promotional Videos</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Short promotional clips for use in presentations, social media, and press coverage.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PROMO_VIDEOS.map((video) => (
                            <GlassCard key={video.title} className="group">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold">{video.title}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{video.description}</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">Duration: {video.duration}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={video.src} download>
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                    <VideoPlayer src={video.src} />
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
                            <h2 className="text-xl font-semibold">Theme Color Palette</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                            Colors adapt to the active theme. These are the current theme&apos;s colors.
                        </p>
                        <ThemeColorPalette />
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
                                <div key={type.name} className="p-4 glass-subtle">
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
                        <div className="mt-6 p-4 glass-subtle">
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
    const baseClasses = 'flex h-40 w-full items-center justify-center rounded-xl border border-border/30'

    // Use theme-aware backgrounds that adapt to the active theme
    const background =
        theme === 'dark'
            ? 'bg-gradient-to-br from-background via-muted/30 to-background'
            : 'bg-gradient-to-br from-card via-accent/10 to-card'

    if (variant === 'wordmark') {
        return (
            <div className={`${baseClasses} ${background}`}>
                <span className={`text-3xl font-bold tracking-wide ${theme === 'dark' ? 'text-foreground' : 'text-foreground'}`}>
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
                <div className="rounded-full border border-dashed border-border p-6">
                    <Image src="/icon.svg" alt="Emberly monochrome" width={48} height={48} className={theme === 'light' ? 'dark:invert-0' : ''} />
                </div>
            </div>
        )
    }

    // Primary
    return (
        <div className={`${baseClasses} ${background}`}>
            <div className="flex items-center gap-3">
                <Image src="/icon.svg" alt="Emberly logo" width={48} height={48} />
                <span className="text-2xl font-bold text-foreground">
                    Emberly
                </span>
            </div>
        </div>
    )
}

// Helper to convert HSL CSS variable to hex
function hslToHex(h: number, s: number, l: number): string {
    s /= 100
    l /= 100
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
        const k = (n + h / 30) % 12
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
        return Math.round(255 * color).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase()
}

// Helper to get luminance for contrast calculation
function getLuminance(hex: string): number {
    const rgb = hex.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16) / 255) || [0, 0, 0]
    const [r, g, b] = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Video player component that only renders on client to avoid hydration issues
function VideoPlayer({ src }: { src: string }) {
    const [mounted, setMounted] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="relative rounded-xl overflow-hidden bg-muted/30 border border-border/30 aspect-video flex items-center justify-center">
                <Play className="h-12 w-12 text-muted-foreground/50" />
            </div>
        )
    }

    return (
        <div className="relative rounded-xl overflow-hidden bg-muted/30 border border-border/30">
            <video
                ref={videoRef}
                src={src}
                className="w-full aspect-video object-cover"
                controls
                preload="metadata"
                playsInline
                muted
            >
                Your browser does not support the video tag.
            </video>
        </div>
    )
}

function ThemeColorPalette() {
    const [colors, setColors] = useState<{ name: string; hex: string; rgb: string; usage: string }[]>([])
    const [, forceUpdate] = useState(0)

    useEffect(() => {
        const updateColors = () => {
            const root = document.documentElement
            const computed = getComputedStyle(root)

            const resolved = THEME_COLORS.map(color => {
                const raw = computed.getPropertyValue(color.cssVar).trim()
                // HSL format: "210 40% 98%" or similar
                const parts = raw.split(/\s+/).map(p => parseFloat(p))
                let hex = '#000000'
                let rgb = '0, 0, 0'

                if (parts.length >= 3) {
                    hex = hslToHex(parts[0], parts[1], parts[2])
                    // Convert hex to RGB
                    const r = parseInt(hex.slice(1, 3), 16)
                    const g = parseInt(hex.slice(3, 5), 16)
                    const b = parseInt(hex.slice(5, 7), 16)
                    rgb = `${r}, ${g}, ${b}`
                }

                return {
                    name: color.name,
                    hex,
                    rgb,
                    usage: color.usage,
                }
            })

            setColors(resolved)
        }

        // Initial update
        updateColors()

        // Watch for theme changes via class or attribute changes on html element
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'class' || mutation.attributeName === 'style' || mutation.attributeName === 'data-theme') {
                    // Small delay to let CSS variables update
                    setTimeout(updateColors, 50)
                    break
                }
            }
        })

        observer.observe(document.documentElement, { attributes: true })

        return () => observer.disconnect()
    }, [])

    if (colors.length === 0) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {THEME_COLORS.map(color => (
                    <div key={color.name} className="glass-subtle overflow-hidden animate-pulse">
                        <div className="h-24 bg-muted" />
                        <div className="p-3 space-y-2">
                            <div className="h-4 bg-muted rounded w-16" />
                            <div className="h-3 bg-muted rounded w-24" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {colors.map(color => {
                const isDark = getLuminance(color.hex) < 0.5
                return (
                    <div
                        key={color.name}
                        className="group glass-subtle overflow-hidden"
                    >
                        <div
                            className="h-24 flex items-end justify-start p-3"
                            style={{ backgroundColor: color.hex }}
                        >
                            <span
                                className="text-xs font-mono"
                                style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
                            >
                                {color.hex}
                            </span>
                        </div>
                        <div className="p-3">
                            <div className="font-medium text-sm">{color.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">RGB: {color.rgb}</div>
                            <div className="text-xs text-muted-foreground mt-1">{color.usage}</div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
