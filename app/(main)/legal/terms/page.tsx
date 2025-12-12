import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Emberly',
  description: 'Terms of Service for Emberly, including account eligibility, acceptable use, and governing law.',
}

export default function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-[260px,minmax(0,1fr)]">
        <aside className="hidden md:block sticky top-28">
          <div className="space-y-3 p-4 rounded-lg bg-secondary/6">
            <Link href="/legal" className="text-sm underline">
              Back to Legal Hub
            </Link>
            <nav className="mt-2 flex flex-col gap-2 text-sm">
              <a
                href="#account-eligibility"
                className="text-muted-foreground underline"
              >
                Account Eligibility
              </a>
              <a
                href="#acceptable-use"
                className="text-muted-foreground underline"
              >
                Acceptable Use
              </a>
              <a
                href="#governing-law"
                className="text-muted-foreground underline"
              >
                Governing Law
              </a>
            </nav>
          </div>
        </aside>

        <section>
          <Card className="rounded-2xl border-white/10 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: Nov 24, 2025
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-2">
                <nav className="flex gap-3 text-sm">
                  <a
                    className="underline text-muted-foreground"
                    href="#account-eligibility"
                  >
                    Account Eligibility
                  </a>
                  <a
                    className="underline text-muted-foreground"
                    href="#acceptable-use"
                  >
                    Acceptable Use
                  </a>
                  <a
                    className="underline text-muted-foreground"
                    href="#governing-law"
                  >
                    Governing Law
                  </a>
                </nav>
              </div>

              <h3 id="account-eligibility" className="text-base font-semibold">
                1. Account Eligibility
              </h3>
              <p className="text-sm text-muted-foreground">
                You must be at least 13 years old to create an account. If you
                are under the age of majority in your jurisdiction, you must
                have the consent of a parent or guardian to use Emberly.
              </p>

              <h3 id="acceptable-use" className="text-base font-semibold">
                2. Acceptable Use
              </h3>
              <p className="text-sm text-muted-foreground">
                You are responsible for content you upload or share through
                Emberly. Do not upload content that violates applicable law,
                infringes others' rights, or contains malware. Emberly may
                suspend or remove content or accounts that, in our reasonable
                judgment, violate these Terms or pose a risk to the service or
                other users.
              </p>

              <h3 className="text-base font-semibold">
                3. Service Availability
              </h3>
              <p className="text-sm text-muted-foreground">
                Emberly strives to maintain the service but does not guarantee
                uninterrupted availability. We may modify, suspend, or
                discontinue the service (or features) at any time with or
                without notice.
              </p>

              <h3 className="text-base font-semibold">4. Fees and Billing</h3>
              <p className="text-sm text-muted-foreground">
                Paid features, if any, are billed according to the terms
                presented at purchase. Refund and cancellation policies are
                described on the relevant billing pages.
              </p>

              <h3 className="text-base font-semibold">
                5. Intellectual Property
              </h3>
              <p className="text-sm text-muted-foreground">
                Emberly and its licensors retain ownership of the service,
                trademarks, and software. You retain ownership of your
                user-generated content, subject to the license you grant to
                Emberly to operate the service (store, display, and deliver your
                content as needed to provide the service).
              </p>

              <h3 className="text-base font-semibold">6. Termination</h3>
              <p className="text-sm text-muted-foreground">
                We may suspend or terminate accounts that breach these Terms or
                for other lawful reasons. Upon termination, access to stored
                content may be restricted; users should export any important
                data before account closure.
              </p>

              <h3 className="text-base font-semibold">
                7. Limitation of Liability
              </h3>
              <p className="text-sm text-muted-foreground">
                To the maximum extent permitted by law, Emberly and its
                affiliates are not liable for indirect, incidental, special, or
                consequential damages arising from your use of the service.
              </p>

              <h3 id="governing-law" className="text-base font-semibold">
                8. Governing Law
              </h3>
              <p className="text-sm text-muted-foreground">
                These Terms are governed by the laws of the Province of British
                Columbia and the federal laws of Canada applicable therein, and
                users agree to submit to the exclusive jurisdiction of the
                courts of British Columbia for disputes arising out of the
                Terms.
              </p>

              <h3 className="text-base font-semibold">
                9. Changes to These Terms
              </h3>
              <p className="text-sm text-muted-foreground">
                We may update these Terms from time to time. Material changes
                will be posted on this page with an updated effective date.
              </p>

              <h3 className="text-base font-semibold">10. Contact</h3>
              <p className="text-sm text-muted-foreground">
                For questions about these Terms, or to report abuse or
                infringement, please contact the Emberly team via the support
                channels available in your account. Consider consulting legal
                counsel for specific advice.
              </p>

              <div className="mt-6">
                <Link href="/legal" className="text-sm underline">
                  Back to Legal Hub
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
