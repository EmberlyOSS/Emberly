import React from 'react'

import PageShell from '@/packages/components/layout/PageShell'

import DocsBrowser, { DocsBrowserDoc } from './DocsBrowser'

type DocsShellProps = {
    title: string
    subtitle: string
    docs: DocsBrowserDoc[]
    bodyVariant?: 'card' | 'plain'
    footer?: React.ReactNode
}

export default function DocsShell({
    title,
    subtitle,
    docs,
    bodyVariant = 'card',
    footer,
}: DocsShellProps) {
    return (
        <PageShell title={title} subtitle={subtitle} bodyVariant={bodyVariant}>
            <div className="space-y-8">
                <DocsBrowser docs={docs} bodyVariant={bodyVariant} />
                {footer ? <div>{footer}</div> : null}
            </div>
        </PageShell>
    )
}
