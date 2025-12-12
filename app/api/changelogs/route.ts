import { NextResponse } from 'next/server'

const GITHUB_API = 'https://api.github.com'

async function ghFetch(path: string, token?: string) {
    const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${GITHUB_API}${path}`, { headers })
    if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`GitHub API error ${res.status}: ${text}`)
    }
    return res.json()
}

export async function GET(req: Request) {
    try {
        const token = process.env.GITHUB_PAT
        const url = new URL(req.url)
        const org = url.searchParams.get('org') || process.env.GITHUB_ORG
        if (!org) return NextResponse.json({ error: 'Missing org (query ?org= or GITHUB_ORG env)' }, { status: 400 })

        // list repos for org (public and private accessible with PAT)
        const repos = await ghFetch(`/orgs/${org}/repos?per_page=100`, token)

        // for each repo, fetch releases (we'll fetch only latest page for now)
        const releasesPromises = repos.map(async (r: any) => {
            try {
                const rels = await ghFetch(`/repos/${org}/${r.name}/releases?per_page=10`, token)
                return rels.map((rl: any) => ({ repo: r.name, repoUrl: r.html_url, ...rl }))
            } catch (err) {
                return []
            }
        })

        const releasesNested = await Promise.all(releasesPromises)
        const releases = ([] as any[]).concat(...releasesNested)

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
            assets: (r.assets || []).map((a: any) => ({ name: a.name, url: a.browser_download_url, size: a.size }))
        }))

        normalized.sort((a, b) => (new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()))

        return NextResponse.json({ org, count: normalized.length, releases: normalized })
    } catch (err: any) {
        console.error('changelogs route error', err)
        return NextResponse.json({ error: err.message || 'Failed to fetch changelogs' }, { status: 500 })
    }
}
