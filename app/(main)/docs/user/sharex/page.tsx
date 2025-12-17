import { Metadata } from 'next'
import PageShell from '@/packages/components/layout/PageShell'
import MarkdownRenderer from '@/packages/components/docs/MarkdownRenderer'

export const metadata: Metadata = {
    title: 'ShareX — Quick Setup | Emberly',
    description: 'Three-step ShareX setup to use with Emberly.',
}

export default function ShareXDoc() {
    const markdown = `## Quick 3 steps (no extra manual steps)
1. Go to <https://emberly.site/dashboard/profile> and download the ShareX file by clicking the button shown below:

   ![Download ShareX config button](https://embrly.ca/RDKNJ/Eu-BIA.png)

2. Download ShareX from its website: <https://getsharex.com/>

3. Open the downloaded ShareX installer (double-click the file). When the prompt appears, click the **OK** button as shown here:

   ![ShareX install prompt - click OK](https://embrly.ca/RDKNJ/7VlHqN.png)

## Done
After those three steps ShareX will be installed and the Emberly config file will be available. No additional manual steps are required here.
`

    return (
        <PageShell title="ShareX" subtitle="Quick 3-step setup to use ShareX with Emberly">
            <section className="max-w-5xl mx-auto px-4">
                <div className="mt-6">
                    <div className="prose prose-invert max-w-none">
                        <MarkdownRenderer>{markdown}</MarkdownRenderer>
                    </div>
                </div>
            </section>
        </PageShell>
    )
}
