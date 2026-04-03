import { NextResponse } from 'next/server'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { planKeyForProduct, hasAdvancedAnalytics } from '@/packages/lib/plans'

export async function GET(req: Request) {
    try {
        const { user, response } = await requireAuth(req)
    if (response) return response

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const subscription = await prisma.subscription.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { product: true } })
        const plan = planKeyForProduct(subscription?.product ?? null)

        if (!hasAdvancedAnalytics(plan)) {
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
