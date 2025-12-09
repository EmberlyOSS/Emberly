import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'
import { loggers } from '@/lib/logger'
import { getCustomHostname, createCustomHostname, listCustomHostnames, listDnsRecords } from '@/lib/cloudflare/client'

const logger = loggers.domains || loggers.app

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const { id } = await params
        const domain = await prisma.customDomain.findUnique({ where: { id } })
        if (!domain || domain.userId !== session.user.id)
            return new NextResponse('Not found', { status: 404 })

        // If a CF hostname already exists, fetch latest status
        if (domain.cfHostnameId) {
            try {
                const cf = await getCustomHostname(domain.cfHostnameId)
                const state = cf?.status || cf?.state || cf?.validation?.state || ''
                const data: any = { cfStatus: state, cfMeta: cf }
                if (typeof state === 'string' && state.toLowerCase().includes('active')) {
                    data.verified = true
                    data.cfBackoffCount = 0
                    data.cfPauseUntil = null
                }
                // reset backoff on successful status update
                if (!data.verified) {
                    data.cfBackoffCount = 0
                    data.cfPauseUntil = null
                }
                await prisma.customDomain.update({ where: { id }, data })
                return NextResponse.json({ cf, status: state })
            } catch (err: any) {
                // Log detailed CF error when available
                logger.error('CF check failed', {
                    message: err?.message,
                    status: err?.status,
                    body: err?.body,
                })

                const safeStringify = (v: unknown) => {
                    try {
                        const seen = new Set()
                        return JSON.parse(
                            JSON.stringify(v, (_k, val) => {
                                if (val && typeof val === 'object') {
                                    if (seen.has(val)) return '[Circular]'
                                    seen.add(val)
                                }
                                return val
                            })
                        )
                    } catch (_) {
                        try {
                            return String(v)
                        } catch {
                            return null
                        }
                    }
                }

                const payload = {
                    error: String(err?.message || err || 'Unknown error'),
                    status: err?.status ?? null,
                    body: safeStringify(err?.body ?? err),
                }

                // Helpful suggestion when Cloudflare account doesn't have SSL-for-SaaS
                try {
                    const bodyObj = err?.body
                    if (bodyObj && Array.isArray(bodyObj.errors)) {
                        const codes = (bodyObj.errors || []).map((e: any) => e.code)
                        if (codes.includes(7003) || codes.includes(7000)) {
                            payload['suggestion'] = 'Your Cloudflare account does not appear to support SSL for SaaS. Enable the feature or contact Cloudflare support/your account manager.'
                            try {
                                // Persist an explicit status/meta so the UI/back-end stop reattempting account-level hostname creation
                                await prisma.customDomain.update({ where: { id }, data: { cfStatus: 'unsupported', cfMeta: bodyObj, cfBackoffCount: 0, cfPauseUntil: null } })
                            } catch (dbErr) {
                                logger.error('Failed to persist CF unsupported state', { message: (dbErr as any)?.message ?? String(dbErr) })
                            }
                        }
                    }
                } catch (_) { }

                if (process.env.NODE_ENV !== 'production') payload['stack'] = err?.stack

                // increment backoff count for domain to slow polling
                try {
                    const current = domain.cfBackoffCount ?? 0
                    const next = Math.min(current + 1, 10)
                    // compute delay: base 5s * 2^(min(next,5)-1)
                    const exp = Math.min(next, 5)
                    const delayMs = 5000 * Math.pow(2, Math.max(0, exp - 1))
                    const pauseUntil = new Date(Date.now() + delayMs)
                    await prisma.customDomain.update({ where: { id }, data: { cfStatus: 'error', cfMeta: err?.body ?? err, cfBackoffCount: next, cfPauseUntil: pauseUntil } })
                } catch (dbErr) {
                    logger.error('Failed to persist CF error backoff state', { message: (dbErr as any)?.message ?? String(dbErr) })
                }

                return NextResponse.json(payload, { status: 500 })
            }
        }

        // Before creating (or discovering) a Cloudflare custom hostname, verify the
        // user has added the required CNAME/alias. This prevents creating the CF
        // hostname prematurely and lets the UI guide users to add the DNS record first.
        // Expected CNAME target can be configured via env `CNAME_TARGET` or defaults
        // to `cname.emberly.site`.
        const expectedTarget = process.env.CNAME_TARGET || 'cname.emberly.site'

        // For the configured domain (usually a subdomain like img.example.com),
        // check for an existing CNAME record that points to our expected target.
        try {
            const dnsRecords: any = await listDnsRecords({ type: 'CNAME', name: domain.domain })
            const found = Array.isArray(dnsRecords) && dnsRecords.find((r: any) => {
                const content = (r?.content || '').replace(/\.$/, '').toLowerCase()
                return content === expectedTarget.replace(/\.$/, '').toLowerCase()
            })
            if (!found) {
                // Return a 409 indicating the CNAME is missing or doesn't point to the expected target.
                return NextResponse.json({ error: 'CNAME missing or incorrect', expected: expectedTarget }, { status: 409 })
            }
        } catch (dnsErr) {
            // If DNS check fails due to Cloudflare API or other error, log and continue
            // with creation attempt (server operators can inspect logs). But surface a helpful
            // error to the client when appropriate.
            logger.debug('DNS check failed', { message: (dnsErr as any)?.message ?? String(dnsErr) })
            // continue — creation may still succeed in some setups
        }

        // No CF hostname yet: try to discover existing zone-level custom hostname, otherwise create one
        try {
            // Try listing by hostname to discover an existing custom hostname in the zone
            let found: any = null
            try {
                const list = await listCustomHostnames(domain.domain)
                if (Array.isArray(list) && list.length > 0) found = list[0]
            } catch (listErr) {
                logger.debug('listCustomHostnames failed or returned nothing', { message: (listErr as any)?.message ?? String(listErr) })
            }

            let cfRes: any = found
            if (!cfRes) {
                cfRes = await createCustomHostname(domain.domain)
            }

            if (cfRes?.id) {
                const state = cfRes?.status || cfRes?.state || ''
                await prisma.customDomain.update({
                    where: { id },
                    data: {
                        cfHostnameId: cfRes.id,
                        cfStatus: String(state || ''),
                        cfMeta: cfRes,
                        cfBackoffCount: 0,
                        cfPauseUntil: null,
                    },
                })
                return NextResponse.json({ id: cfRes.id, status: state, validation: cfRes.validation_records ?? cfRes.validation_records ?? cfRes.ownership_verification ?? null }, { status: 202 })
            }
            return new NextResponse('Cloudflare did not return id', { status: 500 })
        } catch (err: any) {
            logger.error('Cloudflare create failed', { message: err?.message, status: err?.status, body: err?.body })

            const safeStringify = (v: unknown) => {
                try {
                    const seen = new Set()
                    return JSON.parse(
                        JSON.stringify(v, (_k, val) => {
                            if (val && typeof val === 'object') {
                                if (seen.has(val)) return '[Circular]'
                                seen.add(val)
                            }
                            return val
                        })
                    )
                } catch (_) {
                    try {
                        return String(v)
                    } catch {
                        return null
                    }
                }
            }

            const payload = {
                error: String(err?.message || err || 'Unknown error'),
                status: err?.status ?? null,
                body: safeStringify(err?.body ?? err),
            }
            // Persist error state and backoff to help operators and slow retries
            try {
                const current = domain.cfBackoffCount ?? 0
                const next = Math.min(current + 1, 10)
                const exp = Math.min(next, 5)
                const delayMs = 5000 * Math.pow(2, Math.max(0, exp - 1))
                const pauseUntil = new Date(Date.now() + delayMs)
                await prisma.customDomain.update({ where: { id }, data: { cfStatus: 'error', cfMeta: err?.body ?? err, cfBackoffCount: next, cfPauseUntil: pauseUntil } })
            } catch (dbErr) {
                logger.error('Failed to persist CF error state (create)', { message: (dbErr as any)?.message ?? String(dbErr) })
            }

            if (process.env.NODE_ENV !== 'production') payload['stack'] = err?.stack
            return NextResponse.json(payload, { status: 500 })
        }
    } catch (error) {
        const err: any = error
        logger.error('Error in cf-check', { message: err?.message || String(err), stack: err?.stack })
        const body: any = { error: err?.message || String(err) }
        if (process.env.NODE_ENV !== 'production') body.stack = err?.stack
        return NextResponse.json(body, { status: 500 })
    }
}

export const dynamic = 'force-dynamic'
