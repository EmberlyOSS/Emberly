import { NextResponse } from 'next/server'
import { authenticator } from 'otplib'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { compare } from 'bcryptjs'
import { prisma } from '@/packages/lib/database/prisma'
import { apiError, apiResponse } from '@/packages/lib/api/response'
import { events } from '@/packages/lib/events'
import { sendTemplateEmail, VerificationCodeEmail } from '@/packages/lib/emails'
import { createRecoveryCodes, invalidateRecoveryCodes } from '@/packages/lib/auth/recovery-codes'

interface StoredVerificationCode {
    code: string
    context: '2fa-enable' | '2fa-disable'
    secret?: string // Temp secret for 2FA enable
    expiresAt: number // timestamp
}

function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

function parseVerificationCodes(codes: string[]): StoredVerificationCode[] {
    return codes
        .map((code) => {
            try {
                return JSON.parse(code) as StoredVerificationCode
            } catch {
                return null
            }
        })
        .filter((code): code is StoredVerificationCode => code !== null)
}

function isCodeExpired(expiresAt: number): boolean {
    return expiresAt < Date.now()
}

export async function GET(req: Request) {
    // generate a temporary secret and return otpauth URI
    // QR code is rendered client-side using QRCodeSVG from qrcode.react
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response

        const secret = authenticator.generateSecret()
        const service = encodeURIComponent('Emberly')
        const otpauth = authenticator.keyuri(user.email || user.id, service, secret)

        return apiResponse({ secret, otpauth })
    } catch (error) {
        console.error('2FA GET error', error)
        return apiError('Internal server error')
    }
}

export async function POST(req: Request) {
    // enable 2FA: expects { token: string (TOTP), secret: string, stage: 'send-code' | 'verify-code' }
    // stage 'send-code': Validates TOTP token and secret, sends verification code to email
    // stage 'verify-code': Validates verification code from email and enables 2FA
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response

        const json = await req.json()
        const token = json.token as string | undefined
        const secret = json.secret as string | undefined
        const stage = (json.stage || 'verify-code') as string
        const verificationCode = json.verificationCode as string | undefined

        if (stage === 'send-code') {
            // Validate TOTP secret first
            if (!token || !secret) {
                return apiError('Missing token or secret', 400)
            }

            const isValid = authenticator.check(token, secret)
            if (!isValid) {
                return apiError('Invalid TOTP token', 400)
            }

            // Generate and store verification code
            const code = generateVerificationCode()
            const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

            const codeData: StoredVerificationCode = {
                code,
                context: '2fa-enable',
                secret, // Store temp secret
                expiresAt,
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    verificationCodes: {
                        push: JSON.stringify(codeData),
                    },
                },
            })

            // Send email with verification code
            try {
                await sendTemplateEmail({
                    to: user.email,
                    subject: 'Enable Two-Factor Authentication',
                    template: VerificationCodeEmail,
                    props: {
                        code,
                        expiresInMinutes: 10,
                    },
                })
            } catch (emailError) {
                console.error('Failed to send 2FA verification email', emailError)
                return apiError('Failed to send verification code', 500)
            }

            return apiResponse({ success: true, message: 'Verification code sent to email' })
        } else if (stage === 'verify-code') {
            // Verify the code from email
            if (!verificationCode) {
                return apiError('Missing verification code', 400)
            }

            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { verificationCodes: true },
            })

            if (!dbUser?.verificationCodes) {
                return apiError('No verification codes found', 400)
            }

            const codes = parseVerificationCodes(dbUser.verificationCodes)
            const validCode = codes.find(
                (c) =>
                    c.context === '2fa-enable' &&
                    c.code === verificationCode &&
                    !isCodeExpired(c.expiresAt)
            )

            if (!validCode) {
                return apiError('Invalid or expired verification code', 400)
            }

            // Enable 2FA with the stored secret
            if (!validCode.secret) {
                return apiError('Missing 2FA secret', 400)
            }

            // Remove used code
            const updatedCodes = dbUser.verificationCodes.filter((c) => c !== JSON.stringify(validCode))

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    twoFactorEnabled: true,
                    twoFactorSecret: validCode.secret,
                    verificationCodes: updatedCodes,
                },
            })

            // Generate recovery codes
            const recoveryCodes = await createRecoveryCodes(user.id)

            // Emit auditable events (fire-and-forget)
            void events.emit('auth.2fa-enabled', {
                userId: user.id,
                email: user.email,
                method: 'totp',
            }).catch((err) => console.error('[Events] Failed to emit auth.2fa-enabled', err))
            void events.emit('auth.2fa-backup-codes-generated', {
                userId: user.id,
                email: user.email,
                codesCount: recoveryCodes.length,
            }).catch((err) => console.error('[Events] Failed to emit auth.2fa-backup-codes-generated', err))

            return apiResponse({ 
                success: true, 
                message: '2FA enabled successfully',
                recoveryCodes, // Return codes to user
            })
        } else {
            return apiError('Invalid stage parameter', 400)
        }
    } catch (error) {
        console.error('2FA POST error', error)
        return apiError('Internal server error')
    }
}

export async function DELETE(req: Request) {
    // disable 2FA: two stages
    // stage 'send-code': Validates password and sends verification code to email
    // stage 'verify-code': Validates verification code and disables 2FA
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response

        const body = await req.json()
        const password = body.password as string | undefined
        const stage = (body.stage || 'verify-code') as string
        const verificationCode = body.verificationCode as string | undefined
        const totpToken = body.totpToken as string | undefined

        if (stage === 'send-code') {
            // Require password to initiate 2FA disable
            if (!password) return apiError('Password is required', 400)

            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { twoFactorEnabled: true, password: true },
            })

            if (!dbUser?.twoFactorEnabled) {
                return apiError('2FA not enabled', 400)
            }

            // Verify password
            if (!dbUser?.password) return apiError('Invalid credentials', 400)
            const isPasswordValid = await compare(password, dbUser.password)
            if (!isPasswordValid) return apiError('Invalid credentials', 400)

            // Generate and store verification code
            const code = generateVerificationCode()
            const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

            const codeData: StoredVerificationCode = {
                code,
                context: '2fa-disable',
                expiresAt,
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    verificationCodes: {
                        push: JSON.stringify(codeData),
                    },
                },
            })

            // Send email with verification code
            try {
                await sendTemplateEmail({
                    to: user.email,
                    subject: 'Disable Two-Factor Authentication',
                    template: VerificationCodeEmail,
                    props: {
                        code,
                        expiresInMinutes: 10,
                    },
                })
            } catch (emailError) {
                console.error('Failed to send 2FA disable verification email', emailError)
                return apiError('Failed to send verification code', 500)
            }

            return apiResponse({ success: true, message: 'Verification code sent to email' })
        } else if (stage === 'verify-code') {
            // Verify the code and TOTP token before disabling
            if (!verificationCode) {
                return apiError('Missing verification code', 400)
            }

            if (!totpToken) {
                return apiError('Missing TOTP token', 400)
            }

            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: {
                    twoFactorEnabled: true,
                    twoFactorSecret: true,
                    verificationCodes: true,
                },
            })

            if (!dbUser?.twoFactorEnabled || !dbUser?.twoFactorSecret) {
                return apiError('2FA not enabled', 400)
            }

            const codes = parseVerificationCodes(dbUser.verificationCodes)
            const validCode = codes.find(
                (c) =>
                    c.context === '2fa-disable' &&
                    c.code === verificationCode &&
                    !isCodeExpired(c.expiresAt)
            )

            if (!validCode) {
                return apiError('Invalid or expired verification code', 400)
            }

            // Verify TOTP token
            const isTotpValid = authenticator.check(totpToken, dbUser.twoFactorSecret)
            if (!isTotpValid) {
                return apiError('Invalid TOTP token', 400)
            }

            // Remove used code and disable 2FA
            const updatedCodes = dbUser.verificationCodes.filter((c) => c !== JSON.stringify(validCode))

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                    verificationCodes: updatedCodes,
                },
            })

            // Invalidate all recovery codes
            await invalidateRecoveryCodes(user.id)

            // Emit auditable event (fire-and-forget)
            void events.emit('auth.2fa-disabled', {
                userId: user.id,
                email: user.email,
                method: 'totp',
                disabledBy: 'user',
            }).catch((err) => console.error('[Events] Failed to emit auth.2fa-disabled', err))

            return apiResponse({ success: true, message: '2FA disabled successfully' })
        } else {
            return apiError('Invalid stage parameter', 400)
        }
    } catch (error) {
        console.error('2FA DELETE error', error)
        return apiError('Internal server error')
    }
}
