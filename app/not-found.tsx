import Link from 'next/link'

import {
    ArrowRight,
    BookOpen,
    FileQuestion,
    Home,
    MessageCircle,
    Scale,
    Search,
    Sparkles,
} from 'lucide-react'

import MiniGame from '@/packages/components/games/mini-game'
import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import { DynamicBackground } from '@/packages/components/layout/dynamic-background'
import { BaseNav } from '@/packages/components/layout/base-nav'

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${className}`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative">{children}</div>
        </div>
    )
}

const SUGGESTED_PAGES = [
    {
        icon: Home,
        title: 'Home',
        description: 'Start from the Emberly homepage',
        href: '/',
        color: 'text-primary',
        bg: 'bg-primary/10',
    },
    {
        icon: BookOpen,
        title: 'Documentation',
        description: 'Guides and API references',
        href: '/docs',
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
    },
    {
        icon: MessageCircle,
        title: 'Discord',
        description: 'Get help from the community',
        href: '/discord',
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
    },
    {
        icon: Scale,
        title: 'Legal',
        description: 'Terms, privacy, and cookies',
        href: '/legal',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
    },
]

export default function NotFound() {
    return (
        <div className="relative flex flex-col min-h-screen">
            <DynamicBackground />

            <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="relative bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg p-2">
                        <div className="relative flex h-16 items-center px-6">
                            <BaseNav />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full pt-28 relative z-10">
                <div className="max-w-6xl mx-auto py-8 px-4 md:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Main Content */}
                        <GlassCard>
                            <div className="p-8 md:p-10">
                                {/* 404 Badge */}
                                <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 text-lg px-4 py-1">
                                    <FileQuestion className="h-4 w-4 mr-2" />
                                    404
                                </Badge>

                                {/* Title */}
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                                    Page not
                                    <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                                        found
                                    </span>
                                </h1>

                                {/* Description */}
                                <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-md">
                                    The page you're looking for doesn't exist or has been moved.
                                    Don't worry - let's get you back on track.
                                </p>

                                {/* Actions */}
                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    <Button size="lg" asChild className="group">
                                        <Link href="/">
                                            <Home className="h-4 w-4 mr-2" />
                                            Go Home
                                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                    <MiniGame />
                                </div>

                                {/* Fun Message */}
                                <div className="mt-8 p-4 rounded-xl bg-background/30 border border-border/50">
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">While you're here...</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Why not play a quick game? Click "Play a Game" and try to beat your high score!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Suggested Pages */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <Search className="h-5 w-5 text-muted-foreground" />
                                <h2 className="text-lg font-semibold">Looking for something?</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                                {SUGGESTED_PAGES.map((page) => (
                                    <GlassCard key={page.href} className="group hover:border-primary/30 transition-colors">
                                        <Link href={page.href} className="block p-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${page.bg}`}>
                                                    <page.icon className={`h-5 w-5 ${page.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium group-hover:text-primary transition-colors">
                                                        {page.title}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {page.description}
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </Link>
                                    </GlassCard>
                                ))}
                            </div>

                            {/* Additional Help */}
                            <GlassCard>
                                <div className="p-4">
                                    <p className="text-sm text-muted-foreground">
                                        Still can't find what you need?{' '}
                                        <Link href="/contact" className="text-primary hover:underline">
                                            Contact us
                                        </Link>
                                        {' '}and we'll help you out.
                                    </p>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
