import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'Verify Email',
    description: 'Verify your Emberly account email address.',
})

export default function VerifyEmailLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
