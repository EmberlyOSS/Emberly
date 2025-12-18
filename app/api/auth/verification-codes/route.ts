import { NextResponse } from 'next/server'

import { z } from 'zod'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'

const codeSchema = z.object({ code: z.string().min(1).max(128) })

export async function GET(req: Request) {
    const { user, response } = await requireAuth(req)
    if (!user) return response

    const record = await prisma.user.findUnique({
        where: { id: user.id },
        select: { verificationCodes: true },
    })

    return NextResponse.json({ codes: record?.verificationCodes ?? [] })
}

export async function POST(req: Request) {
    const { user, response } = await requireAuth(req)
    if (!user) return response

    const body = await req.json().catch(() => null)
    const parsed = codeSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const code = parsed.data.code

    await prisma.user.update({
        where: { id: user.id },
        data: {
            verificationCodes: {
                push: code,
            },
        },
    })

    return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
    const { user, response } = await requireAuth(req)
    if (!user) return response

    const body = await req.json().catch(() => null)
    const parsed = codeSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const code = parsed.data.code

    const current = await prisma.user.findUnique({
        where: { id: user.id },
        select: { verificationCodes: true },
    })

    const filtered = (current?.verificationCodes ?? []).filter((c) => c !== code)

    await prisma.user.update({
        where: { id: user.id },
        data: { verificationCodes: filtered },
    })

    return NextResponse.json({ ok: true })
}
