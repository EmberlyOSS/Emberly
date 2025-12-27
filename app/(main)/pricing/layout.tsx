import React from 'react'

import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'Pricing',
    description: 'Simple, predictable pricing for teams and builders.',
})

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
