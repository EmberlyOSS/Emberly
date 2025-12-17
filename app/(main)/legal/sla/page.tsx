import Link from 'next/link'

import { Metadata } from 'next'
import PageShell from '@/packages/components/layout/PageShell'

export const metadata: Metadata = {
    title: 'Service Level Agreement (SLA) | Emberly',
    description: 'Service level commitments, uptime objectives, support response times, maintenance windows, and remedies.',
}

export default function SlaPage() {
    return (
        <PageShell title="Service Level Agreement (SLA)" subtitle="Service commitments, uptime objectives, support response times, maintenance, and remedies.">
            <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-[220px,minmax(0,1fr)]">
                <aside className="hidden md:block sticky top-28">
                    <div className="p-4 rounded-lg bg-muted/5">
                        <Link href="/legal" className="text-sm underline">Back to Legal Hub</Link>
                        <nav className="mt-3 flex flex-col gap-2 text-sm">
                            <a href="#scope" className="text-muted-foreground">Scope</a>
                            <a href="#uptime" className="text-muted-foreground">Uptime & availability</a>
                            <a href="#support" className="text-muted-foreground">Support & response times</a>
                            <a href="#maintenance" className="text-muted-foreground">Maintenance</a>
                            <a href="#remedies" className="text-muted-foreground">Remedies & credits</a>
                        </nav>
                    </div>
                </aside>

                <section className="prose max-w-none text-sm text-muted-foreground">
                    <div className="mb-2 text-sm">
                        <div className="font-semibold text-foreground text-lg">Service Level Agreement (SLA)</div>
                        <div className="text-sm text-muted-foreground">Effective date: Dec 12, 2025</div>
                    </div>

                    <h3 id="scope" className="text-base font-semibold">Scope</h3>
                    <p>
                        This SLA describes the service availability and support commitments Emberly offers for the official Emberly-hosted services. It applies to customers on paid plans and to services operated by Emberly. For self-hosted or third-party hosted installations, this SLA does not apply; operators of those instances should consult their own hosting agreements.
                    </p>

                    <h3 id="uptime" className="text-base font-semibold">Uptime & availability</h3>
                    <p>
                        Emberly aims to provide 99.9% monthly uptime for core services (API endpoints, file delivery, and web UI). Uptime is measured by Emberly's internal monitoring systems and excludes scheduled maintenance, events outside Emberly's control, and force majeure events.
                    </p>
                    <ul className="list-disc ml-5">
                        <li><strong>Measurement window:</strong> Monthly, aligned to UTC calendar month.</li>
                        <li><strong>Downtime definition:</strong> Periods when core service endpoints fail to respond to valid requests from Emberly monitoring with consistent error rates.</li>
                    </ul>

                    <h3 id="support" className="text-base font-semibold">Support & response times</h3>
                    <p>
                        Emberly provides support to paid customers via the support channels listed on their account. Response targets are measured from the time a valid incident report is received:
                    </p>
                    <ul className="list-disc ml-5">
                        <li><strong>P0 - Critical:</strong> System-wide outage or significant data loss — target initial response within 1 hour.</li>
                        <li><strong>P1 - High:</strong> Significant feature degradation affecting many users — target initial response within 4 hours.</li>
                        <li><strong>P2 - Medium:</strong> Loss of non-critical functionality — target initial response within 1 business day.</li>
                        <li><strong>P3 - Low:</strong> General questions or minor issues — target initial response within 3 business days.</li>
                    </ul>

                    <h3 id="maintenance" className="text-base font-semibold">Maintenance & scheduled downtime</h3>
                    <p>
                        Scheduled maintenance windows will be communicated in advance when possible. Maintenance that is expected to cause downtime will typically be scheduled during off-peak hours and announced at least 48 hours ahead of time when feasible.
                    </p>

                    <h3 id="remedies" className="text-base font-semibold">Remedies & service credits</h3>
                    <p>
                        When Emberly fails to meet the uptime commitment in a given monthly measurement window, eligible customers may request service credits. The credit calculation, eligibility, and maximum credit amounts are described below:
                    </p>
                    <ul className="list-disc ml-5">
                        <li>Availability &lt; 99.9%: 10% credit of monthly service fees for the affected service for that month.</li>
                        <li>Availability &lt; 99.0%: 25% credit of monthly service fees for the affected service for that month.</li>
                        <li>Credits are issued only after a validated incident review and for affected customers with paid subscriptions for the impacted period.</li>
                        <li>Credits are the sole and exclusive remedy for availability breaches; Emberly will not be liable for indirect or consequential damages.</li>
                    </ul>

                    <h3 className="text-base font-semibold">Exclusions</h3>
                    <p>
                        The SLA does not apply to outages or incidents caused by:
                    </p>
                    <ul className="list-disc ml-5">
                        <li>Customer misconfiguration or misuse of the service;</li>
                        <li>Third-party services or dependencies outside Emberly's control (e.g., CDNs, DNS providers) unless the failure is demonstrably within Emberly-managed configuration;</li>
                        <li>Scheduled maintenance windows announced in advance;</li>
                        <li>Events of force majeure or circumstances beyond Emberly's reasonable control.</li>
                    </ul>

                    <h3 className="text-base font-semibold">Reporting incidents</h3>
                    <p>
                        To report an incident that may qualify under this SLA, contact Emberly support and provide details including impacted endpoints, timestamps, and any relevant logs or request IDs. Emberly will investigate and validate the incident before any credit determination.
                    </p>

                    <div className="mt-6">
                        <Link href="/legal" className="text-sm underline">Back to Legal Hub</Link>
                    </div>
                </section>
            </div>
        </PageShell>
    )
}
