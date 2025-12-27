import Link from 'next/link'

import {
    ArrowRight,
    BookOpen,
    Check,
    Code2,
    Github,
    Globe,
    Heart,
    Lock,
    Rocket,
    Server,
    Shield,
    Sparkles,
    Users,
    Zap,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import HomeShell from '@/packages/components/layout/home-shell'

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${className}`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative">{children}</div>
        </div>
    )
}

const CORE_VALUES = [
    {
        icon: Shield,
        title: 'Privacy First',
        description: 'Your files, your control. We never scan, index, or monetize your content.',
        color: 'text-chart-1',
        bg: 'bg-chart-1/10',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Optimized upload flows with chunked transfers and edge caching.',
        color: 'text-primary',
        bg: 'bg-primary/10',
    },
    {
        icon: Code2,
        title: 'Open Source',
        description: 'Fully transparent codebase. Audit it, fork it, contribute to it.',
        color: 'text-chart-4',
        bg: 'bg-chart-4/10',
    },
    {
        icon: Server,
        title: 'Self-Hostable',
        description: 'Deploy on your own infrastructure with Docker or bare metal.',
        color: 'text-chart-3',
        bg: 'bg-chart-3/10',
    },
]

const FEATURES = [
    { icon: Lock, label: 'Password Protection' },
    { icon: Globe, label: 'Custom Domains' },
    { icon: Rocket, label: 'Rich Embeds' },
    { icon: Users, label: 'Team Sharing' },
]

async function getContributors() {
    const ORG = 'EmberlyOSS'
    const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
    }
    if (process.env.GITHUB_PAT) {
        headers.Authorization = `token ${process.env.GITHUB_PAT}`
    }

    try {
        const [membersRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/orgs/${ORG}/members?per_page=100`, {
                headers,
                next: { revalidate: 60 * 60 },
            }),
            fetch(`https://api.github.com/orgs/${ORG}/repos?per_page=100`, {
                headers,
                next: { revalidate: 60 * 60 },
            }),
        ])

        const membersJson = membersRes.ok ? await membersRes.json() : []
        const reposJson = reposRes.ok ? await reposRes.json() : []

        const repoNames = Array.isArray(reposJson)
            ? reposJson.map((r: any) => r.name).filter(Boolean)
            : []

        const contribPromises = repoNames.map((name: string) =>
            fetch(`https://api.github.com/repos/${ORG}/${name}/contributors?per_page=100`, {
                headers,
                next: { revalidate: 60 * 60 },
            })
                .then((r) => (r.ok ? r.json() : []))
                .catch(() => [])
        )

        const contribSettled = await Promise.allSettled(contribPromises)

        const map = new Map<string, any>()

        if (Array.isArray(membersJson)) {
            for (const m of membersJson) {
                if (!m || !m.login) continue
                map.set(m.login.toLowerCase(), {
                    login: m.login,
                    avatar: m.avatar_url,
                    url: m.html_url || `https://github.com/${m.login}`,
                    contributions: 0,
                    orgMember: true,
                })
            }
        }

        for (const s of contribSettled) {
            if (s.status !== 'fulfilled') continue
            const arr = s.value
            if (!Array.isArray(arr)) continue
            for (const c of arr) {
                if (!c || !c.login) continue
                const key = c.login.toLowerCase()
                const contributions = typeof c.contributions === 'number' ? c.contributions : 0
                const existing = map.get(key)
                if (existing) {
                    existing.contributions = (existing.contributions || 0) + contributions
                    existing.avatar = existing.avatar || c.avatar_url
                    existing.url = existing.url || c.html_url
                    map.set(key, existing)
                } else {
                    map.set(key, {
                        login: c.login,
                        avatar: c.avatar_url,
                        url: c.html_url,
                        contributions,
                        orgMember: false,
                    })
                }
            }
        }

        const result = Array.from(map.values()).sort((a: any, b: any) => {
            if (a.orgMember === b.orgMember) return (b.contributions || 0) - (a.contributions || 0)
            return a.orgMember ? -1 : 1
        })

        return result
    } catch (e) {
        console.error('Failed to load contributors', e)
        return []
    }
}

import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'About Us',
    description: 'Learn about Emberly a privacy-first, open source file sharing platform built for developers and teams.',
})

export default async function AboutPage() {
    const contributors = await getContributors()

    return (
        <HomeShell>
            <div className="container space-y-8">
                {/* Hero Section */}
                <GlassCard>
                    <div className="p-8 md:p-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            <div>
                                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Open Source
                                </Badge>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                                    File sharing,
                                    <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                                        reimagined.
                                    </span>
                                </h1>
                                <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
                                    Emberly is a lightweight, developer first file sharing platform focused on privacy,
                                    reliability, and simplicity. Self hostable and extensible for teams and communities.
                                </p>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Button size="lg" asChild className="group">
                                        <Link href="https://github.com/EmberlyOSS" target="_blank">
                                            <Github className="h-4 w-4 mr-2" />
                                            View on GitHub
                                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild className="bg-background/50">
                                        <Link href="/docs">
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            Documentation
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Mission Card */}
                            <div className="hidden lg:block">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 rounded-3xl blur-2xl opacity-60" />
                                    <GlassCard className="relative">
                                        <div className="p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 rounded-xl bg-primary/20">
                                                    <Heart className="h-5 w-5 text-primary" />
                                                </div>
                                                <h3 className="text-lg font-semibold">Our Mission</h3>
                                            </div>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                Make private, reliable file sharing accessible and easy to self-host
                                                for teams and communities everywhere.
                                            </p>
                                            <div className="mt-6 space-y-3">
                                                {[
                                                    'Fast uploads with chunked and presigned flows',
                                                    'Password protected files with per file visibility',
                                                    'Clean dashboard and CMS for content management',
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className="mt-0.5 p-1 rounded-full bg-primary/20">
                                                            <Check className="h-3 w-3 text-primary" />
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </GlassCard>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Core Values */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {CORE_VALUES.map((value) => (
                        <GlassCard key={value.title}>
                            <div className="p-6">
                                <div className={`inline-flex p-3 rounded-xl ${value.bg}`}>
                                    <value.icon className={`h-6 w-6 ${value.color}`} />
                                </div>
                                <h3 className="mt-4 font-semibold text-lg">{value.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* Why Emberly & Features */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <GlassCard className="lg:col-span-2">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold">Why Emberly?</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                We built Emberly because existing file sharing solutions are either too complex,
                                too expensive, or don't respect your privacy. Emberly prioritizes speed, privacy,
                                and a pleasant UX. It's built so teams can self host without wrestling with
                                complex infrastructure.
                            </p>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                Whether you're a developer sharing code snippets, a team collaborating on assets,
                                or a community building something together. Emberly scales with you while keeping
                                your data under your control.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2">
                                {FEATURES.map((feature) => (
                                    <div
                                        key={feature.label}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border border-border/50 text-sm"
                                    >
                                        <feature.icon className="h-4 w-4 text-primary" />
                                        {feature.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <div className="p-6 h-full flex flex-col">
                            <h3 className="text-lg font-semibold">Get Involved</h3>
                            <p className="mt-3 text-sm text-muted-foreground flex-1">
                                Contributions, bug reports, and ideas are welcome. Check the repo for issues
                                and contributor guidelines, or join our Discord to chat with the community.
                            </p>
                            <div className="mt-6 space-y-2">
                                <Button variant="outline" className="w-full justify-start bg-background/50" asChild>
                                    <Link href="https://github.com/EmberlyOSS" target="_blank">
                                        <Github className="h-4 w-4 mr-2" />
                                        Contribute on GitHub
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-start bg-background/50" asChild>
                                    <Link href="/discord">
                                        <Users className="h-4 w-4 mr-2" />
                                        Join Discord
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Contributors Section */}
                {contributors.length > 0 && (
                    <GlassCard>
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">Contributors</h2>
                                    <p className="mt-1 text-muted-foreground">
                                        The amazing people who make Emberly possible
                                    </p>
                                </div>
                                <Badge variant="secondary" className="bg-background/50">
                                    {contributors.length} contributors
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {contributors.map((c) => (
                                    <Link
                                        key={c.login}
                                        href={c.url}
                                        target="_blank"
                                        className="group relative"
                                    >
                                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-full opacity-0 group-hover:opacity-100 blur transition-opacity" />
                                        <Avatar className="relative h-12 w-12 border-2 border-border/50 group-hover:border-primary/50 transition-colors">
                                            <AvatarImage src={c.avatar} alt={c.login} />
                                            <AvatarFallback className="bg-background/80">
                                                {c.login?.[0]?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {c.orgMember && (
                                            <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-primary">
                                                <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                            <p className="mt-6 text-xs text-muted-foreground">
                                <Sparkles className="h-3 w-3 inline mr-1" />
                                indicates organization member
                            </p>
                        </div>
                    </GlassCard>
                )}

                {/* CTA Section */}
                <GlassCard>
                    <div className="p-8 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold">Ready to get started?</h2>
                        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                            Join thousands of developers and teams who trust Emberly for secure,
                            private file sharing.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Button size="lg" asChild>
                                <Link href="/auth/register">
                                    Get Started Free
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="bg-background/50" asChild>
                                <Link href="/contact">
                                    Contact Us
                                </Link>
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </HomeShell>
    )
}
