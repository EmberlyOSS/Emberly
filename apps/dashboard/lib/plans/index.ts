/**
 * Centralized plan resolution utilities.
 * 
 * Provides canonical plan key resolution, feature gating helpers,
 * and plan display metadata. Import this instead of inline plan checks.
 */

export type PlanKey = 'free' | 'glow' | 'flare' | 'blaze' | 'inferno' | 'ember' | 'enterprise'

export type NexiumPlanKey = 'nexium-free' | 'nexium-pro' | 'nexium-team' | 'nexium-studio'

export const NEXIUM_PLAN_TIER: Record<NexiumPlanKey, number> = {
    'nexium-free': 0,
    'nexium-pro': 1,
    'nexium-team': 2,
    'nexium-studio': 3,
}

export function nexiumPlanAtLeast(planA: NexiumPlanKey, planB: NexiumPlanKey): boolean {
    return NEXIUM_PLAN_TIER[planA] >= NEXIUM_PLAN_TIER[planB]
}

/**
 * Resolve a Nexium squad product to a canonical Nexium plan key.
 */
export function nexiumPlanKeyForProduct(
    product: { slug?: string | null; stripeProductId?: string | null } | null
): NexiumPlanKey {
    if (!product) return 'nexium-free'
    const p = (product.slug || product.stripeProductId || '').toLowerCase()
    if (p.includes('nexium-studio') || p.includes('studio') || p.includes('unlimited')) return 'nexium-studio'
    if (p.includes('nexium-team') || p.includes('team')) return 'nexium-team'
    if (p.includes('nexium-pro') || p.includes('pro')) return 'nexium-pro'
    return 'nexium-free'
}

/** Human-readable Discovery plan names */
export const NEXIUM_PLAN_DISPLAY_NAMES: Record<NexiumPlanKey, string> = {
    'nexium-free': 'Discovery Free',
    'nexium-pro': 'Discovery Pro',
    'nexium-team': 'Discovery Team',
    'nexium-studio': 'Discovery Studio',
}

/** Whether a squad has API key access */
export function nexiumHasApiAccess(planKey: NexiumPlanKey): boolean {
    return nexiumPlanAtLeast(planKey, 'nexium-team')
}

/** Whether a squad has advanced analytics */
export function nexiumHasAdvancedAnalytics(planKey: NexiumPlanKey): boolean {
    return nexiumPlanAtLeast(planKey, 'nexium-pro')
}

/** Whether a squad has unlimited members */
export function nexiumIsUnlimitedPlan(planKey: NexiumPlanKey): boolean {
    return planKey === 'nexium-studio'
}

/**
 * Numeric tier values for ordered comparisons.
 * Higher = more capable plan.
 */
export const PLAN_TIER: Record<PlanKey, number> = {
    free: 0,
    glow: 1,
    flare: 2,
    blaze: 3,
    inferno: 4,
    ember: 5,
    enterprise: 6,
}

/** Returns true if planA is at least as capable as planB */
export function planAtLeast(planA: PlanKey, planB: PlanKey): boolean {
    return PLAN_TIER[planA] >= PLAN_TIER[planB]
}

/**
 * Resolve a subscription's product to a canonical plan key.
 * Nexium plans (slug starting with "nexium-") are not Emberly plans — use nexiumPlanKeyForProduct() instead.
 */
export function planKeyForProduct(
    product: { slug?: string | null; stripeProductId?: string | null } | null
): PlanKey {
    if (!product) return 'free'
    const p = (product.slug || product.stripeProductId || '').toLowerCase()
    // Nexium squad plans are a different product family — do not match as Emberly plan keys
    if (p.startsWith('nexium-')) return 'free'
    // Check most specific / highest tiers first
    if (p.includes('enterprise')) return 'enterprise'
    if (p.includes('ember') || p.includes('unlimited')) return 'ember'
    if (p.includes('inferno')) return 'inferno'
    if (p.includes('blaze') || p.includes('team') || p.includes('scale')) return 'blaze'
    if (p.includes('flare') || p.includes('pro')) return 'flare'
    if (p.includes('glow') || p.includes('starter')) return 'glow'
    if (p.includes('free') || p.includes('spark')) return 'free'
    return 'glow'
}

/** Human-readable plan names */
export const PLAN_DISPLAY_NAMES: Record<PlanKey, string> = {
    free: 'Spark (Free)',
    glow: 'Glow',
    flare: 'Flare',
    blaze: 'Blaze',
    inferno: 'Inferno',
    ember: 'Ember',
    enterprise: 'Enterprise',
}

/**
 * Check whether a plan includes analytics features.
 */
export function hasAnalytics(planKey: PlanKey): boolean {
    return planKey !== 'free'
}

/**
 * Check whether a plan includes advanced analytics (charts, export, etc.).
 */
export function hasAdvancedAnalytics(planKey: PlanKey): boolean {
    return planAtLeast(planKey, 'flare')
}

/**
 * Check whether a plan includes team seats / role management.
 */
export function hasTeamFeatures(planKey: PlanKey): boolean {
    return planAtLeast(planKey, 'blaze')
}

/**
 * Check whether a plan includes SSO / advanced auth hooks.
 */
export function hasSSOFeatures(planKey: PlanKey): boolean {
    return planAtLeast(planKey, 'inferno')
}

/**
 * Check whether a plan has unlimited storage and domains.
 * Ember and Enterprise both have no storage/domain caps.
 */
export function isUnlimitedPlan(planKey: PlanKey): boolean {
    return planKey === 'ember' || planKey === 'enterprise'
}
