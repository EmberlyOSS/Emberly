import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Media Kit',
  description:
    'Brand assets, logos, colors, and guidelines for press and partners.',
})

export default function MediaKitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
