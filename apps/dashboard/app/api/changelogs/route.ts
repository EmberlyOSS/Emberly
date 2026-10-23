import { NextResponse } from 'next/server'

import { getOrgReleases } from '@/lib/github'
import { getIntegrations } from '@/lib/config'

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const integrations = await getIntegrations()
        const org = url.searchParams.get('org') || integrations.github?.org || process.env.GITHUB_ORG
        if (!org) return NextResponse.json({ error: 'Missing org (query ?org= or configure GitHub org in admin settings)' }, { status: 400 })

        const releases = await getOrgReleases(org)

        // normalize and sort by published_at desc
        const normalized = releases.map((r) => ({
            repo: r.repo,
            repoUrl: r.repoUrl,
            id: r.id,
            tagName: r.tag_name,
            name: r.name || r.tag_name,
            body: r.body || '',
            htmlUrl: r.html_url,
            publishedAt: r.published_at || r.created_at,
            author: r.author ? { login: r.author.login, avatar: r.author.avatar_url, url: r.author.html_url } : null,
            assets: r.assets.map((a) => ({ name: a.name, url: a.browser_download_url, size: a.size }))
        }))

        normalized.sort((a, b) => (new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()))

        return NextResponse.json({ org, count: normalized.length, releases: normalized })
    } catch (err: any) {
        console.error('changelogs route error', err)
        return NextResponse.json({ error: err.message || 'Failed to fetch changelogs' }, { status: 500 })
    }
}

