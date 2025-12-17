import { Metadata } from 'next'
import PageShell from '@/packages/components/layout/PageShell'
import MarkdownRenderer from '@/packages/components/docs/MarkdownRenderer'

export const metadata: Metadata = {
    title: 'Flameshot — Screenshots | Emberly',
    description: 'How to capture, annotate, and upload screenshots using Flameshot and Emberly.',
}

export default function FlameshotDoc() {
    const markdown = `## Quick 3 steps
1. Download Flameshot: visit <https://flameshot.org/> and install the app for your OS.
2. Take a screenshot and follow the prompts to set up Flameshot to use Emberly as an uploader. Configure Flameshot so it sends captures to your Emberly upload area (set the upload action to point to your Emberly uploader).
3. Click and use it — the screenshot in the dashboard looks like this:

   ![screenshot in the dashboard](https://embrly.ca/RDKNJ/XxwSYI.png)

   The downloaded image will look like this:

   ![downloaded screenshot](https://embrly.ca/RDKNJ/9pgfZv.png)
`

    return (
        <PageShell title="Flameshot" subtitle="Capture, annotate, and share screenshots with Flameshot and Emberly">
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
