import pkg from '@/package.json'

import { apiResponse } from '@/lib/api/response'
import { getConfig } from '@/lib/config'
import { getFeatures } from '@/lib/features'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [config, features] = await Promise.all([getConfig(), getFeatures()])

  return apiResponse({
    name: config.settings.general.siteName || 'Emberly',
    version: pkg.version,
    cloud: features.cloud,
    billingEnabled: features.billing,
    features: {
      customDomains: features.customDomains,
      squads: features.squads,
      discovery: features.discovery,
      deviceSignIn: true,
    },
  })
}
