import { isBillingEnabled } from '@/packages/lib/config'
import { isCloudEnabled } from '@/packages/lib/config/env'

import type { PlanKey } from '.'

/**
 * The plan to use for feature gating. With billing off Emberly is fully free,
 * so every plan-gated feature is unlocked for everyone.
 */
export async function getFeaturePlan(plan: PlanKey): Promise<PlanKey> {
  return (await isBillingEnabled()) ? plan : 'enterprise'
}

/** What to tell a user who has hit a storage, upload-size or domain limit. */
export async function getLimitIncreaseHint(): Promise<string> {
  if (await isBillingEnabled()) return 'Upgrade your plan to raise your limits.'
  if (isCloudEnabled()) {
    return 'Request a limit increase from the Applications page.'
  }
  return 'Contact an administrator to raise your limits.'
}
