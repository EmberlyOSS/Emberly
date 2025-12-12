import React from 'react'
import Link from 'next/link'

type Props = {
    title: string
    children?: React.ReactNode
    href?: string
    linkLabel?: string
}

export default function DocsCard({ title, children, href, linkLabel }: Props) {
    return (
        <div className="rounded-2xl border border-border/30 bg-background/30 backdrop-blur-sm p-6 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                {href && (
                    <div>
                        <Link href={href} className="text-sm underline">
                            {linkLabel || 'Open'}
                        </Link>
                    </div>
                )}
            </div>
            {children && <div className="mt-3 text-sm text-muted-foreground">{children}</div>}
        </div>
    )
}
