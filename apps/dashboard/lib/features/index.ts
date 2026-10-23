import { getConfig } from '@/lib/config'
import { isCloudEnabled } from '@/lib/config/env'

export interface Features {
  cloud: boolean
  billing: boolean
  squads: boolean
  discovery: boolean
  customDomains: boolean
  managedStorage: boolean
  perks: boolean
}

export type Feature = Exclude<keyof Features, 'cloud' | 'billing'>

export function getRouteFeatures(): Omit<Features, 'billing'> {
  const cloud = isCloudEnabled()
  return {
    cloud,
    squads: cloud,
    discovery: cloud,
    customDomains: cloud,
    managedStorage: cloud,
    perks: cloud,
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
