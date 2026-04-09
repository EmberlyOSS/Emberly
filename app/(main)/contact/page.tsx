import Link from 'next/link'

import {
    ArrowRight,
    BookOpen,
    Bug,
    Clock,
    Github,
    Globe,
    Headphones,
    Mail,
    MessageCircle,
    MessagesSquare,
    Newspaper,
    Shield,
    Twitter,
    Users,
    Zap,
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

const CONTACT_CHANNELS = [
    {
        icon: Github,
        title: 'GitHub Issues',
        description: 'Report bugs, request features, or contribute to the codebase.',
        href: 'https://github.com/EmberlyOSS/Emberly/issues',
        label: 'Open an issue',
        external: true,
        color: 'text-foreground',
        bg: 'bg-foreground/10',
    },
    {
        icon: MessagesSquare,
        title: 'GitHub Discussions',
        description: 'Community help, ideas, and design discussion.',
        href: 'https://github.com/orgs/EmberlyOSS/discussions',
        label: 'Join discussions',
        external: true,
        color: 'text-chart-3',
        bg: 'bg-chart-3/10',
    },
    {
        icon: Users,
        title: 'Discord Community',
        description: 'Real-time chat, support, and community hangouts.',
        href: '/discord',
        label: 'Join Discord',
        external: false,
        color: 'text-chart-1',
        bg: 'bg-chart-1/10',
    },
    {
        icon: Twitter,
        title: 'Twitter / X',
        description: 'Follow for announcements and quick updates.',
        href: 'https://twitter.com/TryEmberly',
        label: 'Follow us',
        external: true,
        color: 'text-chart-5',
        bg: 'bg-chart-5/10',
    },
]

const EMAIL_CONTACTS = [
    {
        icon: Globe,
        label: 'General Inquiries',
        email: 'hello@embrly.ca',
        description: 'Questions about Emberly or just want to say hi',
    },
    {
        icon: Headphones,
        label: 'Support',
        email: 'support@embrly.ca',
        description: 'Technical help and account issues',
    },
    {
        icon: Newspaper,
        label: 'Press & Partnerships',
        email: 'press@embrly.ca',
        description: 'Media inquiries and collaboration opportunities',
    },
    {
        icon: Shield,
        label: 'Security',
        email: 'security@embrly.ca',
        description: 'Report vulnerabilities responsibly',
    },
]

const QUICK_LINKS = [
    { icon: BookOpen, label: 'Blog', href: '/blog' },
    { icon: Bug, label: 'Bug Reports', href: 'https://github.com/EmberlyOSS/Emberly/issues/new?template=bug_report.md' },
    { icon: Zap, label: 'Feature Requests', href: 'https://github.com/EmberlyOSS/Emberly/issues/new?template=feature_request.md' },
]

import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'Contact',
    description: 'Get in touch with the Emberly team - we\'d love to hear from you.',
})

export default function ContactPage() {
    return (
        <HomeShell>
            <div className="container space-y-8">
                {/* Hero Section */}
                <GlassCard>
                    <div className="p-8 md:p-12">
                        <div className="max-w-2xl">
                            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Get in Touch
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                We'd love to
                                <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                                    hear from you.
                                </span>
                            </h1>
                            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                                Questions, feedback, partnership inquiries, or just want to say hi?
                                Choose your preferred way to reach us below.
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Contact Channels */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-semibold px-1">Community & Support</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {CONTACT_CHANNELS.map((channel) => (
                                <GlassCard key={channel.title} className="group hover:border-primary/30 transition-colors">
                                    <div className="p-6 h-full flex flex-col">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl ${channel.bg}`}>
                                                <channel.icon className={`h-6 w-6 ${channel.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-lg">{channel.title}</h3>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {channel.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-border/40">
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-between group-hover:bg-background/50"
                                                asChild
                                            >
                                                <Link
                                                    href={channel.href}
                                                    target={channel.external ? '_blank' : undefined}
                                                    rel={channel.external ? 'noopener noreferrer' : undefined}
                                                >
                                                    {channel.label}
                                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>

                    {/* Email Contacts */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold px-1">Email Us</h2>
                        <GlassCard>
                            <div className="p-6 space-y-4">
                                {EMAIL_CONTACTS.map((contact, index) => (
                                    <div key={contact.email}>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                                                <contact.icon className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm">{contact.label}</div>
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="text-primary hover:underline text-sm"
                                                >
                                                    {contact.email}
                                                </a>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {contact.description}
                                                </p>
                                            </div>
                                        </div>
                                        {index < EMAIL_CONTACTS.length - 1 && (
                                            <div className="border-b border-border/40 mt-4" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Response Time */}
                        <GlassCard>
                            <div className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-chart-4/10">
                                        <Clock className="h-5 w-5 text-chart-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Response Time</div>
                                        <p className="text-sm text-muted-foreground">
                                            Usually within 1-2 business days
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* Quick Links */}
                <GlassCard>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold">Quick Links</h3>
                                <p className="text-sm text-muted-foreground">
                                    Looking for something specific?
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_LINKS.map((link) => (
                                    <Button
                                        key={link.label}
                                        variant="outline"
                                        size="sm"
                                        className="bg-background/50"
                                        asChild
                                    >
                                        <Link
                                            href={link.href}
                                            target={link.href.startsWith('http') ? '_blank' : undefined}
                                        >
                                            <link.icon className="h-4 w-4 mr-2" />
                                            {link.label}
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* CTA Section */}
                <GlassCard>
                    <div className="p-8 text-center">
                        <Mail className="h-12 w-12 mx-auto text-primary/50 mb-4" />
                        <h2 className="text-2xl font-bold">Can't find what you're looking for?</h2>
                        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                            Check out our blog for the latest updates and guides,
                            or reach out directly and we'll point you in the right direction.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Button size="lg" asChild>
                                <Link href="/blog">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Browse Blog
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="bg-background/50" asChild>
                                <a href="mailto:hello@embrly.ca">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Email Us
                                </a>
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </HomeShell>
    )
}
