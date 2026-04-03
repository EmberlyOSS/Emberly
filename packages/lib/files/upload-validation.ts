/**
 * Upload validation utilities.
 *
 * Provides checks for:
 * - Email verification status
 * - Custom domain verification
 * - Other pre-upload requirements
 */

import { prisma } from '@/packages/lib/database/prisma'
import { hasPermission, Permission } from '@/packages/lib/permissions'

export interface UploadValidationResult {
    valid: boolean
    error?: string
    errorCode?: 'EMAIL_NOT_VERIFIED' | 'DOMAIN_NOT_VERIFIED' | 'DOMAIN_NOT_FOUND'
}

/**
 * Check if a user has verified their email address.
 * Email verification is ALWAYS required before uploading.
 * Returns validation result with appropriate error if not verified.
 */
export async function validateEmailVerified(userId: string): Promise<UploadValidationResult> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true, role: true },
    })

    if (!user) {
        return { valid: false, error: 'User not found', errorCode: 'EMAIL_NOT_VERIFIED' }
    }

    // Admins and higher roles bypass email verification requirement
    if (hasPermission(user.role as any, Permission.MANAGE_FILES)) {
        return { valid: true }
    }

    if (!user.emailVerified) {
        return {
            valid: false,
            error: 'Please verify your email address before uploading files',
            errorCode: 'EMAIL_NOT_VERIFIED',
        }
    }

    return { valid: true }
}

/**
 * Check if a custom domain is verified for the user.
 * Only checks if a custom domain is being used.
 * Returns validation result with appropriate error if domain is not verified.
 */
export async function validateCustomDomain(
    userId: string,
    requestedDomain: string | null
): Promise<UploadValidationResult> {
    // No custom domain specified, no validation needed
    if (!requestedDomain) {
        return { valid: true }
    }

    // Clean domain (remove protocol/trailing slash)
    const cleanDomain = requestedDomain
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
        .toLowerCase()

    // Check if domain is the main app domain - no validation needed
    const appDomain = (process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || '')
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
        .toLowerCase()

    if (cleanDomain === appDomain || cleanDomain === 'localhost' || cleanDomain.startsWith('localhost:')) {
        return { valid: true }
    }

    // Check if this is a verified custom domain owned by the user OR one of their squads
    const domainRecord = await prisma.customDomain.findFirst({
        where: {
            domain: cleanDomain,
            OR: [
                { userId },
                {
                    squad: {
                        members: { some: { userId } },
                    },
                },
            ],
        },
        select: {
            verified: true,
            domain: true,
        },
    })

    if (!domainRecord) {
        return {
            valid: false,
            error: `Domain "${cleanDomain}" is not registered to your account`,
            errorCode: 'DOMAIN_NOT_FOUND',
        }
    }

    if (!domainRecord.verified) {
        return {
            valid: false,
            error: `Domain "${cleanDomain}" has not been verified yet. Please complete domain verification first.`,
            errorCode: 'DOMAIN_NOT_VERIFIED',
        }
    }

    return { valid: true }
}

/**
 * Validate a custom domain for a squad upload (authenticated via squad token/API key).
 * The domain must belong to the squad itself.
 */
export async function validateSquadCustomDomain(
    squadId: string,
    requestedDomain: string | null
): Promise<UploadValidationResult> {
    if (!requestedDomain) return { valid: true }

    const cleanDomain = requestedDomain
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
        .toLowerCase()

    const appDomain = (process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || '')
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
        .toLowerCase()

    if (cleanDomain === appDomain || cleanDomain === 'localhost' || cleanDomain.startsWith('localhost:')) {
        return { valid: true }
    }

    const domainRecord = await prisma.customDomain.findFirst({
        where: { domain: cleanDomain, squadId },
        select: { verified: true, domain: true },
    })

    if (!domainRecord) {
        return {
            valid: false,
            error: `Domain "${cleanDomain}" is not registered to this squad`,
            errorCode: 'DOMAIN_NOT_FOUND',
        }
    }

    if (!domainRecord.verified) {
        return {
            valid: false,
            error: `Domain "${cleanDomain}" has not been verified yet`,
            errorCode: 'DOMAIN_NOT_VERIFIED',
        }
    }

    return { valid: true }
}

/**
 * Run all upload validations.
 * Returns the first validation error encountered, or valid: true if all pass.
 */
export async function validateUploadRequest(
    userId: string,
    requestedDomain: string | null
): Promise<UploadValidationResult> {
    // Check email verification
    const emailResult = await validateEmailVerified(userId)
    if (!emailResult.valid) {
        return emailResult
    }

    // Check custom domain verification
    const domainResult = await validateCustomDomain(userId, requestedDomain)
    if (!domainResult.valid) {
        return domainResult
    }

    return { valid: true }
}
