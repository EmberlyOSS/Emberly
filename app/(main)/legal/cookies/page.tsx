import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | Emberly',
  description: 'Emberly cookie policy: types of cookies used, purposes, and how to manage them.',
}

export default function CookiesPage() {
  return (
    <PageShell title="Cookie Policy" subtitle="Types of cookies used, purposes, and how to manage them.">
      <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-[220px,minmax(0,1fr)]">
        <aside className="hidden md:block sticky top-28">
          <div className="p-4 rounded-lg bg-muted/5">
            <Link href="/legal" className="text-sm underline">Back to Legal Hub</Link>
            <nav className="mt-3 flex flex-col gap-2 text-sm">
              <a href="#what-are-cookies" className="text-muted-foreground">What Are Cookies</a>
              <a href="#types" className="text-muted-foreground">Types</a>
              <a href="#manage" className="text-muted-foreground">Manage Cookies</a>
            </nav>
          </div>
        </aside>

        <section className="prose max-w-none text-sm text-muted-foreground">
          <div className="mb-2 text-sm">
            <div className="font-semibold text-foreground text-lg">Cookie Policy</div>
            <div className="text-sm text-muted-foreground">Last updated: Nov 24, 2025</div>
          </div>

          <div className="mb-4">
            <nav className="flex gap-3 text-sm">
              <a className="underline text-muted-foreground" href="#what-are-cookies">What Are Cookies</a>
              <a className="underline text-muted-foreground" href="#types">Types</a>
              <a className="underline text-muted-foreground" href="#manage">Manage Cookies</a>
            </nav>
          </div>

          <p>Emberly uses cookies and similar technologies to provide and improve the service, remember preferences, and deliver analytics.</p>

          <h3 id="what-are-cookies" className="text-base font-semibold">1. What Are Cookies?</h3>
          <p>Cookies are small text files placed on your device by websites and apps to store information such as preferences, session tokens, and tracking identifiers.</p>

          <h3 id="types" className="text-base font-semibold">2. Types of Cookies We Use</h3>
          <ul className="list-disc ml-5">
            <li><strong>Essential cookies:</strong> Required for basic site functionality and account sessions.</li>
            <li><strong>Analytics cookies:</strong> Help us understand usage and improve the service (may be provided by third-party analytics tools).</li>
            <li><strong>Preferences:</strong> Remember display and localization settings.</li>
          </ul>

          <h3 id="manage" className="text-base font-semibold">3. Managing Cookies</h3>
          <p>You can manage or disable cookies via your browser settings. Note that disabling essential cookies may prevent certain features from working. Some cookies are set by third-party services used by Emberly; review those providers' policies for details.</p>

          <h3 className="text-base font-semibold">4. Changes</h3>
          <p>We may update this Cookie Policy from time to time. Material changes will be posted here with an updated effective date.</p>

          <h3 className="text-base font-semibold">5. Contact</h3>
          <p>For questions about cookies or privacy practices, contact the Emberly support team via the support channels in your account.</p>

          <div className="mt-6">
            <Link href="/legal" className="text-sm underline">Back to Legal Hub</Link>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
