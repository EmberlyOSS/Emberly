import { getServerSession } from 'next-auth'

import { apiResponse } from '@/lib/api/response'
import { authOptions } from '@/lib/auth'
import { requireAuth } from '@/lib/auth/api-auth'
import { listDevices } from '@/lib/auth/devices'

export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const [devices, session] = await Promise.all([
    listDevices(user.id),
    getServerSession(authOptions),
  ])

  return apiResponse({
    devices: devices.map((device) => ({
      ...device,
      current: device.id === session?.deviceId,
    })),
  })
}
