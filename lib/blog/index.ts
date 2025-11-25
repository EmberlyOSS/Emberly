import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/database/prisma'

export type CreatePostInput = {
  slug: string
  title: string
  content: string
  excerpt?: string | null
  authorId?: string | null
  status?: Prisma.PostStatus | string
  publishedAt?: Date | null
}

export async function getPostBySlug(slug: string, publishedOnly = true) {
  // If caller wants only published posts, use findFirst with both slug and status
  // Otherwise use findUnique which requires the unique `slug` field.
  const include = {
    author: {
      select: { id: true, name: true, urlId: true, image: true },
    },
  }

  if (publishedOnly) {
    const post = await prisma.blogPost.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include,
    })
    return post
  }

  const post = await prisma.blogPost.findUnique({ where: { slug }, include })
  return post
}

export async function getPostById(id: string) {
  return prisma.blogPost.findUnique({ where: { id } })
}

export async function listPosts(opts?: {
  publishedOnly?: boolean
  limit?: number
  offset?: number
}) {
  const { publishedOnly = true, limit = 10, offset = 0 } = opts || {}

  const where: Prisma.BlogPostWhereInput = {}
  if (publishedOnly) where.status = 'PUBLISHED'

  const posts = await prisma.blogPost.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, urlId: true, image: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    skip: offset,
  })

  return posts
}

export async function createPost(data: CreatePostInput) {
  const post = await prisma.blogPost.create({
    data: {
      slug: data.slug,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt ?? null,
      status: (data.status as any) ?? 'DRAFT',
      publishedAt: data.publishedAt ?? null,
      author: data.authorId ? { connect: { id: data.authorId } } : undefined,
    },
  })

  return post
}

export async function updatePost(id: string, data: Partial<CreatePostInput>) {
  const updateData: any = {}
  if (data.slug !== undefined) updateData.slug = data.slug
  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
  if (data.status !== undefined) updateData.status = data.status
  if (data.publishedAt !== undefined) updateData.publishedAt = data.publishedAt
  if (data.authorId !== undefined)
    updateData.author = data.authorId
      ? { connect: { id: data.authorId } }
      : { disconnect: true }

  return prisma.blogPost.update({ where: { id }, data: updateData })
}

export async function deletePost(id: string) {
  return prisma.blogPost.delete({ where: { id } })
}

export default {
  getPostBySlug,
  getPostById,
  listPosts,
  createPost,
  updatePost,
  deletePost,
}
