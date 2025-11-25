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
                Last updated: Nov 25, 2025
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <nav className="flex gap-3 text-sm mb-2">
                <a
                  className="underline text-muted-foreground"
                  href="#controller"
                >
                  Controller & Processor
                </a>
                <a className="underline text-muted-foreground" href="#rights">
                  Your rights
                </a>
                <a
                  className="underline text-muted-foreground"
                  href="#retention"
                >
                  Data retention
                </a>
              </nav>

              <h3 id="controller" className="text-base font-semibold">
                Controller & Processor
              </h3>
              <p className="text-sm text-muted-foreground">
                Depending on the deployment, the operator of an Emberly instance
                is the data controller. We provide guidance to instance
                operators about lawful processing and minimizing personal data
                collection.
              </p>

              <h3 id="rights" className="text-base font-semibold">
                Data subject rights
              </h3>
              <p className="text-sm text-muted-foreground">
                Users may have rights to access, rectify, erase, restrict
                processing, object to processing, and request portability of
                personal data. To exercise your rights, contact the instance
                operator or use account tools where available.
              </p>

              <h3 id="retention" className="text-base font-semibold">
                Data retention
              </h3>
              <p className="text-sm text-muted-foreground">
                Retention periods are set by the instance operator. We recommend
                operators publish their retention schedules and provide export
                and deletion options for users.
              </p>

              <h3 className="text-base font-semibold">
                Lawful basis & transfers
              </h3>
              <p className="text-sm text-muted-foreground">
                Processing is typically performed to provide the service
                (contractual necessity) and to comply with legal obligations.
                Data may be transferred across borders; instance operators
                should ensure adequate safeguards for international transfers.
              </p>

              <h3 className="text-base font-semibold">Contact</h3>
              <p className="text-sm text-muted-foreground">
                For GDPR-related requests, consult the{' '}
                <Link href="/legal/privacy" className="underline">
                  Privacy Policy
                </Link>{' '}
                and contact the instance operator. Operators may provide a
                dedicated email for data requests.
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
