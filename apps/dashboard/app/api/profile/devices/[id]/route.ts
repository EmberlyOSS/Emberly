import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import { renameDevice, revokeDevice } from '@/lib/auth/devices'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  const { name } = (await req.json().catch(() => ({}))) as { name?: unknown }
  if (typeof name !== 'string' || !name.trim()) {
    return apiError('Enter a name for this device', HTTP_STATUS.BAD_REQUEST)
  }

  if (!(await renameDevice(user.id, id, name))) {
    return apiError('Device not found', HTTP_STATUS.NOT_FOUND)
  }
  return apiResponse({ success: true })
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  if (!(await revokeDevice(user.id, id))) {
    return apiError('Device not found', HTTP_STATUS.NOT_FOUND)
  }
  return apiResponse({ success: true })
}
