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
            <div className="container space-y-16 -mt-8">
                {hasTitle && hasSubtitle ? (
                    <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                        <div className="relative p-8">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold">{title}</h1>
                                    <p className="text-muted-foreground mt-2">{subtitle}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {bodyVariant === 'card' ? (
                    <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                        <div className="relative p-8">
                            {children}
                        </div>
                    </div>
                ) : (
                    <div className="relative -mt-16">{children}</div>
                )}
            </div>
        </DashboardWrapper>
    )
}
