import { apiError } from '@/packages/lib/api/response'
import { HTTP_STATUS } from '@/packages/lib/api/response'

export async function GET() {
  return apiError('Status page integration removed', HTTP_STATUS.NOT_FOUND)
}
