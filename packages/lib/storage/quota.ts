/**
 * Storage quota and plan limits calculation utilities.
 * 
 * The quota system works as follows:
 * 1. User's plan determines base storage quota (Spark: 10GB, Glow: 25GB, etc.)
 * 2. Admins can override per-user quota via storageQuotaMB
 * 3. Users can purchase additional storage via OneOffPurchase records
 * 4. Perks add bonuses: Contributors get +1GB per 1000 LOC, Discord Boosters get +5GB
 * 5. Final quota = max(admin override, plan storage + perk bonuses + purchased storage)
 * 6. Plan also determines upload size cap and custom domain limit
 */

import { prisma } from '@/packages/lib/database/prisma'
import { calculateStorageBonusGB, calculateDomainSlotBonus } from '@/packages/lib/perks'
import { syncUserSubscriptionsFromStripe } from '@/packages/lib/stripe/billing'

// Per-user TTL cache: only attempt one Stripe sync per user per 5-minute window
const stripeSyncCache = new Map<string, number>()
const STRIPE_SYNC_TTL_MS = 5 * 60 * 1000

export interface QuotaInfo {
    quotaMB: number
    usedMB: number
    remainingMB: number
    purchasedMB: number
    baseQuotaMB: number
    percentageUsed: number
}

export interface PlanLimits {
    /** null = unlimited (Ember / Enterprise) */
    storageQuotaGB: number | null
    /** null = unlimited (Ember / Enterprise) */
    uploadSizeCapMB: number | null
    /** null = unlimited (Ember / Enterprise) */
    customDomainsLimit: number | null
    planName: string
}

/**
 * Get the user's current plan limits.
 * Returns plan limits or defaults if no active subscription.
 */
export async function getPlanLimits(userId: string): Promise<PlanLimits> {
    // Get user's active subscription with product details
    const subscription = await prisma.subscription.findFirst({
        where: {
            userId,
            status: 'active',
        },
        include: {
            product: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    if (subscription && subscription.product) {
        return {
            // null means unlimited — preserved as-is for Ember/Enterprise plans
            storageQuotaGB: subscription.product.storageQuotaGB ?? null,
            uploadSizeCapMB: subscription.product.uploadSizeCapMB ?? null,
            customDomainsLimit: subscription.product.customDomainsLimit ?? null,
            planName: subscription.product.name,
        }
    }

    // No active subscription in DB — attempt a one-time Stripe sync to self-heal
    // (covers cases where the webhook was missed or not yet configured)
    const now = Date.now()
    const lastSync = stripeSyncCache.get(userId) ?? 0
    if (now - lastSync > STRIPE_SYNC_TTL_MS) {
        stripeSyncCache.set(userId, now)
        try {
            const userRecord = await prisma.user.findUnique({
                where: { id: userId },
                select: { stripeCustomerId: true },
            })
            if (userRecord?.stripeCustomerId) {
                await syncUserSubscriptionsFromStripe(userId, userRecord.stripeCustomerId)
                // Re-check after sync
                const syncedSub = await prisma.subscription.findFirst({
                    where: { userId, status: 'active' },
                    include: { product: true },
                    orderBy: { createdAt: 'desc' },
                })
                if (syncedSub?.product) {
                    return {
                        storageQuotaGB: syncedSub.product.storageQuotaGB ?? null,
                        uploadSizeCapMB: syncedSub.product.uploadSizeCapMB ?? null,
                        customDomainsLimit: syncedSub.product.customDomainsLimit ?? null,
                        planName: syncedSub.product.name,
                    }
                }
            }
        } catch (err) {
            console.warn('[getPlanLimits] Stripe subscription sync failed:', err)
        }
    }

    // Default free plan (Spark)
    return {
        storageQuotaGB: 10,
        uploadSizeCapMB: 500,
        customDomainsLimit: 3,
        planName: 'Spark (Free)',
    }
}

/**
 * Get the user's custom domain count.
 */
export async function getUserDomainCount(userId: string): Promise<number> {
    const result = await prisma.customDomain.count({
        where: { userId },
    })
    return result
}

/**
 * Get the number of purchased domain slots for a user.
 * Counts legacy one-off purchases as well as active yearly subscriptions.
 */
export async function getPurchasedDomainSlots(userId: string): Promise<number> {
    const [oneOffResult, subscriptionCount] = await Promise.all([
        prisma.oneOffPurchase.aggregate({
            where: {
                userId,
                type: 'custom_domain',
            },
            _sum: {
                quantity: true,
            },
        }),
        prisma.subscription.count({
            where: {
                userId,
                status: { in: ['active', 'trialing'] },
                product: {
                    slug: { in: ['extra-domain-slot', 'extra-domain-slot-squad'] },
                },
            },
        }),
    ])
    return (oneOffResult._sum?.quantity || 0) + subscriptionCount
}

/**
 * Check if user can add more custom domains.
 * Takes perk bonuses and purchased slots into account.
 */
export async function canAddCustomDomain(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { perkRoles: true },
    })

    const limits = await getPlanLimits(userId)
    // null = unlimited plan
    if (limits.customDomainsLimit === null) return true
    const currentCount = await getUserDomainCount(userId)
    const domainBonus = calculateDomainSlotBonus(user?.perkRoles || [])
    const purchasedSlots = await getPurchasedDomainSlots(userId)
    const totalLimit = limits.customDomainsLimit + domainBonus + purchasedSlots
    
    return currentCount < totalLimit
}

/**
 * Calculate total purchased storage for a user.
 * Sums up all extra_storage one-off purchases.
 */
export async function getPurchasedStorageMB(userId: string): Promise<number> {
    const result = await prisma.oneOffPurchase.aggregate({
        where: {
            userId,
            type: 'extra_storage',
        },
        _sum: {
            quantity: true,
        },
    })

    // quantity is in GB; convert to MB
    const quantityGB = result._sum?.quantity || 0
    return quantityGB * 1024
}

/**
 * Calculate effective quota for a user.
 * Takes into account:
 * - Admin-set per-user quota override
 * - Plan-based storage quota
 * - Purchased additional storage
 */
export async function getEffectiveQuotaMB(userId: string, defaultQuotaMB?: number): Promise<QuotaInfo> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            storageUsed: true,
            storageQuotaMB: true,
            perkRoles: true,
        },
    })

    if (!user) {
        throw new Error(`User ${userId} not found`)
    }

    const planLimits = await getPlanLimits(userId)
    const purchasedMB = await getPurchasedStorageMB(userId)
    
    // Calculate perk bonuses
    const perkStorageBonusGB = calculateStorageBonusGB(user.perkRoles || [])
    const perkStorageBonusMB = perkStorageBonusGB * 1024
    
    // Priority: admin override > plan quota + perks > default quota
    let baseQuotaMB = user.storageQuotaMB
    if (!baseQuotaMB) {
        if (planLimits.storageQuotaGB === null) {
            // Unlimited plan — use a 100 TB sentinel so arithmetic still works
            baseQuotaMB = 100 * 1024 * 1024
        } else {
            baseQuotaMB = (planLimits.storageQuotaGB + perkStorageBonusGB) * 1024
        }
    }
    if (!baseQuotaMB && defaultQuotaMB) {
        baseQuotaMB = defaultQuotaMB
    }
    
    const quotaMB = baseQuotaMB + purchasedMB
    const usedMB = user.storageUsed
    const remainingMB = Math.max(0, quotaMB - usedMB)
    const percentageUsed = quotaMB > 0 ? (usedMB / quotaMB) * 100 : 0

    return {
        quotaMB,
        usedMB,
        remainingMB,
        purchasedMB,
        baseQuotaMB,
        percentageUsed,
    }
}

/**
 * Check if a user can upload a file of a given size.
 * Validates against both storage quota AND upload size cap.
 */
export async function canUploadSize(
    userId: string,
    fileSizeMB: number,
    defaultQuotaMB?: number
): Promise<{ allowed: boolean; reason?: string }> {
    const planLimits = await getPlanLimits(userId)
    
    // Check upload size cap (null = unlimited)
    if (planLimits.uploadSizeCapMB !== null && fileSizeMB > planLimits.uploadSizeCapMB) {
        return {
            allowed: false,
            reason: `File exceeds ${planLimits.planName} plan limit of ${planLimits.uploadSizeCapMB}MB. Upgrade your plan or purchase larger file size add-on.`,
        }
    }
    
    // Check storage quota
    const quota = await getEffectiveQuotaMB(userId, defaultQuotaMB)
    const canFit = quota.usedMB + fileSizeMB <= quota.quotaMB
    
    if (!canFit) {
        return {
            allowed: false,
            reason: `Uploading this file would exceed your storage quota. You have ${quota.remainingMB.toFixed(0)}MB remaining.`,
        }
    }
    
    return { allowed: true }
}

/**
 * Get a user-friendly quota message explaining current usage.
 */
export function formatQuotaMessage(quota: QuotaInfo): string {
    const formatMB = (mb: number): string => {
        if (mb >= 1024) {
            return `${(mb / 1024).toFixed(2)} GB`
        }
        return `${mb.toFixed(0)} MB`
    }

    const usedStr = formatMB(quota.usedMB)
    const totalStr = formatMB(quota.quotaMB)
    const remainingStr = formatMB(quota.remainingMB)

    let message = `You are using ${usedStr} of ${totalStr} (${quota.percentageUsed.toFixed(1)}%)`

    if (quota.percentageUsed > 90) {
        message += '. ⚠️ Storage is critically low!'
    } else if (quota.percentageUsed > 75) {
        message += '. Storage is getting low.'
    }

    if (quota.purchasedMB > 0) {
        message += ` (${formatMB(quota.purchasedMB)} purchased)`
    }

    return message
}
