import React from 'react'
import { DashboardWrapper } from '@/packages/components/dashboard/dashboard-wrapper'
import { getConfig } from '@/packages/lib/config'

interface PageShellProps {
    title?: string
    subtitle?: string
    children: React.ReactNode
    /**
     * Wraps the main content in a glass card. For docs we sometimes want a plain canvas.
     * Defaults to `card` to preserve existing pages.
     */
    bodyVariant?: 'card' | 'plain'
}

export default async function PageShell({ title, subtitle, children, bodyVariant = 'card' }: PageShellProps) {
    const config = await getConfig()
    const { value, unit } = config.settings.general.storage.maxUploadSize
    const maxSizeBytes = value * (unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024)

    const hasTitle = Boolean(title)
    const hasSubtitle = Boolean(subtitle)

    if ((hasTitle && !hasSubtitle) || (!hasTitle && hasSubtitle)) {
        throw new Error('PageShell requires both title and subtitle together, or neither.')
    }

    return (
        <DashboardWrapper nav="base" showFooter={config.settings.general.credits.showFooter} maxUploadSize={maxSizeBytes}>
            <div className="container space-y-8 -mt-16">
                {hasTitle && hasSubtitle ? (
                    <div className="glass-card">
                        <div className="p-8">
                            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                            <p className="text-muted-foreground mt-1">{subtitle}</p>
                        </div>
                    </div>
                ) : null}

                {bodyVariant === 'plain' ? (
                    <div className={hasTitle ? '' : 'relative -mt-8'}>{children}</div>
                ) : (
                    <div>{children}</div>
                )}
            </div>
        </DashboardWrapper>
    )
}
