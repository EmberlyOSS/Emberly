import { MagicLinkCallback } from '@/components/auth/magic-link-callback'
import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'Sign in with Magic Link',
    description: 'Verifying your sign in link...',
})

export default function MagicLinkPage() {
    return <MagicLinkCallback />
}
