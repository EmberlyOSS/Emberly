import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GDPR & Data Protection | Emberly',
  description: 'Emberly GDPR and data protection information: scope, data subject rights, retention, and contact details.',
}

export default function GdprPage() {
  return (
    <PageShell title="GDPR & Data Protection" subtitle="Scope, data subject rights, retention, and contact details.">
      <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-[220px,minmax(0,1fr)]">
        <aside className="hidden md:block sticky top-28">
          <div className="p-4 rounded-lg bg-muted/5">
            <Link href="/legal" className="text-sm underline">Back to Legal Hub</Link>
            <nav className="mt-3 flex flex-col gap-2 text-sm">
              <a href="#controller" className="text-muted-foreground">Controller & Processor</a>
              <a href="#rights" className="text-muted-foreground">Your rights</a>
              <a href="#retention" className="text-muted-foreground">Data retention</a>
              <a href="#contact" className="text-muted-foreground">Contact</a>
            </nav>
          </div>
        </aside>

        <section className="prose max-w-none text-sm text-muted-foreground">
          <div className="mb-2 text-sm">
            <div className="font-semibold text-foreground text-lg">GDPR & Data Protection</div>
            <div className="text-sm text-muted-foreground">Last updated: Nov 30, 2025</div>
          </div>

          <div className="mb-4">
            <nav className="flex gap-3 text-sm">
              <a className="underline text-muted-foreground" href="#scope">Scope</a>
              <a className="underline text-muted-foreground" href="#rights">Your rights</a>
              <a className="underline text-muted-foreground" href="#retention">Retention & exports</a>
            </nav>
          </div>

          <h3 id="scope" className="text-base font-semibold">Scope & responsibilities</h3>
          <p>
            This page describes how Emberly (the project and the official website at emberly.site and emberly.ca) collects and processes personal data. It explains what data we collect, why we collect it, how long we retain it, and how to contact the project about data requests. This policy applies to data processed by the Emberly project and the official Emberly websites and services (emberly.site / emberly.ca).
          </p>

          <h3 id="rights" className="text-base font-semibold">Data subject rights</h3>
          <p>
            Where applicable, individuals have statutory rights such as access, rectification, erasure, restriction, objection, and portability. To exercise these rights for data held by the Emberly project (for example, data associated with an account on the official site at emberly.site or emberly.ca), contact the project via the channels listed in the Privacy Policy or open an issue on the project's GitHub repository. We will respond to legitimate requests in accordance with applicable law.
          </p>

          <h3 id="retention" className="text-base font-semibold">Retention, exports & deletion</h3>
          <p>
            The Emberly project retains personal data only as long as necessary for the purposes described (account maintenance, security, support, and legal compliance). Users can request an account export or deletion for data held by Emberly. See the Privacy Policy for the procedures and approximate retention timeframes.
          </p>

          <h3 className="text-base font-semibold">Contact</h3>
          <p>
            For data questions about Emberly project-managed services or the Emberly website, consult the Privacy Policy and contact the project via GitHub or the listed contact methods. If you are unsure where your data is stored or who to contact, open an issue on the repository and the maintainers will advise on the appropriate next steps. <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
          </p>

          <div className="mt-6">
            <Link href="/legal" className="text-sm underline">Back to Legal Hub</Link>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
