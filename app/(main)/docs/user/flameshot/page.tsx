import { Metadata } from 'next'
import PageShell from '@/components/layout/PageShell'

export const metadata: Metadata = {
    title: 'Flameshot — Screenshots | Emberly',
    description: 'How to capture, annotate, and upload screenshots using Flameshot and Emberly.',
}

export default function FlameshotDoc() {
    return (
        <PageShell title="Flameshot" subtitle="Capture, annotate, and share screenshots with Flameshot and Emberly">
            <section className="max-w-5xl mx-auto px-4">
                <div className="mt-6 space-y-6">
                    <section className="p-6">
                        <h2 className="font-medium">Quick 3 steps</h2>
                        <ol className="list-decimal list-inside text-sm mt-2 space-y-4">
                            <li>
                                Download Flameshot: visit <a href="https://flameshot.org/" target="_blank" rel="noreferrer" className="underline">https://flameshot.org/</a> and install the app for your OS.
                            </li>

                            <li>
                                Take a screenshot and follow the prompts to set up Flameshot to use Emberly as an uploader. Configure Flameshot so it sends captures to your Emberly upload area (set the upload action to point to your Emberly uploader).
                            </li>

                            <li>
                                Click and use it — the screenshot in the dashboard looks like this:
                                <div className="mt-3">
                                    <img src="https://embrly.ca/RDKNJ/XxwSYI.png" alt="screenshot in the dashboard" className="rounded shadow-sm max-w-full" />
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">The downloaded image will look like this:</p>
                                <div className="mt-3">
                                    <img src="https://embrly.ca/RDKNJ/9pgfZv.png" alt="downloaded screenshot" className="rounded shadow-sm max-w-full" />
                                </div>
                            </li>
                        </ol>
                    </section>
                </div>
            </section>
        </PageShell>
    )
}
