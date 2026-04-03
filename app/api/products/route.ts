import { NextResponse } from 'next/server'

import { prisma } from '@/packages/lib/database/prisma'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { syncProductToStripe } from '@/packages/lib/stripe/sync'

export async function GET() {
    const { response } = await requireAdmin()
    if (response) return response

    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(products)
}

export async function POST(req: Request) {
    const { response } = await requireAdmin()
    if (response) return response

    const body = await req.json().catch(() => ({}))
    const {
        name,
        slug,
        description,
        type,
        stripeProductId,
        stripePriceMonthlyId,
        stripePriceYearlyId,
        stripePriceOneTimeId,
        defaultPriceCents,
        billingInterval,
        features,
        active = true,
        popular = false,
        storageQuotaGB,
        uploadSizeCapMB,
        customDomainsLimit,
    } = body || {}

    if (!name || !slug) {
        return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
    }

    try {
        const product = await prisma.product.create({
            data: {
                name: String(name),
                slug: String(slug).toLowerCase(),
                description: description ? String(description) : null,
                type: type ? String(type) : 'plan',
                stripeProductId: stripeProductId ? String(stripeProductId) : null,
                stripePriceMonthlyId: stripePriceMonthlyId ? String(stripePriceMonthlyId) : null,
                stripePriceYearlyId: stripePriceYearlyId ? String(stripePriceYearlyId) : null,
                stripePriceOneTimeId: stripePriceOneTimeId ? String(stripePriceOneTimeId) : null,
                defaultPriceCents: defaultPriceCents != null ? Number(defaultPriceCents) : null,
                billingInterval: billingInterval ? String(billingInterval) : null,
                features: Array.isArray(features) ? features.map(String) : [],
                active: Boolean(active),
                popular: Boolean(popular),
                storageQuotaGB: storageQuotaGB != null ? Number(storageQuotaGB) : null,
                uploadSizeCapMB: uploadSizeCapMB != null ? Number(uploadSizeCapMB) : null,
                customDomainsLimit: customDomainsLimit != null ? Number(customDomainsLimit) : null,
            },
        })

        // Sync to Stripe and write back any newly-created IDs
        const stripeIds = await syncProductToStripe(product)
        const hasNewIds =
            stripeIds.stripeProductId !== product.stripeProductId ||
            stripeIds.stripePriceMonthlyId !== product.stripePriceMonthlyId ||
            stripeIds.stripePriceYearlyId !== product.stripePriceYearlyId ||
            stripeIds.stripePriceOneTimeId !== product.stripePriceOneTimeId

        const final = hasNewIds
            ? await prisma.product.update({ where: { id: product.id }, data: stripeIds })
            : product

        return NextResponse.json(final, { status: 201 })
    } catch (err: any) {
        console.error('product create failed', err)
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
}