import { apiError, apiResponse, HTTP_STATUS } from '@/lib/api/response'
import { requireSuperAdmin } from '@/lib/auth/api-auth'
import { getFeatures } from '@/lib/features'
import { getStripeSetupStatus, runStripeSetup } from '@/lib/stripe/setup'

async function guard(req: Request) {
  const { response } = await requireSuperAdmin(req)
  if (response) return response
  if (!(await getFeatures()).cloud)
    return apiError('Not found', HTTP_STATUS.NOT_FOUND)
  return null
}

export async function GET(req: Request) {
  const denied = await guard(req)
  if (denied) return denied
  return apiResponse(await getStripeSetupStatus())
}

export async function POST(req: Request) {
  const denied = await guard(req)
  if (denied) return denied
  const body = await req.json().catch(() => ({}))
  try {
    return apiResponse(
      await runStripeSetup(
        typeof body?.secretKey === 'string' ? body.secretKey : undefined
      )
    )
  } catch (error) {
    return apiError((error as Error).message, HTTP_STATUS.BAD_REQUEST)
  }
}
