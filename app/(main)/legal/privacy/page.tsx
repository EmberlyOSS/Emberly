import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <main className="container mx-auto py-8">
      <div className="grid md:grid-cols-4 gap-6">
        <aside className="hidden md:block sticky top-24">
          <div className="space-y-3 p-4 rounded-lg bg-secondary/6">
            <Link href="/legal" className="text-sm underline">
              Back to Legal Hub
            </Link>
            <nav className="mt-2 flex flex-col gap-2 text-sm">
              <a
                href="#information-we-collect"
                className="text-muted-foreground underline"
              >
                What We Collect
              </a>
              <a
                href="#data-retention"
                className="text-muted-foreground underline"
              >
                Data Retention
              </a>
              <a
                href="#your-rights"
                className="text-muted-foreground underline"
              >
                Your Rights
              </a>
            </nav>
          </div>
        </aside>

        <section className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: Nov 24, 2025
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <nav className="flex gap-3 text-sm mb-2">
                <a
                  className="underline text-muted-foreground"
                  href="#information-we-collect"
                >
                  What We Collect
                </a>
                <a
                  className="underline text-muted-foreground"
                  href="#data-retention"
                >
                  Data Retention
                </a>
                <a
                  className="underline text-muted-foreground"
                  href="#your-rights"
                >
                  Your Rights
                </a>
              </nav>

              <h3
                id="information-we-collect"
                className="text-base font-semibold"
              >
                1. Information We Collect
              </h3>
              <p className="text-sm text-muted-foreground">
                We collect information you provide directly (account details,
                profile information, email), content you upload (files and
                associated metadata), and technical data (IP address, device and
                browser information, usage logs, and cookies).
              </p>

              <h3 className="text-base font-semibold">
                2. How We Use Information
              </h3>
              <p className="text-sm text-muted-foreground">
                We use information to provide, maintain, and improve Emberly,
                process uploads, respond to support requests, detect abuse, and
                comply with legal obligations. Aggregated or de-identified data
                may be used for analytics and product improvements.
              </p>

              <h3 id="data-retention" className="text-base font-semibold">
                3. Sharing and Disclosure
              </h3>
              <p className="text-sm text-muted-foreground">
                We may share information with service providers who perform
                functions on our behalf (e.g., cloud storage, email, analytics).
                We may also disclose information to comply with legal processes
                or to protect the rights, property, or safety of Emberly or
                others.
              </p>

              <h3 className="text-base font-semibold">
                4. Cross-Border Transfers
              </h3>
              <p className="text-sm text-muted-foreground">
                Personal information may be stored and processed in other
                jurisdictions. By using Emberly you consent to cross-border
                transfers necessary to operate the service.
              </p>

              <h3 className="text-base font-semibold">
                5. Data Retention & Your Choices
              </h3>
              <p className="text-sm text-muted-foreground">
                We retain personal information as necessary to provide the
                service and meet legal obligations. You may export or delete
                your data via account settings; some backups may persist for a
                limited period after deletion.
              </p>

              <h3 className="text-base font-semibold">6. Security</h3>
              <p className="text-sm text-muted-foreground">
                Emberly implements reasonable administrative, technical, and
                physical safeguards to protect personal information. However, no
                system is completely secure — please avoid storing highly
                sensitive personal information in uploaded files.
              </p>

              <h3 className="text-base font-semibold">7. Children</h3>
              <p className="text-sm text-muted-foreground">
                Emberly is not intended for children under 13. If we become
                aware that we have collected personal information from a child
                under 13 without consent, we will take steps to delete it.
              </p>

              <h3 id="your-rights" className="text-base font-semibold">
                8. Your Rights
              </h3>
              <p className="text-sm text-muted-foreground">
                Depending on your jurisdiction, you may have rights to access,
                correct, or delete your personal information. Contact us through
                the support channels in your account for requests.
              </p>

              <h3 className="text-base font-semibold">
                9. Third-Party Services
              </h3>
              <p className="text-sm text-muted-foreground">
                Emberly uses third-party services (e.g., cloud storage, email
                providers, analytics). These providers have their own privacy
                policies and security practices; review them for details.
              </p>

              <h3 className="text-base font-semibold">
                10. Updates to This Policy
              </h3>
              <p className="text-sm text-muted-foreground">
                We may update this policy periodically. Significant changes will
                be posted here with an updated effective date. Please review
                this page regularly.
              </p>

              <h3 className="text-base font-semibold">11. Contact</h3>
              <p className="text-sm text-muted-foreground">
                For privacy questions or to make a request regarding your data,
                please contact the Emberly support team via your account or the
                support channels provided on the site.
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
