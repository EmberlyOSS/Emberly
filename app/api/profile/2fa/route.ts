import { NextResponse } from 'next/server'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { compare } from 'bcryptjs'
import { prisma } from '@/packages/lib/database/prisma'
import { apiError, apiResponse } from '@/packages/lib/api/response'

export async function GET(req: Request) {
    // generate a temporary secret and return otpauth and QR data URL
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response

        const secret = authenticator.generateSecret()
        const label = encodeURIComponent(user.id || 'emberly')
        const service = encodeURIComponent('Emberly')
        const otpauth = authenticator.keyuri(user.id, service, secret)

        const qrDataUrl = await QRCode.toDataURL(otpauth)

        return apiResponse({ secret, otpauth, qrDataUrl })
    } catch (error) {
        console.error('2FA GET error', error)
        return apiError('Internal server error')
    }
}

export async function POST(req: Request) {
    // enable 2FA: expects { token: string, secret: string }
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response

        const json = await req.json()
        const token = json.token as string | undefined
        const secret = json.secret as string | undefined

        if (!token || !secret) {
            return apiError('Missing token or secret', 400)
        }

        const isValid = authenticator.check(token, secret)
        if (!isValid) {
            return apiError('Invalid token', 400)
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorEnabled: true, twoFactorSecret: secret },
        })

        return apiResponse({ success: true })
    } catch (error) {
        console.error('2FA POST error', error)
        return apiError('Internal server error')
    }
}

export async function DELETE(req: Request) {
    // disable 2FA: expects { token: string }
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response
        const body = await req.json()
        const token = body.token as string | undefined
        const password = body.password as string | undefined

        // require password for disabling 2FA
        if (!password) return apiError('Password is required to disable 2FA', 400)

        const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { twoFactorSecret: true, password: true } })
        if (!dbUser?.twoFactorSecret) {
            return apiError('2FA not enabled', 400)
        }

        if (!token) return apiError('Missing token', 400)

        // verify password
        if (!dbUser?.password) return apiError('Invalid credentials', 400)
        const isPasswordValid = await compare(password, dbUser.password)
        if (!isPasswordValid) return apiError('Invalid credentials', 400)

        const isValid = authenticator.check(token, dbUser.twoFactorSecret)
        if (!isValid) return apiError('Invalid token', 400)

        await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } })

        return apiResponse({ success: true })
    } catch (error) {
        console.error('2FA DELETE error', error)
        return apiError('Internal server error')
    }
}
