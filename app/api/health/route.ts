import { apiResponse } from '@/packages/lib/api/response'

export async function GET() {
  return apiResponse({ status: 'ok' })
}
