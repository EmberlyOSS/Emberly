import { NextResponse } from 'next/server'

import { prisma } from '@/packages/lib/database/prisma'
import { requireAdmin } from '@/packages/lib/auth/api-auth'

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { response } = await requireAdmin()
    if (response) return response

    const { id } = await params
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(product)
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { response } = await requireAdmin()
    if (response) return response

    const { id: paramId } = await params
    const body = await req.json().catch(() => ({}))
    const {
        name,
        slug,
        description,
        stripeProductId,
        stripePriceMonthlyId,
        stripePriceYearlyId,
        stripePriceOneTimeId,
        defaultPriceCents,
        billingInterval,
        features,
        type,
        active,
        popular,
        id: bodyId,
    } = body || {}

    try {
        const identifiers = [paramId, bodyId, slug ? String(slug).toLowerCase() : null].filter(Boolean) as string[]

        const existing = identifiers.length
            ? await prisma.product.findFirst({ where: { OR: identifiers.map((val) => ({ OR: [{ id: val }, { slug: val }] })) } })
            : null

        if (!existing) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        const updated = await prisma.product.update({
            where: { id: existing.id },
            data: {
                name: name !== undefined ? String(name) : undefined,
                slug: slug !== undefined ? String(slug).toLowerCase() : undefined,
                description: description !== undefined ? (description ? String(description) : null) : undefined,
                stripeProductId: stripeProductId !== undefined ? (stripeProductId ? String(stripeProductId) : null) : undefined,
                stripePriceMonthlyId: stripePriceMonthlyId !== undefined ? (stripePriceMonthlyId ? String(stripePriceMonthlyId) : null) : undefined,
                stripePriceYearlyId: stripePriceYearlyId !== undefined ? (stripePriceYearlyId ? String(stripePriceYearlyId) : null) : undefined,
                stripePriceOneTimeId: stripePriceOneTimeId !== undefined ? (stripePriceOneTimeId ? String(stripePriceOneTimeId) : null) : undefined,
                defaultPriceCents: defaultPriceCents !== undefined ? (defaultPriceCents != null ? Number(defaultPriceCents) : null) : undefined,
                billingInterval: billingInterval !== undefined ? (billingInterval ? String(billingInterval) : null) : undefined,
                features: features !== undefined ? (Array.isArray(features) ? features.map(String) : []) : undefined,
                type: type !== undefined ? String(type) : undefined,
                active: active !== undefined ? Boolean(active) : undefined,
                popular: popular !== undefined ? Boolean(popular) : undefined,
            },
        })
        return NextResponse.json(updated)
    } catch (err: any) {
        console.error('product update failed', err)
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
}

export async function DELETE(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { response } = await requireAdmin()
    if (response) return response

    try {
        const { id } = await params
        await prisma.product.delete({ where: { id } })
        return NextResponse.json({ ok: true })
    } catch (err: any) {
        console.error('product delete failed', err)
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
}