import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'

function planKeyForProduct(product: { id?: string | null; slug?: string | null; stripeProductId?: string | null } | null) {
    if (!product) return 'free'
    const p = (product.slug || product.stripeProductId || '').toLowerCase()
    if (p.includes('pro')) return 'pro'
    if (p.includes('starter')) return 'starter'
    if (p.includes('free')) return 'free'
    return 'starter'
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const subscription = await prisma.subscription.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { product: true } })
        const plan = planKeyForProduct(subscription?.product ?? null)

        if (plan !== 'pro') {
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
