import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function GdprPage() {
  return (
    <main className="container mx-auto py-8">
      <div className="grid md:grid-cols-4 gap-6">
        <aside className="hidden md:block sticky top-24">
          <div className="space-y-3 p-4 rounded-lg bg-secondary/6">
            <Link href="/legal" className="text-sm underline">
              Back to Legal Hub
            </Link>
            <nav className="mt-2 flex flex-col gap-2 text-sm">
              <a href="#controller" className="text-muted-foreground underline">
                Controller & Processor
              </a>
              <a href="#rights" className="text-muted-foreground underline">
                Your rights
              </a>
              <a href="#retention" className="text-muted-foreground underline">
                Data retention
              </a>
              <a href="#contact" className="text-muted-foreground underline">
                Contact
              </a>
            </nav>
          </div>
        </aside>

        <section className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>GDPR & Data Protection</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: Nov 30, 2025
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <nav className="flex gap-3 text-sm mb-2">
                <a className="underline text-muted-foreground" href="#scope">
                  Scope
                </a>
                <a className="underline text-muted-foreground" href="#rights">
                  Your rights
                </a>
                <a
                  className="underline text-muted-foreground"
                  href="#retention"
                >
                  Retention & exports
                </a>
              </nav>

              <h3 id="scope" className="text-base font-semibold">
                Scope & responsibilities
              </h3>
              <p className="text-sm text-muted-foreground">
                This page describes how Emberly (the project and the official
                website at emberly.site and emberly.ca) collects and processes
                personal data. It explains what data we collect, why we collect
                it, how long we retain it, and how to contact the project about
                data requests. This policy applies to data processed by the
                Emberly project and the official Emberly websites and services
                (emberly.site / emberly.ca).
              </p>

              <h3 id="rights" className="text-base font-semibold">
                Data subject rights
              </h3>
              <p className="text-sm text-muted-foreground">
                Where applicable, individuals have statutory rights such as
                access, rectification, erasure, restriction, objection, and
                portability. To exercise these rights for data held by the
                Emberly project (for example, data associated with an account on
                the official site at emberly.site or emberly.ca), contact the
                project via the channels listed in the Privacy Policy or open an
                issue on the project's GitHub repository. We will respond to
                legitimate requests in accordance with applicable law.
              </p>

              <h3 id="retention" className="text-base font-semibold">
                Retention, exports & deletion
              </h3>
              <p className="text-sm text-muted-foreground">
                The Emberly project retains personal data only as long as
                necessary for the purposes described (account maintenance,
                security, support, and legal compliance). Users can request an
                account export or deletion for data held by Emberly. See the
                Privacy Policy for the procedures and approximate retention
                timeframes.
              </p>

              <h3 className="text-base font-semibold">Contact</h3>
              <p className="text-sm text-muted-foreground">
                For data questions about Emberly project-managed services or the
                Emberly website, consult the Privacy Policy and contact the
                project via GitHub or the listed contact methods. If you are
                unsure where your data is stored or who to contact, open an
                issue on the repository and the maintainers will advise on the
                appropriate next steps.{' '}
                <Link href="/legal/privacy" className="underline">
                  Privacy Policy
                </Link>
                .
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
