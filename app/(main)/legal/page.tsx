import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PageShell from '@/components/layout/PageShell'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legal | Emberly',
  description: 'Emberly legal hub: Terms of Service, Privacy Policy, Cookie Policy, Security Policy, and GDPR information.',
}

export default function LegalHubPage() {
  return (
    <PageShell title="Legal" subtitle="Terms of Service, Privacy Policy, and other legal documents.">
      <section className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome to Emberly's legal hub. Below you'll find our Terms of
            Service, Privacy Policy, and Cookie Policy. These documents explain
            how Emberly operates and how we handle data. If you have legal
            questions, please contact support.
          </p>
        </div>

        <div className="">
          <div className="rounded-2xl border border-border/30 bg-background/40 p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Document</th>
                  <th className="text-left py-3">Summary</th>
                  <th className="py-3" />
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-4">
                    <div className="font-medium">
                      <Link href="/legal/terms" className="hover:underline">Terms of Service</Link>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Governs your use of Emberly, account eligibility, acceptable use, and governing law.</td>
                  <td className="py-4 text-right">
                    <Link href="/legal/terms" className="text-primary">Read</Link>
                  </td>
                </tr>

                <tr className="border-b hover:bg-muted/50">
                  <td className="py-4">
                    <div className="font-medium">
                      <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">How we collect, use, and protect personal information, retention, and rights.</td>
                  <td className="py-4 text-right">
                    <Link href="/legal/privacy" className="text-primary">Read</Link>
                  </td>
                </tr>

                <tr className="border-b hover:bg-muted/50">
                  <td className="py-4">
                    <div className="font-medium">
                      <Link href="/legal/cookies" className="hover:underline">Cookie Policy</Link>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Explains the cookies Emberly uses and how to manage them in your browser.</td>
                  <td className="py-4 text-right">
                    <Link href="/legal/cookies" className="text-primary">Read</Link>
                  </td>
                </tr>

                <tr className="border-b hover:bg-muted/50">
                  <td className="py-4">
                    <div className="font-medium">
                      <Link href="/legal/security" className="hover:underline">Security Policy</Link>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Overview of Emberly's security practices and how to report vulnerabilities or incidents.</td>
                  <td className="py-4 text-right">
                    <Link href="/legal/security" className="text-primary">Read</Link>
                  </td>
                </tr>

                <tr className="border-b hover:bg-muted/50">
                  <td className="py-4">
                    <div className="font-medium">
                      <Link href="/legal/gdpr" className="hover:underline">GDPR & Data Protection</Link>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Information about European data subject rights and how we handle personal data under GDPR.</td>
                  <td className="py-4 text-right">
                    <Link href="/legal/gdpr" className="text-primary">Read</Link>
                  </td>
                </tr>

                <tr className="border-b hover:bg-muted/50">
                  <td className="py-4">
                    <div className="font-medium">
                      <Link href="/legal/refund" className="hover:underline">Refund Policy</Link>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Details on refund eligibility, request process, timelines, and exceptions for paid plans and add-ons.</td>
                  <td className="py-4 text-right">
                    <Link href="/legal/refund" className="text-primary">Read</Link>
                  </td>
                </tr>

                <tr className="border-b hover:bg-muted/50">
                  <td className="py-4">
                    <div className="font-medium">
                      <Link href="/legal/sla" className="hover:underline">Service Level Agreement (SLA)</Link>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Service commitments, uptime objectives, support response targets, maintenance, and remedies.</td>
                  <td className="py-4 text-right">
                    <Link href="/legal/sla" className="text-primary">Read</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-8 text-sm text-muted-foreground">
          <p>
            For DMCA or takedown requests, or other legal inquiries, please
            contact the Emberly support channels listed in your account. Emberly
            is operated from British Columbia, Canada.
          </p>
        </footer>
      </section>
    </PageShell>
  )
}
