import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import * as blog from '@/lib/blog'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const { searchParams } = new URL(request.url)
    const adminView = searchParams.get('admin') === 'true'

    if (adminView) {
      const { user, response } = await requireAuth(request)
      if (response) return response
      if (!user || user.role !== 'ADMIN')
        return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
      const post = await blog.getPostById(id)
      if (!post) return apiError('Post not found', HTTP_STATUS.NOT_FOUND)
      return apiResponse(post)
    }

    // public view — only published posts
    const post = await blog.getPostById(id)
    if (!post || post.status !== 'PUBLISHED')
      return apiError('Post not found', HTTP_STATUS.NOT_FOUND)
    return apiResponse(post)
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Failed to fetch post',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth(request)
    if (response) return response
    if (!user || user.role !== 'ADMIN')
      return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)

    const id = params.id
    const body = await request.json()

    const updated = await blog.updatePost(id, body)
    return apiResponse(updated)
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Failed to update post',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth(request)
    if (response) return response
    if (!user || user.role !== 'ADMIN')
      return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)

    const id = params.id
    const deleted = await blog.deletePost(id)
    return apiResponse(deleted)
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Failed to delete post',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
