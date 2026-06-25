import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { bullBoardAdapter } from '@/packages/lib/events/bullmq/board'

type Params = Promise<{ slug?: string[] }>

async function handler(req: Request, { params }: { params: Params }) {
  const { response } = await requireAdmin(req)
  if (response) return response

  const { slug } = await params
  const slugPath = (slug ?? []).join('/')

  return bullBoardAdapter.handleRequest(req, slugPath)
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
