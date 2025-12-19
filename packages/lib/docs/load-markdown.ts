import { promises as fs } from 'fs'
import path from 'path'
import { DocCategory } from '@prisma/client'
import { notFound } from 'next/navigation'

import { getDocByCategorySlug } from '@/packages/lib/docs/service'

export type LoadedDocPage = {
    content: string
    title: string
    description?: string | null
    category: DocCategory
    slug: string
}

export type LoadDocPageParams = {
    category: DocCategory
    slug: string
    fallbackPath: string
    fallbackTitle: string
    fallbackDescription?: string | null
}

function parseDocPath(relativePath: string): { category: DocCategory; slug: string } | null {
    const normalized = relativePath.replace(/\\/g, '/').replace(/^\//, '')
    const [categorySegment, ...rest] = normalized.split('/').filter(Boolean)
    if (!categorySegment || rest.length === 0) return null

    const slugWithExt = rest.join('/')
    const slug = slugWithExt.replace(/\.md$/i, '')
    const upper = categorySegment.toUpperCase() as DocCategory
    if (upper === 'HOSTING' || upper === 'USERS' || upper === 'MAIN' || upper === 'INTEGRATIONS') {
        return { category: upper, slug }
    }

    return null
}

export async function loadDocPage(params: LoadDocPageParams): Promise<LoadedDocPage> {
    const { category, slug, fallbackPath, fallbackTitle, fallbackDescription } = params

    const publishedDoc = await getDocByCategorySlug(category, slug, true)
    if (publishedDoc?.content) {
        return {
            content: publishedDoc.content,
            title: publishedDoc.title,
            description: publishedDoc.excerpt ?? fallbackDescription ?? undefined,
            category,
            slug,
        }
    }

    const existingDoc = await getDocByCategorySlug(category, slug, false)
    if (existingDoc) {
        notFound()
        throw new Error(`Documentation ${category}/${slug} is not published`)
    }

    const docPath = path.join(process.cwd(), 'packages', 'documentation', fallbackPath)
    try {
        const content = await fs.readFile(docPath, 'utf8')
        return {
            content,
            title: fallbackTitle,
            description: fallbackDescription ?? undefined,
            category,
            slug,
        }
    } catch (error) {
        notFound()
        throw new Error(`Documentation markdown not found at ${fallbackPath}`)
    }
}

export async function loadDocumentationMarkdown(relativePath: string): Promise<string> {
    const parsed = parseDocPath(relativePath)
    if (parsed) {
        const doc = await loadDocPage({
            category: parsed.category,
            slug: parsed.slug,
            fallbackPath: relativePath,
            fallbackTitle: parsed.slug,
        })
        return doc.content
    }

    const docPath = path.join(process.cwd(), 'packages', 'documentation', relativePath)

    try {
        return await fs.readFile(docPath, 'utf8')
    } catch (error) {
        notFound()
        throw new Error(`Documentation markdown not found at ${relativePath}`)
    }
}
