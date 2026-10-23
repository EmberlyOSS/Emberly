import pkg from '@/package.json'

import { apiResponse } from '@/packages/lib/api/response'
import { getConfig, isBillingEnabled } from '@/packages/lib/config'
import { isCloudEnabled } from '@/packages/lib/config/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const config = await getConfig()
  const cloud = isCloudEnabled()

  return apiResponse({
    name: config.settings.general.siteName || 'Emberly',
    version: pkg.version,
    cloud,
    billingEnabled: await isBillingEnabled(),
    features: {
      customDomains: cloud,
      squads: cloud,
      discovery: cloud,
      deviceSignIn: true,
    },
  })
}
