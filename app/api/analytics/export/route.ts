import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'

type PlanKey = 'free' | 'glow' | 'flare' | 'blaze' | 'enterprise'

function planKeyForProduct(product: { id?: string | null; slug?: string | null; stripeProductId?: string | null } | null): PlanKey {
    if (!product) return 'free'
    const p = (product.slug || product.stripeProductId || '').toLowerCase()
    if (p.includes('flare') || p.includes('pro')) return 'flare'
    if (p.includes('blaze') || p.includes('team') || p.includes('scale')) return 'blaze'
    if (p.includes('enterprise') || p.includes('inferno')) return 'enterprise'
    if (p.includes('glow') || p.includes('starter')) return 'glow'
    if (p.includes('free') || p.includes('spark')) return 'free'
    return 'glow'
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const subscription = await prisma.subscription.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { product: true } })
        const plan = planKeyForProduct(subscription?.product ?? null)

        if (!['flare', 'blaze', 'enterprise'].includes(plan)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const files = await prisma.file.findMany({ where: { userId: user.id }, orderBy: { uploadedAt: 'desc' } })

        const csvRows = [
            ['id', 'name', 'size', 'uploadedAt', 'views', 'downloads'].join(','),
            ...files.map((f) => [f.id, `"${(f.name || '').replace(/"/g, '""')}"`, String(f.size || ''), f.uploadedAt.toISOString(), String(f.views || 0), String(f.downloads || 0)].join(',')),
        ]

        const csv = csvRows.join('\n')

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="emberly-analytics-files-${user.id}.csv"`,
            },
        })
    } catch (err) {
        console.error('analytics export error', err)
        return NextResponse.json({ error: 'Internal' }, { status: 500 })
    }
}
