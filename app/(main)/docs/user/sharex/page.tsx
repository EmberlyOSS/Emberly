import { Metadata } from 'next'
import PageShell from '@/components/layout/PageShell'

export const metadata: Metadata = {
    title: 'ShareX — Quick Setup | Emberly',
    description: 'Three-step ShareX setup to use with Emberly.',
}

export default function ShareXDoc() {
    return (
        <PageShell title="ShareX" subtitle="Quick 3-step setup to use ShareX with Emberly">
            <section className="max-w-5xl mx-auto px-4">
                <div className="mt-6 space-y-6">
                    <section className="p-6">
                        <h2 className="font-medium">Quick 3 steps (no extra manual steps)</h2>
                        <ol className="list-decimal list-inside text-sm mt-2 space-y-4">
                            <li>
                                Go to <a href="https://emberly.site/dashboard/profile" target="_blank" rel="noreferrer" className="underline">https://emberly.site/dashboard/profile</a> and download the ShareX file by clicking the button shown below:
                                <div className="mt-3">
                                    <img src="https://embrly.ca/RDKNJ/Eu-BIA.png" alt="Download ShareX config button" className="rounded shadow-sm max-w-full" />
                                </div>
                            </li>

                            <li>
                                Download ShareX from its website: <a href="https://getsharex.com/" target="_blank" rel="noreferrer" className="underline">https://getsharex.com/</a>
                            </li>

                            <li>
                                Open the downloaded ShareX installer (double-click the file). When the prompt appears, click the <strong>OK</strong> button as shown here:
                                <div className="mt-3">
                                    <img src="https://embrly.ca/RDKNJ/7VlHqN.png" alt="ShareX install prompt - click OK" className="rounded shadow-sm max-w-full" />
                                </div>
                            </li>
                        </ol>
                    </section>

                    <section className="p-6">
                        <h2 className="font-medium">Done</h2>
                        <p className="text-sm text-muted-foreground mt-2">After those three steps ShareX will be installed and the Emberly config file will be available. No additional manual steps are required here.</p>
                    </section>
                </div>
            </section>
        </PageShell>
    )
}
