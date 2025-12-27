import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'Setup',
    description: 'Complete the initial setup for your Emberly instance.',
})

export default function SetupLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
