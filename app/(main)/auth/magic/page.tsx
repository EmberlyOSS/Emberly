import { MagicLinkCallback } from '@/packages/components/auth/magic-link-callback'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'Sign in with Magic Link',
    description: 'Verifying your sign in link...',
})

export default function MagicLinkPage() {
    return <MagicLinkCallback />
}
