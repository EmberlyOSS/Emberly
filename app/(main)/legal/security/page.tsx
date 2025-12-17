import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/packages/components/ui/card'


import { Metadata } from 'next'
import PageShell from '@/packages/components/layout/PageShell'

export const metadata: Metadata = {
  title: 'Security Policy | Emberly',
  description: 'Emberly security policy: responsible disclosure, incident response, security practices, and data breach notification.',
}

export default function SecurityPolicyPage() {
  return (
    <PageShell
      title="Security Policy"
      subtitle="Emberly security policy: responsible disclosure, incident response, security practices, and data breach notification."
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-[220px,minmax(0,1fr)]">
        <aside className="hidden md:block sticky top-28">
          <div className="p-4 rounded-lg bg-muted/5">
            <Link href="/legal" className="text-sm underline">
              Back to Legal Hub
            </Link>
            <nav className="mt-3 flex flex-col gap-2 text-sm">
              <a href="#responsible-disclosure" className="text-muted-foreground">
                Responsible disclosure
              </a>
              <a href="#incident-response" className="text-muted-foreground">
                Incident response
              </a>
              <a href="#security-practices" className="text-muted-foreground">
                Security practices
              </a>
              <a href="#data-breach" className="text-muted-foreground">
                Data breach notification
              </a>
              <a href="#contact" className="text-muted-foreground">
                Contact
              </a>
            </nav>
          </div>
        </aside>

        <section className="prose max-w-none text-sm text-muted-foreground">
          <div className="mb-2 text-sm">
            <div className="font-semibold text-foreground text-lg">Security Policy</div>
            <div className="text-sm text-muted-foreground">Last updated: Nov 30, 2025</div>
          </div>

          <div className="mb-4">
            <nav className="flex gap-3 text-sm">
              <a className="underline text-muted-foreground" href="#responsible-disclosure">
                Responsible disclosure
              </a>
              <a className="underline text-muted-foreground" href="#incident-response">
                Incident response
              </a>
              <a className="underline text-muted-foreground" href="#security-practices">
                Security practices
              </a>
              <a className="underline text-muted-foreground" href="#data-breach">
                Breach notification
              </a>
            </nav>
          </div>

          <h3 id="responsible-disclosure" className="text-base font-semibold">Responsible disclosure</h3>
          <p>
            If you discover a vulnerability affecting Emberly's codebase, the
            official websites (emberly.site, emberly.ca), or project-managed
            infrastructure, please do not disclose details publicly until
            maintainers have had a reasonable opportunity to triage and fix the
            issue. Preferred reporting channels are a private GitHub Security
            Advisory or a secure issue on the repository. See the project's
            README or CONTRIBUTING for current disclosure instructions.
          </p>

          <h3 id="incident-response" className="text-base font-semibold">Incident response</h3>
          <p>
            The Emberly team will triage reports affecting project
            infrastructure and publish advisories or patches as needed. For
            project-managed services and the official sites (emberly.site /
            emberly.ca), maintainers will coordinate remediation and
            communicate status to users. The project does not provide managed
            hosting support for third-party installations.
          </p>

          <h3 id="security-practices" className="text-base font-semibold">Security practices</h3>
          <p>
            This section describes key security measures the Emberly project
            applies to project-managed services and the official websites, and
            recommends actions users can take to protect their accounts and
            data.
          </p>
          <ul className="list-disc ml-5">
            <li>Project: apply security updates and patches promptly.</li>
            <li>Project: limit access to project infrastructure and keys.</li>
            <li>Users: use strong, unique passwords and enable MFA where available.</li>
            <li>Users: protect API keys and do not share private upload links.</li>
            <li>Project: maintain backups and test recovery procedures.</li>
          </ul>

          <h3 id="data-breach" className="text-base font-semibold">Data breach notification</h3>
          <p>
            For incidents affecting Emberly project-managed services or the
            official websites (emberly.site / emberly.ca), the project will
            coordinate disclosure and remediation and notify affected users
            where appropriate. The project will follow applicable legal
            requirements for breach notification.
          </p>

          <h3 id="contact" className="text-base font-semibold">Contact & reporting</h3>
          <p>
            To report a security issue affecting Emberly project infrastructure
            or the official websites (emberly.site, emberly.ca), follow the
            repository's disclosure instructions or open a private Security
            Advisory on GitHub. For user-facing concerns about accounts or data
            on the Emberly websites, contact the project using the channels
            listed in the Privacy Policy.{' '}
            <Link href="https://github.com/EmberlyOSS/Website/issues" className="underline">Project issues</Link>.
          </p>

          <div className="mt-6">
            <Link href="/legal" className="text-sm underline">Back to Legal Hub</Link>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
