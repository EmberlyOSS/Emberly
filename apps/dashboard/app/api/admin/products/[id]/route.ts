import { NextRequest, NextResponse } from 'next/server'

import { apiError, HTTP_STATUS } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import { loggers } from '@/lib/logger'

const logger = loggers.api.getChildLogger('admin-products-delete')

/**
 * DELETE /api/admin/products/[id]
 * 
 * Soft-delete a product (marks deletedAt timestamp)
 * Does not remove Stripe product - use Stripe dashboard for that
 * Requires admin authentication
 */
export async function DELETE(
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

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
        })

        if (!product) {
            return apiError('Product not found', HTTP_STATUS.NOT_FOUND)
        }

        // Soft delete by setting active to false
        const deleted = await prisma.product.update({
            where: { id: productId },
            data: {
                active: false,
            },
        })

        logger.info('Product deactivated', {
            productId: deleted.id,
            actorId: adminUser.id,
            productName: deleted.name,
        })

        return NextResponse.json({
            success: true,
            id: deleted.id,
            active: deleted.active,
        })
    } catch (error) {
        logger.error('Error deleting product', { error })
        return apiError('Failed to delete product', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
