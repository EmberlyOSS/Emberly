import { NextRequest, NextResponse } from 'next/server'

import { apiError, HTTP_STATUS } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { syncProductToStripe } from '@/packages/lib/stripe/sync'

const logger = loggers.api.getChildLogger('admin-products-sync')

/**
 * POST /api/admin/products/[id]/sync
 *
 * Syncs a single product to Stripe — creates the Stripe product if missing,
 * updates name/description/active, and creates any missing price objects.
 * Writes new Stripe IDs back to the DB.
 * Requires admin authentication.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user: adminUser, response } = await requireAdmin()
        if (response) return response

        const { id: productId } = await params

        if (!productId) {
            return apiError('Product ID is required', HTTP_STATUS.BAD_REQUEST)
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
        })

        if (!product) {
            return apiError('Product not found', HTTP_STATUS.NOT_FOUND)
        }

        const stripeIds = await syncProductToStripe({
            slug: product.slug ?? product.id,
            name: product.name,
            description: product.description,
            type: product.type ?? 'plan',
            defaultPriceCents: product.defaultPriceCents,
            billingInterval: product.billingInterval,
            active: product.active ?? true,
            stripeProductId: product.stripeProductId,
            stripePriceMonthlyId: product.stripePriceMonthlyId,
            stripePriceYearlyId: product.stripePriceYearlyId,
            stripePriceOneTimeId: product.stripePriceOneTimeId,
        })

        const hasNewIds =
            stripeIds.stripeProductId !== product.stripeProductId ||
            stripeIds.stripePriceMonthlyId !== product.stripePriceMonthlyId ||
            stripeIds.stripePriceYearlyId !== product.stripePriceYearlyId ||
            stripeIds.stripePriceOneTimeId !== product.stripePriceOneTimeId

        let updated = product
        if (hasNewIds) {
            updated = await prisma.product.update({
                where: { id: productId },
                data: stripeIds,
            })
        }

        logger.info('Product synced to Stripe', {
            productId: product.id,
            actorId: adminUser.id,
            hasNewIds,
        })

        return NextResponse.json({
            success: true,
            product: updated,
            synced: hasNewIds,
        })
    } catch (error) {
        logger.error('Error syncing product to Stripe', { error })
        return apiError('Failed to sync product to Stripe', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
