/**
 * Storage quota calculation and management utilities.
 * 
 * The quota system works as follows:
 * 1. System has a default quota from config (system-wide setting)
 * 2. Admins can override per-user quota via storageQuotaMB
 * 3. Users can purchase additional storage via OneOffPurchase records
 * 4. Final quota = max(admin override, system default + purchased) 
 */

import { prisma } from '@/packages/lib/database/prisma'

export interface QuotaInfo {
    quotaMB: number
    usedMB: number
    remainingMB: number
    purchasedMB: number
    baseQuotaMB: number
    percentageUsed: number
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
 * Returns the maximum of:
 * - Admin-set per-user quota (if set)
 * - System default quota + purchased storage
 */
export async function getEffectiveQuotaMB(userId: string, defaultQuotaMB: number): Promise<QuotaInfo> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            storageUsed: true,
            storageQuotaMB: true,
        },
    })

    if (!user) {
        throw new Error(`User ${userId} not found`)
    }

    const purchasedMB = await getPurchasedStorageMB(userId)
    const baseQuotaMB = user.storageQuotaMB ?? defaultQuotaMB
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
 * Returns true if the file would fit within their quota.
 */
export async function canUploadSize(
    userId: string,
    fileSizeMB: number,
    defaultQuotaMB: number
): Promise<boolean> {
    const quota = await getEffectiveQuotaMB(userId, defaultQuotaMB)
    return quota.usedMB + fileSizeMB <= quota.quotaMB
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
