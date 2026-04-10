import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { buildSiteMetadata } from '@/packages/lib/embeds/metadata'

import {
  ArrowRight,
  Check,
  ChevronDown,
  Cloud,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileUp,
  Globe,
  Link2,
  Lock,
  MessageSquare,
  Rocket,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  Timer,
  Upload,
  Users,
  Zap,
} from 'lucide-react'
import { getServerSession } from 'next-auth/next'

import PartnersCarousel from '@/packages/components/partners/partners-carousel'
import FAQAccordion from '@/packages/components/shared/faq-accordion'
import { prisma } from '@/packages/lib/database/prisma'
import TestimonialsList from '@/packages/components/testimonials/testimonials-list'
import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import HomeShell from '@/packages/components/layout/home-shell'

import { authOptions } from '@/packages/lib/auth'
import { checkSetupCompletion } from '@/packages/lib/database/setup'

export async function generateMetadata(): Promise<Metadata> {
  return buildSiteMetadata()
}

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card glass-hover overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

const HERO_FEATURES = [
  { icon: Zap, label: 'Instant Sharing' },
  { icon: Shield, label: 'Privacy First' },
  { icon: Globe, label: 'Custom Domains' },
  { icon: Code2, label: 'API Ready' },
]

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Secure by Design',
    description: 'End-to-end encryption, optional password protection, and configurable file expirations.',
    color: 'text-chart-1',
    bg: 'bg-chart-1/10',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'CDN-backed delivery with chunked uploads for large files and instant short URLs.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Sparkles,
    title: 'Rich Embeds',
    description: 'Beautiful previews on Discord, Twitter, Slack, and more with customizable metadata.',
    color: 'text-chart-3',
    bg: 'bg-chart-3/10',
  },
  {
    icon: Globe,
    title: 'Custom Domains',
    description: 'Bring your own domain to serve files under your brand with full SSL support.',
    color: 'text-chart-4',
    bg: 'bg-chart-4/10',
  },
  {
    icon: Code2,
    title: 'Developer Friendly',
    description: 'Simple REST API, ShareX/Flameshot support, and webhook integrations.',
    color: 'text-chart-5',
    bg: 'bg-chart-5/10',
  },
  {
    icon: Users,
    title: 'Team Ready',
    description: 'Collaborate with teammates, manage permissions, and track usage analytics.',
    color: 'text-chart-2',
    bg: 'bg-chart-2/10',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload',
    description: 'Drag & drop files or use our API. Supports files up to your configured limit.',
  },
  {
    step: '02',
    icon: Share2,
    title: 'Share',
    description: 'Get a short link instantly. Set expiration, password, or visibility.',
  },
  {
    step: '03',
    icon: Rocket,
    title: 'Done',
    description: 'Your file is live. Track views, manage access, and export anytime.',
  },
]

const FAQ_ITEMS = [
  {
    question: 'How do I upload files?',
    answer: 'Create an account, then drag & drop files into the dashboard or use our API with tools like ShareX.',
  },
  {
    question: 'Are my files private?',
    answer: 'Files are private by default. You control visibility, expiration, and password protection.',
  },
  {
    question: 'Can I use a custom domain?',
    answer: 'Yes! Point your DNS to Emberly and add the domain in settings to serve files under your brand.',
  },
  {
    question: 'What file sizes are supported?',
    answer: 'Spark (free) supports up to 500 MB per file. Paid plans increase this up to unlimited on Ember and Enterprise tiers.',
  },
  {
    question: 'Is there an API?',
    answer: 'Yes, we have a full REST API with documentation. Perfect for automation and integrations.',
  },
  {
    question: 'Can I self-host Emberly?',
    answer: 'Absolutely! Emberly is open source. Check our GitHub for deployment guides.',
  },
]

export default async function HomePage() {
  const setupComplete = await checkSetupCompletion()

  if (!setupComplete) {
    redirect('/setup')
  }

  const session = await getServerSession(authOptions)

  const partners = await prisma.partner.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })

  const testimonials = await prisma.testimonial.findMany({
    where: { approved: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: { user: { select: { id: true, name: true, urlId: true } } },
  })

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://embrly.ca'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: 'Emberly',
        description: 'Open-source file sharing, URL shortening, and talent discovery platform.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/discovery?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'Emberly',
        url: BASE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/icon.svg`,
        },
        sameAs: [
          'https://github.com/EmberlyOSS/Emberly',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          url: `${BASE_URL}/contact`,
          contactType: 'customer support',
          availableLanguage: 'English',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${BASE_URL}/#app`,
        name: 'Emberly',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        url: BASE_URL,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free plan available. Paid plans from $5/mo.',
        },
        featureList: [
          'File sharing with expiry and password protection',
          'URL shortening with custom slugs',
          'Custom domain support',
          'Team / squad collaboration',
          'Talent discovery profiles',
          'S3-compatible storage buckets',
          'Open source and self-hostable',
        ],
      },
    ],
  }

  return (
    <HomeShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="space-y-16 md:space-y-24">
        {/* Hero Section */}
        <section className="relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Open Source Platform
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                Share Files.
                <span className="block text-gradient">
                  Build Together.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                The open-source platform for secure file sharing and team collaboration.
                Upload, manage, and share content with custom domains, rich embeds, and built-in talent discovery.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {session ? (
                  <Button size="lg" asChild className="group">
                    <Link href="/dashboard">
                      Open Dashboard
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" asChild className="group">
                    <Link href="/auth/register">
                      Create Free Account
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                )}
                <Button size="lg" variant="outline" asChild className="bg-background/50">
                  <Link href="/about">
                    Learn More
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 pt-4">
                {HERO_FEATURES.map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-subtle text-sm"
                  >
                    <feature.icon className="h-4 w-4 text-primary" />
                    {feature.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Interactive Preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 rounded-3xl blur-2xl opacity-40" />
              <GlassCard className="relative gradient-border-animated animate-float">
                <div className="p-6 md:p-8">
                  {/* Preview Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <Badge variant="secondary" className="bg-background/50">
                      Live Preview
                    </Badge>
                  </div>

                  {/* File Preview Card */}
                  <div className="glass-subtle p-4 space-y-4">
                    {/* URL Bar */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 border border-border/30">
                      <Lock className="h-4 w-4 text-chart-4" />
                      <span className="text-sm font-mono flex-1">emberly.site/abc123</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* File Info */}
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <FileUp className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">project-assets.zip</p>
                        <p className="text-sm text-muted-foreground">2.4 MB • Uploaded just now</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-chart-4/10 text-chart-4 border-chart-4/20">
                        <Check className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                      <Badge variant="secondary" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                        <Timer className="h-3 w-3 mr-1" />
                        Expires in 7 days
                      </Badge>
                      <Badge variant="secondary" className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                        <Lock className="h-3 w-3 mr-1" />
                        Password Protected
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-background/50">
                        <Link2 className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section>
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Built for teams and builders
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Everything you need to share, collaborate, and grow secure file hosting,
              custom domains, URL shortening, rich embeds, and team collaboration tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <GlassCard key={feature.title} className="group hover:border-primary/30 transition-colors">
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
        </section>

        {/* How it Works Section */}
        <section>
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              How it works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Three simple steps
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Share files securely in seconds. No complicated setup required.
            </p>
          </div>

          <GlassCard>
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                {HOW_IT_WORKS.map((item, index) => (
                  <div key={item.step} className="group relative flex md:flex-col items-start md:items-center gap-4 md:gap-0 p-4 md:px-6 md:py-2">
                    {/* Connector line (between steps) */}
                    {index < HOW_IT_WORKS.length - 1 && (
                      <>
                        {/* Horizontal line on desktop */}
                        <div className="hidden md:block absolute top-[calc(50%-16px)] left-[calc(50%+28px)] right-0 h-px bg-gradient-to-r from-primary/40 to-primary/10 z-0" />
                        {/* Vertical line on mobile */}
                        <div className="md:hidden absolute left-[30px] top-[60px] bottom-0 w-px bg-gradient-to-b from-primary/40 to-primary/10 z-0" />
                      </>
                    )}

                    {/* Step circle */}
                    <div className="relative flex-shrink-0 z-10">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                        <item.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="md:text-center md:mt-4">
                      <span className="text-xs font-bold text-primary">{item.step}</span>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Partners Carousel */}
        {partners && partners.length > 0 && (
          <section>
            <PartnersCarousel
              partners={partners.map((p) => ({
                id: p.id,
                name: p.name,
                tagline: p.tagline ?? undefined,
                imageUrl: p.imagePath ?? undefined,
              }))}
            />
          </section>
        )}

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <TestimonialsList
            testimonials={testimonials.map((t) => ({
              id: t.id,
              content: t.content,
              rating: t.rating,
              user: t.user,
            }))}
          />
        )}

        {/* FAQ Section */}
        <section>
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Quick answers to common questions about using Emberly.
            </p>
          </div>

          <FAQAccordion items={FAQ_ITEMS} />
        </section>

        {/* CTA Section */}
        <section>
          <GlassCard>
            <div className="p-8 md:p-12 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
                <Rocket className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to get started?
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Join developers and teams who use Emberly for secure file sharing,
                collaboration, and talent discovery. Free to start, no credit card required.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                {session ? (
                  <Button size="lg" asChild className="group">
                    <Link href="/dashboard">
                      Open Dashboard
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" asChild className="group">
                    <Link href="/auth/register">
                      Create Free Account
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                )}
                <Button size="lg" variant="outline" className="bg-background/50" asChild>
                  <Link href="/about">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
          </GlassCard>
        </section>
      </div>
    </HomeShell>
  )
}
