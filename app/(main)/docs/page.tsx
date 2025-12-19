import DocsAlert from '@/packages/components/docs/DocsAlert'
import DocsShell from '@/packages/components/docs/DocsShell'
import { listDocs } from '@/packages/lib/docs/service'

export const metadata = {
  title: 'Documentation | Emberly',
  description: 'Guides, API reference, and examples to help you get started with Emberly.',
}

function docHref(category: string, slug: string): string | null {
  if (category === 'HOSTING') return `/docs/hosting/${slug}`
  if (category === 'USERS') {
    if (slug === 'index' || slug === 'user') return '/docs/user'
    return `/docs/user/${slug}`
  }
  if (category === 'INTEGRATIONS') {
    if (slug === 'index') return '/docs/integrations'
    return `/docs/integrations/${slug}`
  }
  if (category === 'MAIN') {
    if (slug === 'index') return '/docs'
    return `/docs/${slug}`
  }
  return null
}

export default async function DocsPage() {
  const docs = await listDocs({ publishedOnly: true, limit: 500 })

  const docItems = docs
    .map((doc) => {
      const href = docHref(doc.category, doc.slug)
      if (!href) return null
      return {
        id: doc.id,
        title: doc.title,
        description: doc.excerpt ?? '',
        category: doc.category,
        href,
        updatedAt: doc.updatedAt?.toISOString() ?? null,
        authorName: doc.author?.name ?? null,
      }
    })
    .filter(Boolean) as Parameters<typeof DocsShell>[0]['docs']

  return (
    <DocsShell
      title="Documentation"
      subtitle="Guides, API reference, and user docs for Emberly."
      bodyVariant="card"
      docs={docItems}
      footer={(
        <DocsAlert title="Open Source Note">
          Emberly is open source. This live site includes some proprietary pages (pricing, hosted docs, blog etc), that
          the OSS repo may not contain.
        </DocsAlert>
      )}
    />
  )
}
