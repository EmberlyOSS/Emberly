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
                Last updated: Nov 30, 2025
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
                If you discover a vulnerability affecting Emberly's codebase,
                the official websites (emberly.site, emberly.ca), or
                project-managed infrastructure, please do not disclose details
                publicly until maintainers have had a reasonable opportunity to
                triage and fix the issue. Preferred reporting channels are a
                private GitHub Security Advisory or a secure issue on the
                repository. See the project's README or CONTRIBUTING for current
                disclosure instructions.
              </p>

              <h3 id="incident-response" className="text-base font-semibold">
                Incident response
              </h3>
              <p className="text-sm text-muted-foreground">
                The Emberly team will triage reports affecting project
                infrastructure and publish advisories or patches as needed. For
                project-managed services and the official sites (emberly.site /
                emberly.ca), maintainers will coordinate remediation and
                communicate status to users. The project does not provide
                managed hosting support for third-party installations.
              </p>

              <h3 id="security-practices" className="text-base font-semibold">
                Security practices
              </h3>
              <p className="text-sm text-muted-foreground">
                This section describes key security measures the Emberly project
                applies to project-managed services and the official websites,
                and recommends actions users can take to protect their accounts
                and data.
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>Project: apply security updates and patches promptly.</li>
                <li>
                  Project: limit access to project infrastructure and keys.
                </li>
                <li>
                  Users: use strong, unique passwords and enable MFA where
                  available.
                </li>
                <li>
                  Users: protect API keys and do not share private upload links.
                </li>
                <li>Project: maintain backups and test recovery procedures.</li>
              </ul>

              <h3 id="data-breach" className="text-base font-semibold">
                Data breach notification
              </h3>
              <p className="text-sm text-muted-foreground">
                For incidents affecting Emberly project-managed services or the
                official websites (emberly.site / emberly.ca), the project will
                coordinate disclosure and remediation and notify affected users
                where appropriate. The project will follow applicable legal
                requirements for breach notification.
              </p>

              <h3 id="contact" className="text-base font-semibold">
                Contact & reporting
              </h3>
              <p className="text-sm text-muted-foreground">
                To report a security issue affecting Emberly project
                infrastructure or the official websites (emberly.site,
                emberly.ca), follow the repository's disclosure instructions or
                open a private Security Advisory on GitHub. For user-facing
                concerns about accounts or data on the Emberly websites, contact
                the project using the channels listed in the Privacy Policy.{' '}
                <Link
                  href="https://github.com/EmberlyOSS/Website/issues"
                  className="underline"
                >
                  Project issues
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
