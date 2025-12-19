import Image from 'next/image'
import Link from 'next/link'

import {
    ArrowLeft,
    BookOpen,
    Download,
    Mail,
    Palette,
    ShieldCheck,
} from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/packages/components/ui/card'

const BRAND_ASSETS = [
    {
        title: 'Primary logotype',
        description: 'Wordmark + ember icon for light backgrounds.',
        preview: 'wordmark',
        theme: 'light',
        download: '/icon.svg',
    },
    {
        title: 'Icon mark',
        description: 'Minimal flame icon for favicons and avatars.',
        preview: 'icon',
        theme: 'dark',
        download: '/icon.svg',
    },
    {
        title: 'Monochrome',
        description: 'Use on photography or tinted backgrounds.',
        preview: 'mono',
        theme: 'light',
        download: '/icon.svg',
    },
    {
        title: 'Screens & mockups',
        description: 'Dashboard + landing page hero mockups.',
        preview: 'mock',
        theme: 'dark',
        download: '/banner.png',
    },
]

const BRAND_COLORS = [
    { name: 'Ember', value: '#F97316', usage: 'CTAs & highlights' },
    { name: 'Midnight', value: '#0F172A', usage: 'Backgrounds' },
    { name: 'Slate', value: '#64748B', usage: 'Body copy' },
    { name: 'Cream', value: '#F8FAFC', usage: 'Light surfaces' },
]

const BRAND_GUIDELINES = [
    'Leave breathing room equal to the height of the ember icon around the logotype.',
    'Do not skew, recolor, or apply drop shadows to the mark.',
    'Pair the wordmark with neutral photography or gradients for best contrast.',
    'Use Ember (#F97316) sparingly to draw attention to actions or highlights.',
]

const CONTACT_POINTS = [
    {
        label: 'Press email',
        href: 'mailto:press@embrly.ca',
        icon: Mail,
    },
    {
        label: 'GitHub issues',
        href: 'https://github.com/EmberlyOSS/Website/issues',
        icon: ShieldCheck,
    },
]

const KIT_DOWNLOAD = 'https://github.com/EmberlyOSS/Website/releases/latest'

export default function MediaKitPage() {
    return (
        <main className="container mx-auto py-16">
            <section className="max-w-6xl mx-auto px-4 space-y-10">
                <div>
                    <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
                        <Link href="/press" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to press
                        </Link>
                    </Button>

                    <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold">Media kit</h1>
                            <p className="mt-3 text-muted-foreground max-w-2xl">
                                Logos, screenshots, color references, and tone guidelines for journalists and partners.
                                Everything here can be used freely when writing about Emberly.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button size="lg" asChild>
                                <Link href={KIT_DOWNLOAD} target="_blank" rel="noreferrer">
                                    <Download className="mr-2 h-4 w-4" /> Download full kit
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" asChild>
                                <Link href="/press/media-kit#guidelines">
                                    <BookOpen className="mr-2 h-4 w-4" /> Brand guidelines
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {BRAND_ASSETS.map((asset) => (
                        <Card
                            key={asset.title}
                            className="rounded-2xl border-white/10 bg-background/70 backdrop-blur"
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-lg">
                                    {asset.title}
                                    <Button variant="ghost" size="sm" asChild>
                                        <a href={asset.download} download>
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">{asset.description}</p>
                            </CardHeader>
                            <CardContent>
                                <AssetPreview variant={asset.preview} theme={asset.theme} />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[2fr,1fr]" id="guidelines">
                    <Card className="rounded-2xl border-white/10 bg-background/70 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Palette className="h-5 w-5 text-primary" /> Color palette
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Base colors for UI, marketing, and press assets.
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {BRAND_COLORS.map((color) => (
                                    <div
                                        key={color.name}
                                        className="rounded-xl border border-white/10 bg-background/80 p-3"
                                    >
                                        <div
                                            className="h-20 rounded-lg border border-white/10"
                                            style={{ backgroundColor: color.value }}
                                        />
                                        <div className="mt-3 text-sm font-medium">{color.name}</div>
                                        <div className="text-xs text-muted-foreground">{color.value}</div>
                                        <div className="text-xs text-muted-foreground">{color.usage}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-white/10 bg-background/70 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BookOpen className="h-5 w-5 text-primary" /> Voice & tone
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Quick reminders for how we describe Emberly in copy.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                {BRAND_GUIDELINES.map((item) => (
                                    <li key={item} className="flex gap-2">
                                        <span className="text-primary">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="rounded-2xl border-white/10 bg-background/70 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-lg">Usage guidelines</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Proper ways to reference Emberly in articles, talks, or demos.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-4 text-sm text-muted-foreground">
                                <div>
                                    <dt className="font-medium text-foreground">Naming</dt>
                                    <dd>Always write “Emberly” with an uppercase E.</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-foreground">Screenshots</dt>
                                    <dd>
                                        You may crop UI but avoid altering interface colors or overlaying other branding.
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-foreground">Backgrounds</dt>
                                    <dd>Use neutral or dark gradients; avoid red/orange tints that clash with the ember tone.</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-white/10 bg-background/70 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                Need something else?
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Reach the maintainers for interview requests or bespoke assets.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {CONTACT_POINTS.map((point) => (
                                <Button
                                    key={point.label}
                                    variant="outline"
                                    className="w-full justify-start gap-2 bg-background/60"
                                    asChild
                                >
                                    <Link href={point.href} target="_blank" rel="noreferrer">
                                        <point.icon className="h-4 w-4 text-primary" /> {point.label}
                                    </Link>
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </section>
        </main>
    )
}

type AssetPreviewProps = {
    variant: 'wordmark' | 'icon' | 'mono' | 'mock'
    theme: 'light' | 'dark'
}

function AssetPreview({ variant, theme }: AssetPreviewProps) {
    const baseClasses =
        'flex h-48 w-full items-center justify-center rounded-xl border border-white/10'

    const background =
        theme === 'dark'
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
            : 'bg-gradient-to-br from-white/80 via-background to-white'

    if (variant === 'wordmark') {
        return (
            <div className={`${baseClasses} ${background}`}>
                <div className="text-3xl font-semibold tracking-wide text-slate-900">
                    EMBERLY
                </div>
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
                    <Image src="/icon.svg" alt="Emberly monochrome" width={56} height={56} className="invert" />
                </div>
            </div>
        )
    }

    return (
        <div className={`${baseClasses} ${background} flex-col items-start justify-start p-6`}>
            <div className="rounded-xl border border-white/10 bg-background/80 p-4 shadow-lg">
                <div className="text-sm text-muted-foreground">Dashboard preview</div>
                <div className="mt-3 h-24 w-64 rounded-lg bg-gradient-to-br from-primary/30 via-primary/20 to-accent/30" />
                <div className="mt-4 flex gap-2">
                    <div className="h-2 w-16 rounded-full bg-white/40" />
                    <div className="h-2 w-8 rounded-full bg-white/20" />
                </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
                Replace with your own screenshots if needed.
            </div>
        </div>
    )
}
