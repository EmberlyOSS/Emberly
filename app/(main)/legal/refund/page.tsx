import Link from 'next/link'

import { Metadata } from 'next'
import PageShell from '@/components/layout/PageShell'

export const metadata: Metadata = {
    title: 'Refund Policy | Emberly',
    description: 'Emberly refund policy: eligibility, request process, timelines, and exceptions for paid plans and add-ons.',
}

export default function RefundPolicyPage() {
    return (
        <PageShell title="Refund Policy" subtitle="Eligibility, request process, timelines, and exceptions for paid plans and add-ons.">
            <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-[220px,minmax(0,1fr)]">
                <aside className="hidden md:block sticky top-28">
                    <div className="p-4 rounded-lg bg-muted/5">
                        <Link href="/legal" className="text-sm underline">Back to Legal Hub</Link>
                        <nav className="mt-3 flex flex-col gap-2 text-sm">
                            <a href="#eligibility" className="text-muted-foreground">Eligibility</a>
                            <a href="#request-process" className="text-muted-foreground">Request process</a>
                            <a href="#timelines" className="text-muted-foreground">Timelines</a>
                            <a href="#exceptions" className="text-muted-foreground">Exceptions</a>
                            <a href="#contact" className="text-muted-foreground">Contact</a>
                        </nav>
                    </div>
                </aside>

                <section className="prose max-w-none text-sm text-muted-foreground">
                    <div className="mb-2 text-sm">
                        <div className="font-semibold text-foreground text-lg">Refund Policy</div>
                        <div className="text-sm text-muted-foreground">Effective date: Dec 12, 2025</div>
                    </div>

                    <p>
                        Emberly offers paid plans and add-ons to provide enhanced features and increased usage limits. This Refund Policy describes when refunds may be available, how to request a refund, applicable timelines, and common exceptions. This policy applies to purchases made through Emberly's official checkout and payment processors.
                    </p>

                    <h3 id="eligibility" className="text-base font-semibold">Eligibility</h3>
                    <p>
                        Refund eligibility depends on the product purchased and the circumstances:
                    </p>
                    <ul className="list-disc ml-5">
                        <li><strong>Monthly subscriptions:</strong> Customers may request cancellations at any time. Refunds for partial billing periods are provided only when required by local law or at Emberly's discretion in exceptional cases (for example, billing errors).</li>
                        <li><strong>Annual subscriptions:</strong> Annual plans may be eligible for pro-rated refunds when canceled within a defined trial or grace period; otherwise refunds are handled case-by-case and subject to Emberly's billing policies.</li>
                        <li><strong>One-time purchases and add-ons:</strong> One-time purchases (e.g., storage add-ons or credits) may be refundable within a short window after purchase when no usage has occurred and no fulfillment has been completed.</li>
                        <li><strong>Trials and promotional purchases:</strong> Free trials do not require refunds. Promotional or discounted purchases follow the same refund rules unless otherwise stated at purchase.</li>
                    </ul>

                    <h3 id="request-process" className="text-base font-semibold">Request process</h3>
                    <p>
                        To request a refund, contact Emberly support through the support channels on your account or via the contact methods listed on the website. Include the following information to help us process your request quickly:
                    </p>
                    <ul className="list-disc ml-5">
                        <li>Account email or user ID</li>
                        <li>Order or invoice number</li>
                        <li>Reason for the refund request and any supporting details</li>
                    </ul>
                    <p>
                        Emberly will acknowledge refund requests promptly and may request additional information to validate the request and investigate usage or billing records.
                    </p>

                    <h3 id="timelines" className="text-base font-semibold">Timelines</h3>
                    <p>
                        After receiving a valid refund request, Emberly aims to review and process refunds within 5	610 business days. The actual time for funds to appear in your account depends on your payment method and processor and may take additional days beyond Emberly's processing.
                    </p>

                    <h3 id="exceptions" className="text-base font-semibold">Exceptions & non-refundable items</h3>
                    <ul className="list-disc ml-5">
                        <li>Fees charged by payment processors (e.g., transaction fees) are generally non-refundable unless otherwise stated.</li>
                        <li>Fraudulent charges or disputes may be subject to chargeback processes with your card issuer and may require separate investigations.</li>
                        <li>Refused service due to violation of Terms of Service or abuse policies is not eligible for refunds in most cases.</li>
                        <li>Purchases made through third-party resellers or marketplace platforms follow the refund policies of those platforms; contact the reseller for refund requests in such cases.</li>
                    </ul>

                    <h3 id="contact" className="text-base font-semibold">Contact</h3>
                    <p>
                        For refund requests, billing questions, or disputes, please contact Emberly support via your account support channels. If you cannot access account support, use the public contact methods listed on the site and include the information described above.
                    </p>

                    <div className="mt-6">
                        <Link href="/legal" className="text-sm underline">Back to Legal Hub</Link>
                    </div>
                </section>
            </div>
        </PageShell>
    )
}
