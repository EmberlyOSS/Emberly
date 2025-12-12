import { NextResponse } from 'next/server'

import dns from 'dns'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'
import { loggers } from '@/lib/logger'
import { getCustomHostname } from '@/lib/cloudflare/client'

const logger = loggers.domains || loggers.app
const resolveTxt = dns.promises.resolveTxt

// Simple in-memory cache for TXT lookups to avoid hammering DNS during client polling.
// Keyed by TXT name; stores array of joined TXT records and an expiry timestamp.
const txtLookupCache = new Map<
  string,
  { records: string[]; expiresAt: number }
>()
const DEFAULT_CACHE_TTL_MS = 30 * 1000 // 30s

async function dohResolveTxt(name: string): Promise<string[]> {
  // Fallback to DNS-over-HTTPS (Google) when system resolver fails.
  try {
    const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=16`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      logger.debug('DoH TXT lookup failed', { name, status: res.status })
      return []
    }

    const json = await res.json()
    const answers = json.Answer || json.answer || []
    const out: string[] = []
    for (const a of answers) {
      // answer.data often contains the TXT value in quotes; strip them
      if (!a || !a.data) continue
      let txt = String(a.data)
      // Remove surrounding quotes if present, and unescape inner quotes
      if (txt.startsWith('"') && txt.endsWith('"')) {
        txt = txt.slice(1, -1).replace(/\\"/g, '"')
      }
      out.push(txt)
    }
    return out
  } catch (err) {
    logger.debug('DoH TXT lookup exception', err as Error)
    return []
  }
}

async function getTxtRecords(name: string): Promise<string[]> {
  const now = Date.now()
  const cached = txtLookupCache.get(name)
  if (cached && cached.expiresAt > now) return cached.records

  try {
    const raw = await resolveTxt(name)
    // resolveTxt returns string[][]; join segments into single strings
    const records = raw.map((parts) => parts.join(''))
    txtLookupCache.set(name, { records, expiresAt: now + DEFAULT_CACHE_TTL_MS })
    return records
  } catch (err) {
    logger.debug('System TXT lookup failed, falling back to DoH', err as Error)
    const records = await dohResolveTxt(name)
    txtLookupCache.set(name, { records, expiresAt: now + DEFAULT_CACHE_TTL_MS })
    return records
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Manual TXT verification endpoint removed — verification now relies on Cloudflare
  // hosted TXT records surfaced by the `/api/domains/:id/cf-check` flow.
  return new NextResponse('Manual TXT verification removed; use cf-check', { status: 410 })
}
