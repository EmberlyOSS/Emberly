import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CookiesPage() {
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
                href="#what-are-cookies"
                className="text-muted-foreground underline"
              >
                What Are Cookies
              </a>
              <a href="#types" className="text-muted-foreground underline">
                Types
              </a>
              <a href="#manage" className="text-muted-foreground underline">
                Manage Cookies
              </a>
            </nav>
          </div>
        </aside>

        <section className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Cookie Policy</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: Nov 24, 2025
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <nav className="flex gap-3 text-sm mb-2">
                <a
                  className="underline text-muted-foreground"
                  href="#what-are-cookies"
                >
                  What Are Cookies
                </a>
                <a className="underline text-muted-foreground" href="#types">
                  Types
                </a>
                <a className="underline text-muted-foreground" href="#manage">
                  Manage Cookies
                </a>
              </nav>
              <p className="text-sm text-muted-foreground">
                Emberly uses cookies and similar technologies to provide and
                improve the service, remember preferences, and deliver
                analytics.
              </p>

              <h3 id="what-are-cookies" className="text-base font-semibold">
                1. What Are Cookies?
              </h3>
              <p className="text-sm text-muted-foreground">
                Cookies are small text files placed on your device by websites
                and apps to store information such as preferences, session
                tokens, and tracking identifiers.
              </p>

              <h3 id="types" className="text-base font-semibold">
                2. Types of Cookies We Use
              </h3>
              <ul className="list-disc ml-5 text-sm text-muted-foreground">
                <li>
                  <strong>Essential cookies:</strong> Required for basic site
                  functionality and account sessions.
                </li>
                <li>
                  <strong>Analytics cookies:</strong> Help us understand usage
                  and improve the service (may be provided by third-party
                  analytics tools).
                </li>
                <li>
                  <strong>Preferences:</strong> Remember display and
                  localization settings.
                </li>
              </ul>

              <h3 id="manage" className="text-base font-semibold">
                3. Managing Cookies
              </h3>
              <p className="text-sm text-muted-foreground">
                You can manage or disable cookies via your browser settings.
                Note that disabling essential cookies may prevent certain
                features from working. Some cookies are set by third-party
                services used by Emberly; review those providers' policies for
                details.
              </p>

              <h3 className="text-base font-semibold">4. Changes</h3>
              <p className="text-sm text-muted-foreground">
                We may update this Cookie Policy from time to time. Material
                changes will be posted here with an updated effective date.
              </p>

              <h3 className="text-base font-semibold">5. Contact</h3>
              <p className="text-sm text-muted-foreground">
                For questions about cookies or privacy practices, contact the
                Emberly support team via the support channels in your account.
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
