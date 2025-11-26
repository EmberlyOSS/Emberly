import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  Cloud,
  MessageSquare,
  Share2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  Zap,
} from 'lucide-react'
import { getServerSession } from 'next-auth/next'

import PartnersCarousel from '@/components/partners/partners-carousel'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { authOptions } from '@/lib/auth'
import { checkSetupCompletion } from '@/lib/database/setup'

export default async function HomePage() {
  const setupComplete = await checkSetupCompletion()

  if (!setupComplete) {
    redirect('/setup')
  }

  const session = await getServerSession(authOptions)

  return (
    <main className="container mx-auto py-16">
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Emberly
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl">
              File Sharing, Forged in Fire. Fast, private file sharing and short
              links designed for developers and teams. Upload files, set
              expirations, and point custom domains to Emberly to serve your
              content with confidence.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <Button asChild size="lg">
                <a href="/auth/register">Get started</a>
              </Button>

              <Link
                href="/docs"
                className="text-sm underline text-muted-foreground"
              >
                Documentation
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 max-w-sm">
              <div className="flex items-center gap-3 justify-center">
                <div className="rounded-md bg-primary/10 p-2 flex items-center justify-center h-10 w-10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Instant sharing</div>
                  <div className="text-sm text-muted-foreground">
                    Upload and share links in seconds.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary/10 p-2 flex items-center justify-center h-10 w-10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Private by default</div>
                  <div className="text-sm text-muted-foreground">
                    Optional expirations & access controls.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary/10 p-2 flex items-center justify-center h-10 w-10">
                  <Cloud className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Custom domains</div>
                  <div className="text-sm text-muted-foreground">
                    Bring your own domain(s) to serve content.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary/10 p-2 flex items-center justify-center h-10 w-10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Developer friendly</div>
                  <div className="text-sm text-muted-foreground">
                    Simple API and embeddable links.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Card className="overflow-hidden rounded-2xl relative shadow-lg bg-gradient-to-br from-primary/10 to-accent/6">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-60" />
              <CardContent className="p-8 relative z-10">
                <div className="text-sm text-muted-foreground">
                  Live preview
                </div>
                <div className="mt-4 rounded-md bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      emberly.site/abc123
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expires in 7 days
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    <div className="text-muted-foreground">
                      Filename.pdf · 1.2 MB
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <a className="text-sm underline" href="#">
                        Download
                      </a>
                      <span className="text-xs text-muted-foreground">·</span>
                      <a className="text-sm underline" href="#">
                        Copy link
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">
            Built for teams and builders
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Emberly focuses on a simple, predictable file hosting experience
            with features that matter: expirations, custom domains, usage
            controls, and privacy-first defaults.
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="flex gap-4 items-center justify-center">
                <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mt-4">Secure by design</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Encryption in transit, optional password protection, and
                    per-file expirations.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4 items-center justify-center">
                <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mt-4">Fast links</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Short URLs and CDN backed delivery for quick downloads.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4 items-center justify-center">
                <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mt-4">Integrations</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    APIs and simple embedding make Emberly easy to integrate
                    into your workflows.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold">How it works</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Three simple steps to share files securely.
          </p>

          <div className="mt-6 grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="flex gap-4 items-center justify-center">
                <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-12 w-12">
                  <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium mt-4">Upload</div>
                  <div className="text-sm text-muted-foreground">
                    Drag & drop or choose files to upload large files supported.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4 items-center justify-center">
                <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-12 w-12">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium mt-4">Share</div>
                  <div className="text-sm text-muted-foreground">
                    Get a short link or point your custom domain and even
                    control expirations.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4 items-center justify-center">
                <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-12 w-12">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium mt-4">Manage</div>
                  <div className="text-sm text-muted-foreground">
                    Track views, revoke access, and export account data anytime.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Our partners (rolling carousel) */}
        <div className="mt-12">
          <PartnersCarousel />
        </div>
        {/* Frequently Asked Questions */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Quick answers to common questions about using Emberly.
          </p>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <details className="group bg-background/40 border border-border/50 rounded-lg p-3 transition-all duration-200 overflow-hidden">
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                <span>How do I upload files?</span>
                <MessageSquare className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground animate-in fade-in-50 slide-in-from-top-2 duration-300">
                Use the "Get started" button to create an account, then drag &
                drop files or choose files in the dashboard upload form.
              </p>
            </details>

            <details className="group bg-background/40 border border-border/50 rounded-lg p-3 transition-all duration-200 overflow-hidden">
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                <span>Are my files private?</span>
                <MessageSquare className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground animate-in fade-in-50 slide-in-from-top-2 duration-300">
                Files are private by default. You can optionally set
                expirations, password protection, or share short links for
                public access.
              </p>
            </details>

            <details className="group bg-background/40 border border-border/50 rounded-lg p-3 transition-all duration-200 overflow-hidden">
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                <span>Can I use a custom domain?</span>
                <MessageSquare className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground animate-in fade-in-50 slide-in-from-top-2 duration-300">
                Yes, point your DNS to Emberly and add the domain in settings to
                serve files from your own domain.
              </p>
            </details>

            <details className="group bg-background/40 border border-border/50 rounded-lg p-3 transition-all duration-200 overflow-hidden">
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                <span>What file sizes are supported?</span>
                <MessageSquare className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground animate-in fade-in-50 slide-in-from-top-2 duration-300">
                Upload limits depend on your server configuration. Check your
                instance settings or host docs for limits.
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  )
}
