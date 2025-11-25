import { NextResponse } from 'next/server'

import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import * as blog from '@/lib/blog'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const all = searchParams.get('all') === 'true'
    if (slug) {
      // allow admins to fetch non-published posts by passing `admin=true`
      if (searchParams.get('admin') === 'true') {
        const { user, response } = await requireAuth(request)
        if (response) return response
        const post = await blog.getPostBySlug(slug, false)
        if (!post) return apiError('Post not found', HTTP_STATUS.NOT_FOUND)
        return apiResponse(post)
      }

      const post = await blog.getPostBySlug(slug, true)
      if (!post) return apiError('Post not found', HTTP_STATUS.NOT_FOUND)
      return apiResponse(post)
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // if `all=true` is requested, require admin auth and return all posts
    if (all) {
      const { user, response } = await requireAuth(request)
      if (response) return response
      if (!user || user.role !== 'ADMIN') {
        return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
      }
      const posts = await blog.listPosts({
        publishedOnly: false,
        limit,
        offset,
      })
      return apiResponse(posts)
    }

    const posts = await blog.listPosts({ publishedOnly: true, limit, offset })
    return apiResponse(posts)
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Failed to fetch posts',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuth(request)
    if (response) return response

    if (!user || user.role !== 'ADMIN') {
      return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
    }

    const body = await request.json()
    const { slug, title, content, excerpt, status, publishedAt } = body

    if (!slug || !title || !content) {
      return apiError('Missing required fields', HTTP_STATUS.BAD_REQUEST)
    }

    const created = await blog.createPost({
      slug,
      title,
      content,
      excerpt: excerpt ?? null,
      status: status ?? 'DRAFT',
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      authorId: user.id,
    })

    return apiResponse(created)
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Failed to create post',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
