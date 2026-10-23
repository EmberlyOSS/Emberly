import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import LegalArticle from '@/packages/components/legal/LegalArticle'
import {
  LEGAL_DOCUMENTS,
  getLegalDocument,
} from '@/packages/lib/legal/documents'

type Params = { slug: string[] }

function resolve(slug: string[] | string) {
  const parts = Array.isArray(slug) ? slug : [slug]
  return getLegalDocument(parts.join('/'))
}

export function generateStaticParams(): Params[] {
  return LEGAL_DOCUMENTS.map((doc) => ({ slug: [doc.slug] }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const doc = resolve((await params).slug)
  if (!doc) {
    return {
      title: 'Legal Document Not Found',
      description: 'The requested legal document could not be found.',
    }
  }
  return { title: doc.title, description: doc.summary }
}

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<Params>
}) {
  const doc = resolve((await params).slug)
  if (!doc) notFound()

  return (
    <LegalArticle
      title={doc.title}
      subtitle={doc.summary}
      content={doc.content.trim()}
      updatedAt={new Date(`${doc.updatedAt}T12:00:00Z`)}
    />
  )
}
