import { getConfig } from '@/lib/config'
import { isCloudEnabled } from '@/lib/config/env'
import { hasLicenseFeature } from '@/lib/license'
import { isStorageManagedByEnv } from '@/lib/storage/env'

export interface Features {
  cloud: boolean
  billing: boolean
  squads: boolean
  discovery: boolean
  customDomains: boolean
  managedStorage: boolean
  perks: boolean
  storageFromEnv: boolean
  whiteLabel: boolean
  licenseVendor: boolean
}

export type Feature = Exclude<
  keyof Features,
  'cloud' | 'billing' | 'storageFromEnv' | 'whiteLabel' | 'licenseVendor'
>

export function getRouteFeatures(): Omit<Features, 'billing'> {
  const cloud = isCloudEnabled()
  return {
    cloud,
    squads: cloud,
    discovery: cloud,
    customDomains: cloud,
    managedStorage: cloud,
    perks: cloud,
    storageFromEnv: isStorageManagedByEnv(),
    whiteLabel: cloud || hasLicenseFeature('white-label'),
    licenseVendor: cloud && hasLicenseFeature('vendor'),
  }
}

export async function getFeatures(): Promise<Features> {
  const features = getRouteFeatures()
  const billing =
    features.cloud &&
    (await getConfig()).settings.general.billing?.enabled !== false
  return { ...features, billing }
}

export async function isBillingEnabled() {
  return (await getFeatures()).billing
}
