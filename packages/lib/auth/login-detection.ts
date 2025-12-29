/**
 * Login detection utilities.
 *
 * Provides smart detection of new or suspicious logins based on:
 * - IP address history
 * - User agent / device fingerprint
 * - Geographic location (if available)
 */

import { prisma } from '@/packages/lib/database/prisma'
import { createHash } from 'crypto'

export interface LoginContext {
    ip?: string | null
    userAgent?: string | null
    geo?: {
        country?: string | null
        city?: string | null
    } | null
}

export interface LoginDetectionResult {
    isNewDevice: boolean
    isNewIp: boolean
    isNewLocation: boolean
    shouldAlert: boolean
    reason?: string
}

/**
 * Create a device fingerprint from user agent.
 * This normalizes the user agent to group similar devices together
 * while still detecting meaningful changes.
 */
export function createDeviceFingerprint(userAgent: string | null | undefined): string | null {
    if (!userAgent) return null

    // Extract key components from user agent for fingerprinting
    // This is intentionally coarse to avoid false positives from minor version changes
    const normalized = userAgent
        .toLowerCase()
        // Extract OS
        .replace(/windows nt [\d.]+/g, 'windows')
        .replace(/mac os x [\d_]+/g, 'macos')
        .replace(/android [\d.]+/g, 'android')
        .replace(/iphone os [\d_]+/g, 'ios')
        .replace(/linux/g, 'linux')
        // Extract browser
        .replace(/chrome\/[\d.]+/g, 'chrome')
        .replace(/firefox\/[\d.]+/g, 'firefox')
        .replace(/safari\/[\d.]+/g, 'safari')
        .replace(/edg\/[\d.]+/g, 'edge')
        // Remove version numbers
        .replace(/[\d.]+/g, '')
        // Simplify
        .replace(/\s+/g, ' ')
        .trim()

    // Create a hash of the normalized fingerprint
    return createHash('sha256').update(normalized).digest('hex').slice(0, 16)
}

/**
 * Check if this login appears to be from a new or suspicious device.
 * This examines the user's login history to determine if an alert should be sent.
 */
export async function detectNewLogin(
    userId: string,
    context: LoginContext
): Promise<LoginDetectionResult> {
    const { ip, userAgent, geo } = context
    const fingerprint = createDeviceFingerprint(userAgent)

    // Get recent login history (last 30 days, max 100 entries)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentLogins = await prisma.loginHistory.findMany({
        where: {
            userId,
            success: true,
            createdAt: { gte: thirtyDaysAgo },
        },
        select: {
            ip: true,
            fingerprint: true,
            country: true,
            city: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
    })

    // If this is the user's first login, don't alert
    if (recentLogins.length === 0) {
        return {
            isNewDevice: true,
            isNewIp: true,
            isNewLocation: true,
            shouldAlert: false, // First login, don't alert
            reason: 'First login for this account',
        }
    }

    // Check if we've seen this device fingerprint before
    const knownFingerprints = new Set(recentLogins.map(l => l.fingerprint).filter(Boolean))
    const isNewDevice = fingerprint ? !knownFingerprints.has(fingerprint) : false

    // Check if we've seen this IP before
    const knownIps = new Set(recentLogins.map(l => l.ip).filter(Boolean))
    const isNewIp = ip ? !knownIps.has(ip) : false

    // Check if we've seen this location before
    const knownLocations = new Set(
        recentLogins
            .filter(l => l.country || l.city)
            .map(l => `${l.country || ''}|${l.city || ''}`)
    )
    const currentLocation = geo ? `${geo.country || ''}|${geo.city || ''}` : null
    const isNewLocation = currentLocation ? !knownLocations.has(currentLocation) : false

    // Determine if we should send an alert
    // Alert if: new device AND new IP (to reduce noise from IP changes on known devices)
    const shouldAlert = isNewDevice && isNewIp

    let reason: string | undefined
    if (shouldAlert) {
        const reasons: string[] = []
        if (isNewDevice) reasons.push('new device')
        if (isNewIp) reasons.push('new IP address')
        if (isNewLocation && geo?.country) reasons.push(`new location (${geo.city ? `${geo.city}, ` : ''}${geo.country})`)
        reason = `Login from ${reasons.join(', ')}`
    }

    return {
        isNewDevice,
        isNewIp,
        isNewLocation,
        shouldAlert,
        reason,
    }
}

/**
 * Record a login attempt in the history.
 * This should be called after successful authentication.
 */
export async function recordLogin(
    userId: string,
    context: LoginContext,
    success: boolean = true
): Promise<void> {
    const fingerprint = createDeviceFingerprint(context.userAgent)

    await prisma.loginHistory.create({
        data: {
            userId,
            ip: context.ip || null,
            userAgent: context.userAgent || null,
            fingerprint,
            country: context.geo?.country || null,
            city: context.geo?.city || null,
            success,
        },
    })

    // Cleanup old entries (keep last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    await prisma.loginHistory.deleteMany({
        where: {
            userId,
            createdAt: { lt: ninetyDaysAgo },
        },
    }).catch(() => {
        // Ignore cleanup errors
    })
}

/**
 * Get login history summary for a user.
 * Useful for showing in security settings.
 */
export async function getLoginHistorySummary(userId: string, limit: number = 10) {
    return prisma.loginHistory.findMany({
        where: {
            userId,
            success: true,
        },
        select: {
            ip: true,
            userAgent: true,
            country: true,
            city: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    })
}
