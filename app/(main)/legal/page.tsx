import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LegalHubPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <section className="mx-auto w-full max-w-5xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">Legal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome to Emberly's legal hub. Below you'll find our Terms of
            Service, Privacy Policy, and Cookie Policy. These documents explain
            how Emberly operates and how we handle data. If you have legal
            questions, please contact support.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="rounded-2xl border-white/10 bg-card/70 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Governs your use of Emberly, account eligibility, acceptable use,
              and governing law (British Columbia, Canada).
              <div className="mt-4">
                <Link className="underline text-sm" href="/legal/terms">
                  Read Terms
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/10 bg-card/70 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              How we collect, use, and protect personal information, data
              retention, cross-border transfers, and your rights.
              <div className="mt-4">
                <Link className="underline text-sm" href="/legal/privacy">
                  Read Privacy Policy
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/10 bg-card/70 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle>Cookie Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Explains the cookies Emberly uses and how to manage them in your
              browser.
              <div className="mt-4">
                <Link className="underline text-sm" href="/legal/cookies">
                  Read Cookie Policy
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/10 bg-card/70 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle>Security Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Overview of Emberly's security practices and how to report
              vulnerabilities or incidents.
              <div className="mt-4">
                <Link className="underline text-sm" href="/legal/security">
                  Read Security Policy
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/10 bg-card/70 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle>GDPR & Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Information about European data subject rights and how we handle
              personal data under GDPR.
              <div className="mt-4">
                <Link className="underline text-sm" href="/legal/gdpr">
                  Read GDPR Policy
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-8 text-sm text-muted-foreground">
          <p>
            For DMCA or takedown requests, or other legal inquiries, please
            contact the Emberly support channels listed in your account. Emberly
            is operated from British Columbia, Canada.
          </p>
        </footer>
      </section>
    </main>
  )
}
