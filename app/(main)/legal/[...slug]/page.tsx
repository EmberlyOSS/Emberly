import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import LegalArticle from '@/packages/components/legal/LegalArticle'
import { getLegalBySlug } from '@/packages/lib/legal/service'

type Params = { slug: string[] }

function normalizeSlug(slugParts: string[]) {
    return slugParts.join('/').toLowerCase()
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const resolvedParams = await params
    const slug = Array.isArray(resolvedParams.slug)
        ? resolvedParams.slug
        : [resolvedParams.slug]
    const slugKey = normalizeSlug(slug)

    const legal = await getLegalBySlug(slugKey, true)

    if (!legal) {
        return {
            title: 'Legal Document Not Found',
            description: 'The requested legal document could not be found.',
        }
    }

    return {
        title: legal.title,
        description: legal.excerpt || `${legal.title} - Emberly legal documentation.`,
    }
}

export default async function LegalCatchallPage({ params }: { params: Promise<Params> }) {
    const resolvedParams = await params
    const slug = Array.isArray(resolvedParams.slug)
        ? resolvedParams.slug
        : [resolvedParams.slug]
    const slugKey = normalizeSlug(slug)

    const legal = await getLegalBySlug(slugKey, true)
    if (!legal) return notFound()

    return (
        <LegalArticle
            title={legal.title}
            subtitle={legal.excerpt ?? ''}
            content={legal.content}
            updatedAt={legal.updatedAt ?? legal.publishedAt ?? null}
        />
    )
}
