import { createHash, randomBytes } from 'crypto'

import { NextResponse } from 'next/server'

import { apiError, HTTP_STATUS } from '@/packages/lib/api/response'
import { requireSuperAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.api.getChildLogger('system-key')

const CONFIG_KEY = 'system_api_key'

/**
 * GET /api/admin/system-key
 *
 * Returns metadata about the current system API key (prefix, createdAt).
 * Never returns the full key — it's only shown once on creation.
 */
export async function GET() {
    try {
        const { user, response } = await requireSuperAdmin()
        if (response) return response

        const row = await prisma.config.findUnique({ where: { key: CONFIG_KEY } })
        if (!row) {
            return NextResponse.json({ exists: false })
        }

        const data = row.value as { prefix?: string; createdAt?: string }
        return NextResponse.json({
            exists: true,
            prefix: data.prefix ?? null,
            createdAt: data.createdAt ?? null,
        })
    } catch (error) {
        logger.error('Error fetching system key metadata', { error })
        return apiError('Failed to fetch system key', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

/**
 * POST /api/admin/system-key
 *
 * Generates (or regenerates) the system API key.
 * Returns the full key ONCE — it is not stored, only its SHA-256 hash.
 */
export async function POST() {
    try {
        const { user, response } = await requireSuperAdmin()
        if (response) return response

        // Generate key: esk_ prefix + 48 random bytes as hex (100 chars)
        const raw = randomBytes(48).toString('hex')
        const fullKey = `esk_${raw}`
        const keyHash = createHash('sha256').update(fullKey).digest('hex')
        const prefix = fullKey.slice(0, 12) // "esk_xxxxxxxx"

        const value = {
            keyHash,
            prefix,
            createdAt: new Date().toISOString(),
        }

        await prisma.config.upsert({
            where: { key: CONFIG_KEY },
            update: { value: value as any },
            create: { key: CONFIG_KEY, value: value as any },
        })

        logger.info('System API key generated', {
            actorId: user.id,
            prefix,
        })

        return NextResponse.json({
            key: fullKey,
            prefix,
        })
    } catch (error) {
        logger.error('Error generating system key', { error })
        return apiError('Failed to generate system key', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

/**
 * DELETE /api/admin/system-key
 *
 * Revokes the current system API key.
 */
export async function DELETE() {
    try {
        const { user, response } = await requireSuperAdmin()
        if (response) return response

        await prisma.config.deleteMany({ where: { key: CONFIG_KEY } })

        logger.info('System API key revoked', { actorId: user.id })

        return NextResponse.json({ success: true })
    } catch (error) {
        logger.error('Error revoking system key', { error })
        return apiError('Failed to revoke system key', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
