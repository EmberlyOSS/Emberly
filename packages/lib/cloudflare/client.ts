import { loggers } from '@/packages/lib/logger'
import { getIntegrations } from '@/packages/lib/config'

const logger = loggers.app

class CloudflareError extends Error {
    status: number
    body: any
    url: string
    constructor(message: string, status: number, body: any, url: string) {
        super(message)
        this.name = 'CloudflareError'
        this.status = status
        this.body = body
        this.url = url
    }
}

async function getCfCredentials() {
    const integrations = await getIntegrations()
    const zoneId = integrations.cloudflare?.zoneId || process.env.CLOUDFLARE_ZONE_ID
    const apiToken = integrations.cloudflare?.apiToken || process.env.CLOUDFLARE_API_TOKEN
    return { zoneId, apiToken }
}

async function cfFetch(path: string, opts: RequestInit = {}) {
    const { zoneId, apiToken } = await getCfCredentials()
    if (!zoneId || !apiToken) {
        throw new Error('Cloudflare zone credentials not configured')
    }

    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}${path}`
    const headers: Record<string, string> = {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        ...(opts.headers as Record<string, string>),
    }

    const res = await fetch(url, { ...opts, headers })
    // Read raw text first so we can include it in errors if JSON parsing fails
    const text = await res.text().catch(() => '')
    let json: any = null
    try {
        json = text ? JSON.parse(text) : null
    } catch (parseErr) {
        // keep json as null and include raw text in logs/errors
        json = null
    }

    if (!res.ok) {
        // log full raw text and parsed body for operators
        try {
            logger.error('Cloudflare Zone API error', { url, status: res.status, body: json ?? text })
        } catch (_) { }
        throw new CloudflareError('Cloudflare Zone API error', res.status, json ?? text, url)
    }

    return json ?? text
}

export async function createCustomHostname(hostname: string) {
    // Creates an SSL for SaaS custom hostname. Returns the raw result.result
    try {
        const body = { hostname }
        const json = await cfFetch('/custom_hostnames', {
            method: 'POST',
            body: JSON.stringify(body),
        })

        // Defensive checks: Cloudflare may return success:false with errors
        if (!json) {
            throw new Error('Cloudflare returned empty response')
        }
        if (json.success === false) {
            const errBody = json.errors || json;
            throw new CloudflareError('Cloudflare reported failure', (json?.status as number) || 422, errBody, `/ssl/ssl_for_saas/hostnames`)
        }

        if (!json) {
            throw new Error('Cloudflare returned empty response')
        }
        if (json.success === false) {
            const errBody = json.errors || json
            throw new CloudflareError('Cloudflare reported failure', (json?.status as number) || 422, errBody, '/zones/<zone>/custom_hostnames')
        }
        if (!('result' in json)) {
            // Some zone responses may return the object directly; return it
            return json
        }
        return json.result
    } catch (err) {
        // Normalize error to a string-backed Error to avoid serialization issues
        try {
            logger.error('createCustomHostname failed', { message: (err as any)?.message, status: (err as any)?.status, body: (err as any)?.body ?? err })
        } catch (_) {
            // ignore logging errors
        }
        // If this is a CloudflareError, rethrow it so callers can inspect status/body
        if (err instanceof CloudflareError) throw err
        throw new Error('Cloudflare createCustomHostname failed: ' + ((err as any)?.message || String(err)))
    }
}

export async function listCustomHostnames(hostname?: string) {
    try {
        const path = '/custom_hostnames' + (hostname ? `?hostname=${encodeURIComponent(hostname)}` : '')
        const json = await cfFetch(path)
        if (!json) throw new Error('Cloudflare returned empty response')
        if (json.success === false) {
            const errBody = json.errors || json
            throw new CloudflareError('Cloudflare reported failure', (json?.status as number) || 422, errBody, '/zones/<zone>/custom_hostnames')
        }
        if ('result' in json) return json.result
        return json
    } catch (err) {
        try {
            logger.error('listCustomHostnames failed', { message: (err as any)?.message, status: (err as any)?.status, body: (err as any)?.body ?? err })
        } catch (_) { }
        if (err instanceof CloudflareError) throw err
        throw new Error('Cloudflare listCustomHostnames failed: ' + ((err as any)?.message || String(err)))
    }
}

export async function listDnsRecords(opts: { type?: string; name?: string } = {}) {
    try {
        const qs: string[] = []
        if (opts.type) qs.push(`type=${encodeURIComponent(opts.type)}`)
        if (opts.name) qs.push(`name=${encodeURIComponent(opts.name)}`)
        const path = '/dns_records' + (qs.length ? `?${qs.join('&')}` : '')
        const json = await cfFetch(path)
        if (!json) throw new Error('Cloudflare returned empty response')
        if (json.success === false) {
            const errBody = json.errors || json
            throw new CloudflareError('Cloudflare reported failure', (json?.status as number) || 422, errBody, '/zones/<zone>/dns_records')
        }
        if ('result' in json) return json.result
        return json
    } catch (err) {
        try {
            logger.error('listDnsRecords failed', { message: (err as any)?.message, status: (err as any)?.status, body: (err as any)?.body ?? err })
        } catch (_) { }
        if (err instanceof CloudflareError) throw err
        throw new Error('Cloudflare listDnsRecords failed: ' + ((err as any)?.message || String(err)))
    }
}

export async function createDnsRecord(params: {
    type: 'CNAME' | 'A'
    name: string     // e.g. 'storage-ewr' (relative to zone)
    content: string  // e.g. 'ewr1.vultrobjects.com'
    proxied?: boolean
    ttl?: number     // 1 = automatic
}): Promise<{ id: string; name: string }> {
    try {
        const body = {
            type: params.type,
            name: params.name,
            content: params.content,
            proxied: params.proxied ?? false,
            ttl: params.ttl ?? 1,
        }
        const json = await cfFetch('/dns_records', {
            method: 'POST',
            body: JSON.stringify(body),
        })
        if (!json) throw new Error('Cloudflare returned empty response')
        if (json.success === false) {
            const errBody = json.errors || json
            throw new CloudflareError('Cloudflare reported failure', (json?.status as number) || 422, errBody, '/zones/<zone>/dns_records')
        }
        const result = 'result' in json ? json.result : json
        return { id: result.id, name: result.name }
    } catch (err) {
        try {
            logger.error('createDnsRecord failed', { message: (err as any)?.message, status: (err as any)?.status, body: (err as any)?.body ?? err })
        } catch (_) { }
        if (err instanceof CloudflareError) throw err
        throw new Error('Cloudflare createDnsRecord failed: ' + ((err as any)?.message || String(err)))
    }
}

export async function deleteDnsRecord(recordId: string): Promise<void> {
    try {
        const json = await cfFetch(`/dns_records/${encodeURIComponent(recordId)}`, { method: 'DELETE' })
        if (json && json.success === false) {
            const errBody = json.errors || json
            throw new CloudflareError('Cloudflare reported failure', (json?.status as number) || 422, errBody, `/zones/<zone>/dns_records/${recordId}`)
        }
    } catch (err) {
        try {
            logger.error('deleteDnsRecord failed', { message: (err as any)?.message, status: (err as any)?.status, body: (err as any)?.body ?? err })
        } catch (_) { }
        if (err instanceof CloudflareError) throw err
        throw new Error('Cloudflare deleteDnsRecord failed: ' + ((err as any)?.message || String(err)))
    }
}

export async function getCustomHostname(hostnameId: string) {
    try {
        const json = await cfFetch(`/custom_hostnames/${encodeURIComponent(hostnameId)}`, { method: 'GET' })

        if (!json) throw new Error('Cloudflare returned empty response')
        if (json.success === false) {
            throw new CloudflareError('Cloudflare reported failure', (json?.status as number) || 422, json.errors || json, '/zones/<zone>/custom_hostnames/<id>')
        }
        if (!('result' in json)) return json
        return json.result
    } catch (err) {
        try {
            logger.error('getCustomHostname failed', { message: (err as any)?.message, status: (err as any)?.status, body: (err as any)?.body ?? err })
        } catch (_) { }
        if (err instanceof CloudflareError) throw err
        throw new Error('Cloudflare getCustomHostname failed: ' + ((err as any)?.message || String(err)))
    }
}

/** Returns the zone's root domain name (e.g. 'emberly.site') by querying GET /zones/{zoneId} */
export async function getZoneName(): Promise<string> {
    const { zoneId, apiToken } = await getCfCredentials()
    if (!zoneId || !apiToken) throw new Error('Cloudflare zone credentials not configured')
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, {
        headers: { Authorization: `Bearer ${apiToken}` },
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.success === false) {
        throw new CloudflareError('Failed to fetch zone name', res.status, json?.errors ?? json, `/zones/${zoneId}`)
    }
    return json.result.name as string
}

export default { createCustomHostname, getCustomHostname, createDnsRecord, deleteDnsRecord, getZoneName }
