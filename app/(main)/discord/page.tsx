import Link from 'next/link'

import {
  ArrowRight,
  Bell,
  Code,
  Gift,
  Hash,
  Heart,
  MessageSquare,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import HomeShell from '@/packages/components/layout/home-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Discord',
  description: 'Join the Emberly community on Discord for support, announcements, and more.',
})

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

const COMMUNITY_FEATURES = [
  {
    icon: Users,
    title: 'Community Support',
    description: 'Ask questions and get help from the community and team members.',
    color: 'text-chart-1',
    bg: 'bg-chart-1/10',
  },
  {
    icon: Bell,
    title: 'Announcements',
    description: 'Get notified about releases, features, and updates first.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Star,
    title: 'Showcase',
    description: 'Share projects and integrations built with Emberly.',
    color: 'text-chart-3',
    bg: 'bg-chart-3/10',
  },
  {
    icon: Code,
    title: 'Integrations',
    description: 'Discuss plugins, tooling, and API usage with fellow devs.',
    color: 'text-chart-4',
    bg: 'bg-chart-4/10',
  },
]

const CHANNELS = [
  { icon: Hash, name: 'general', description: 'Hang out and chat with the community' },
  { icon: MessageSquare, name: 'support', description: 'Get help with your setup or account' },
  { icon: Star, name: 'showcase', description: 'Show off what you\'ve built' },
  { icon: Bell, name: 'updates', description: 'Official updates and releases' },
  { icon: Code, name: 'feedback', description: 'Provide feedback and suggestions' },
  { icon: Gift, name: 'giveaways', description: 'Community events and perks' },
]

const BOOSTER_PERKS = [
  'Extra storage space',
  'Custom domain slots',
  'Priority support',
  'Exclusive booster role & badge',
  'Early access to features',
]

export default function DiscordPage() {
  return (
    <HomeShell>
      <div className="container space-y-8">
        {/* Hero Section */}
        <GlassCard className="gradient-border-animated">
          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Community
                </Badge>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                  Join the
                  <span className="block text-gradient">
                    Emberly Community.
                  </span>
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Hang out with other Emberly users, get help, share tips, and
                  stay up to date with announcements. Our Discord is the best
                  place to chat in real-time and meet fellow builders.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button size="lg" asChild className="group">
                    <a
                      href="https://discord.gg/k2QAfkwDwK"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join the Discord
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="bg-background/50">
                    <Link href="/pricing">
                      <Gift className="h-4 w-4 mr-2" />
                      Booster Perks
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { icon: Zap, label: 'Real-time Chat' },
                    { icon: Shield, label: 'Moderated' },
                    { icon: Heart, label: 'Free to Join' },
                  ].map((pill) => (
                    <div
                      key={pill.label}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-subtle text-sm"
                    >
                      <pill.icon className="h-4 w-4 text-primary" />
                      {pill.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Discord Preview Card */}
              <div className="relative hidden lg:block">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 rounded-3xl blur-2xl opacity-40" />
                <GlassCard className="relative animate-float">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-xl bg-primary/20">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Emberly</h3>
                        <p className="text-xs text-muted-foreground">Discord Server</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto bg-chart-4/10 text-chart-4 border-chart-4/20 text-xs">
                        Online
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {CHANNELS.slice(0, 4).map((channel) => (
                        <div key={channel.name} className="flex items-center gap-3 px-3 py-2 rounded-lg glass-subtle">
                          <channel.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{channel.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Community Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COMMUNITY_FEATURES.map((feature) => (
            <GlassCard key={feature.title} className="glass-hover group">
              <div className="p-6">
                <div className={`inline-flex p-3 rounded-xl ${feature.bg} group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Channels & Booster Perks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Channels */}
          <GlassCard className="lg:col-span-2">
            <div className="p-8">
              <h2 className="text-2xl font-bold">Channels</h2>
              <p className="mt-2 text-muted-foreground">
                Find the right place for every conversation.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CHANNELS.map((channel) => (
                  <div key={channel.name} className="flex items-start gap-3 p-3 rounded-xl glass-subtle">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <channel.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">#{channel.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{channel.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Booster Perks */}
          <GlassCard>
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Booster Perks</h3>
              </div>
              <p className="text-sm text-muted-foreground flex-1">
                Boost the server and unlock exclusive perks to supercharge your Emberly experience.
              </p>
              <div className="mt-4 space-y-2">
                {BOOSTER_PERKS.map((perk) => (
                  <div key={perk} className="flex items-center gap-2 text-sm">
                    <div className="p-0.5 rounded-full bg-primary/20">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{perk}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-6 w-full bg-background/50" asChild>
                <Link href="/pricing#user-add-ons">
                  Learn More
                </Link>
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Guidelines & Help */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-chart-1/10">
                  <Shield className="h-5 w-5 text-chart-1" />
                </div>
                <h3 className="text-lg font-semibold">Community Guidelines</h3>
              </div>
              <div className="space-y-3">
                {[
                  'Be respectful and treat others with courtesy.',
                  'No spam or self-promotion without permission.',
                  'Use channels appropriately (support, showcase, off-topic).',
                  'Follow the Discord Terms of Service.',
                ].map((rule, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-chart-3/10">
                  <Heart className="h-5 w-5 text-chart-3" />
                </div>
                <h3 className="text-lg font-semibold">Need Help?</h3>
              </div>
              <p className="text-sm text-muted-foreground flex-1">
                If you have account or billing questions, open a support
                ticket in Discord or email the team. We&apos;re here to help.
              </p>
              <div className="mt-6 space-y-2">
                <Button variant="outline" className="w-full justify-start bg-background/50" asChild>
                  <Link href="/contact">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                By joining, you agree to follow our community guidelines and the
                Terms of Service.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* CTA Section */}
        <GlassCard className="gradient-border-animated">
          <div className="p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">
              Ready to join?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Connect with developers, get support, and be part of the Emberly community.
            </p>
            <div className="mt-6">
              <Button size="lg" asChild className="group">
                <a
                  href="https://discord.gg/k2QAfkwDwK"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join the Discord
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </HomeShell>
  )
}
