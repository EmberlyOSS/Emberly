import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'Alpha Migration',
    description: 'Migrate your legacy Emberly alpha account.',
})

export default function AlphaMigrationLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
