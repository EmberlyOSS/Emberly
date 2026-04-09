import Link from 'next/link'
import Image from 'next/image'

import {
    ArrowRight,
    BookOpen,
    Calendar,
    Download,
    ExternalLink,
    FileText,
    Github,
    ImageIcon,
    Mail,
    Newspaper,
    Palette,
    Quote,
    Shield,
    Sparkles,
} from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import HomeShell from '@/packages/components/layout/home-shell'

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`glass-card overflow-hidden ${className}`}>
            {children}
        </div>
    )
}

const PRESS_RESOURCES = [
    {
        icon: ImageIcon,
        title: 'Media Kit',
        description: 'Logos, screenshots, brand colors, and usage guidelines for press and partners.',
        href: '/press/media-kit',
        label: 'Download assets',
        color: 'text-primary',
        bg: 'bg-primary/10',
    },
    {
        icon: FileText,
        title: 'Brand Guidelines',
        description: 'How to properly represent Emberly in articles, presentations, and media.',
        href: '/press/media-kit#guidelines',
        label: 'View guidelines',
        color: 'text-accent-foreground',
        bg: 'bg-accent/50',
    },
    {
        icon: Palette,
        title: 'Design Assets',
        description: 'High-resolution logos, icons, and marketing materials.',
        href: 'https://github.com/EmberlyOSS/Emberly/releases/latest',
        label: 'Download ZIP',
        external: true,
        color: 'text-muted-foreground',
        bg: 'bg-muted/50',
    },
]

const QUICK_FACTS = [
    { label: 'Founded', value: '2022' },
    { label: 'Type', value: 'Open Source' },
    { label: 'License', value: 'GPL 3.0' },
    { label: 'Team', value: 'Remote first' },
]

const CONTACT_POINTS = [
    {
        icon: Mail,
        label: 'Press inquiries',
        value: 'press@embrly.ca',
        href: 'mailto:press@embrly.ca',
    },
    {
        icon: Github,
        label: 'Technical questions',
        value: 'GitHub Issues',
        href: 'https://github.com/EmberlyOSS/Emberly/issues',
    },
]

import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'Press & Media',
    description: 'Press resources, media kit, and contact information for journalists and media partners.',
})

export default function PressPage() {
    return (
        <HomeShell>
            <div className="container space-y-8">
                {/* Hero Section */}
                <GlassCard>
                    <div className="p-8 md:p-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            <div>
                                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                                    <Newspaper className="h-3 w-3 mr-1" />
                                    Press & Media
                                </Badge>
                                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                    Press
                                    <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                                        Resources
                                    </span>
                                </h1>
                                <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                                    Everything you need to write about Emberly. Download our media kit,
                                    access brand assets, or get in touch for interviews and inquiries.
                                </p>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Button size="lg" asChild className="group">
                                        <Link href="/press/media-kit">
                                            <Download className="h-4 w-4 mr-2" />
                                            Media Kit
                                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" className="bg-background/50" asChild>
                                        <a href="mailto:press@embrly.ca">
                                            <Mail className="h-4 w-4 mr-2" />
                                            Contact Press Team
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            {/* Quick Facts Card */}
                            <div className="hidden lg:block">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 rounded-3xl blur-2xl opacity-60" />
                                    <GlassCard className="relative">
                                        <div className="p-6">
                                            <h3 className="text-lg font-semibold mb-4">Quick Facts</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {QUICK_FACTS.map((fact) => (
                                                    <div key={fact.label} className="text-center p-3 rounded-xl bg-muted/30">
                                                        <div className="text-2xl font-bold text-primary">{fact.value}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">{fact.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-6 p-4 rounded-xl bg-muted/30">
                                                <Quote className="h-5 w-5 text-primary/50 mb-2" />
                                                <p className="text-sm text-muted-foreground italic">
                                                    "A lightweight, developer first file sharing platform focused on
                                                    privacy, reliability, and simplicity."
                                                </p>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Resources Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PRESS_RESOURCES.map((resource) => (
                        <GlassCard key={resource.title} className="group hover:border-primary/30 transition-colors">
                            <div className="p-6 h-full flex flex-col">
                                <div className={`inline-flex p-3 rounded-xl ${resource.bg} w-fit`}>
                                    <resource.icon className={`h-6 w-6 ${resource.color}`} />
                                </div>
                                <h3 className="mt-4 font-semibold text-lg">{resource.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground flex-1">
                                    {resource.description}
                                </p>
                                <div className="mt-4 pt-4 border-t border-border/40">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-between group-hover:bg-background/50"
                                        asChild
                                    >
                                        <Link
                                            href={resource.href}
                                            target={resource.external ? '_blank' : undefined}
                                        >
                                            {resource.label}
                                            {resource.external ? (
                                                <ExternalLink className="h-4 w-4" />
                                            ) : (
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            )}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* About Emberly & Contact */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <GlassCard className="lg:col-span-2">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold">About Emberly</h2>
                            <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                                <p>
                                    Emberly is an open-source file sharing platform designed for developers,
                                    teams, and communities who value privacy and simplicity. Built with modern
                                    web technologies, it offers a self hostable alternative to traditional
                                    cloud storage services.
                                </p>
                                <p>
                                    Key features include password-protected files, custom domains, rich embeds,
                                    chunked uploads for large files, and a clean, intuitive dashboard for
                                    content management. The platform is fully open source under the GPL 3.0 license,
                                    allowing anyone to audit, modify, and self host their own instance.
                                </p>
                                <p>
                                    Founded in 2022, Emberly is maintained by a remote first team of developers
                                    passionate about privacy respecting software. The project welcomes
                                    contributions from the community.
                                </p>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-background/50">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Open Source
                                </Badge>
                                <Badge variant="secondary" className="bg-background/50">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Privacy First
                                </Badge>
                                <Badge variant="secondary" className="bg-background/50">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Since 2022
                                </Badge>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <div className="p-6 h-full flex flex-col">
                            <h3 className="text-lg font-semibold">Press Contact</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                For interviews, media inquiries, or partnership opportunities.
                            </p>
                            <div className="mt-6 space-y-4 flex-1">
                                {CONTACT_POINTS.map((contact) => (
                                    <a
                                        key={contact.label}
                                        href={contact.href}
                                        target={contact.href.startsWith('http') ? '_blank' : undefined}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/40 transition-colors group"
                                    >
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <contact.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground">{contact.label}</div>
                                            <div className="text-sm font-medium group-hover:text-primary transition-colors">
                                                {contact.value}
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </a>
                                ))}
                            </div>
                            <div className="mt-6 pt-4 border-t border-border/40">
                                <p className="text-xs text-muted-foreground">
                                    Response time: Usually within 1-2 business days
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Logo Preview */}
                <GlassCard>
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-semibold">Logo & Brand</h3>
                                <p className="mt-2 text-muted-foreground">
                                    Download our logo in various formats. Always use the official assets
                                    when representing Emberly.
                                </p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-background via-muted/50 to-background border border-border/40">
                                    <Image
                                        src="/icon.svg"
                                        alt="Emberly Logo"
                                        width={64}
                                        height={64}
                                    />
                                </div>
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-card via-accent/20 to-card border border-border/40">
                                    <Image
                                        src="/icon.svg"
                                        alt="Emberly Logo Alt"
                                        width={64}
                                        height={64}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button variant="outline" className="bg-background/50" asChild>
                                <Link href="/press/media-kit">
                                    <Download className="h-4 w-4 mr-2" />
                                    Full Media Kit
                                </Link>
                            </Button>
                            <Button variant="outline" className="bg-background/50" asChild>
                                <a href="/icon.svg" download>
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Download SVG
                                </a>
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </HomeShell>
    )
}
