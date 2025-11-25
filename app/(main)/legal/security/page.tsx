import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SecurityPolicyPage() {
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
                href="#responsible-disclosure"
                className="text-muted-foreground underline"
              >
                Responsible disclosure
              </a>
              <a
                href="#incident-response"
                className="text-muted-foreground underline"
              >
                Incident response
              </a>
              <a
                href="#security-practices"
                className="text-muted-foreground underline"
              >
                Security practices
              </a>
              <a
                href="#data-breach"
                className="text-muted-foreground underline"
              >
                Data breach notification
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
              <CardTitle>Security Policy</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: Nov 25, 2025
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <nav className="flex gap-3 text-sm mb-2">
                <a
                  className="underline text-muted-foreground"
                  href="#responsible-disclosure"
                >
                  Responsible disclosure
                </a>
                <a
                  className="underline text-muted-foreground"
                  href="#incident-response"
                >
                  Incident response
                </a>
                <a
                  className="underline text-muted-foreground"
                  href="#security-practices"
                >
                  Security practices
                </a>
                <a
                  className="underline text-muted-foreground"
                  href="#data-breach"
                >
                  Breach notification
                </a>
              </nav>

              <h3
                id="responsible-disclosure"
                className="text-base font-semibold"
              >
                Responsible disclosure
              </h3>
              <p className="text-sm text-muted-foreground">
                We welcome responsible disclosure of security vulnerabilities.
                If you discover an issue, please do not publish details publicly
                until it has been addressed. Preferred reporting options are
                opening a private GitHub issue, or contacting the maintainers
                via the contact methods listed below.
              </p>

              <h3 id="incident-response" className="text-base font-semibold">
                Incident response
              </h3>
              <p className="text-sm text-muted-foreground">
                We aim to acknowledge reports within 72 hours and to provide
                regular updates as we investigate. For confirmed vulnerabilities
                we will publish remediation timelines and mitigation guidance to
                affected users where appropriate.
              </p>

              <h3 id="security-practices" className="text-base font-semibold">
                Security practices
              </h3>
              <p className="text-sm text-muted-foreground">
                Key practices recommended and followed by Emberly include:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>
                  Transport security: use HTTPS/TLS for all web and API traffic.
                </li>
                <li>
                  Least privilege: restrict access to storage buckets,
                  databases, and API keys.
                </li>
                <li>
                  Dependency management: regularly update dependencies and apply
                  security patches.
                </li>
                <li>
                  Backups and retention: configure backups with appropriate
                  retention and access controls.
                </li>
                <li>
                  Sanitization & validation: validate inputs and sanitize file
                  metadata where applicable.
                </li>
              </ul>

              <h3 id="data-breach" className="text-base font-semibold">
                Data breach notification
              </h3>
              <p className="text-sm text-muted-foreground">
                In the event of a data breach affecting personal data, Emberly
                (or the instance operator) will notify affected users and
                relevant authorities in accordance with applicable law.
                Notifications will include the nature of the incident, the data
                types involved, and recommended user actions.
              </p>

              <h3 id="contact" className="text-base font-semibold">
                Contact & reporting
              </h3>
              <p className="text-sm text-muted-foreground">
                To report a security issue, please open a GitHub issue at{' '}
                <Link
                  href="https://github.com/EmberlyOSS/Website/issues"
                  className="underline"
                >
                  Emberly GitHub Issues
                </Link>{' '}
                or contact the instance operator. Instance operators may provide
                a dedicated security contact or email for faster handling.
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
