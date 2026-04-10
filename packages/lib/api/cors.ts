/**
 * CORS utilities for file serving and embedding
 * Enables users to embed Emberly-hosted files/images on external sites
 */

import type { NextResponse } from 'next/server'

export interface CORSConfig {
  allowOrigin?: string | string[] | '*'
  allowMethods?: string[]
  allowHeaders?: string[]
  exposeHeaders?: string[]
  maxAge?: number
}

const DEFAULT_CORS_CONFIG: CORSConfig = {
  allowOrigin: '*', // Allow embedding from anywhere
  allowMethods: ['GET', 'HEAD', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Range'],
  exposeHeaders: [
    'Content-Type',
    'Content-Length',
    'Content-Range',
    'Accept-Ranges',
    'Cache-Control',
  ],
  maxAge: 86400, // 24 hours
}

/**
 * Add CORS headers to a Response object
 * Enables cross-origin file embedding and access
 */
export function addCORSHeaders(
  response: Response,
  config: CORSConfig = DEFAULT_CORS_CONFIG
): Response {
  // Parse allow-origin
  const allowOrigin =
    typeof config.allowOrigin === 'string'
      ? config.allowOrigin
      : (config.allowOrigin as string[])?.join(', ') || '*'

  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', allowOrigin)
  response.headers.set(
    'Access-Control-Allow-Methods',
    config.allowMethods?.join(', ') || DEFAULT_CORS_CONFIG.allowMethods!.join(', ')
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    config.allowHeaders?.join(', ') || DEFAULT_CORS_CONFIG.allowHeaders!.join(', ')
  )
  response.headers.set(
    'Access-Control-Expose-Headers',
    config.exposeHeaders?.join(', ') || DEFAULT_CORS_CONFIG.exposeHeaders!.join(', ')
  )
  response.headers.set(
    'Access-Control-Max-Age',
    (config.maxAge || DEFAULT_CORS_CONFIG.maxAge).toString()
  )

  // Allow credentials if not wildcard origin (only with specific origins)
  if (allowOrigin !== '*') {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

/**
 * Add security headers for file responses
 * Prevents MIME-type sniffing and enables safe cross-origin usage
 */
export function addSecurityHeaders(response: Response): Response {
  // Prevent MIME-type sniffing attacks
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Control referrer data sent to external sites
  // 'no-referrer-when-downgrade' = send full referrer when staying on HTTPS, strip for HTTP
  // This allows your site to be linked from cross-origin embeds
  response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade')

  // Prevent embedding in pages with different origins
  // Set to SAMEORIGIN if you want to restrict embedding to your own domain
  // Leave unset (or use 'ALLOWALL') to allow embedding everywhere
  // Note: ALLOWALL is not a standard, so we omit the header instead
  // response.headers.set('X-Frame-Options', 'ALLOWALL') // not standard

  return response
}

/**
 * Handle CORS preflight OPTIONS requests
 * Required for browsers to allow cross-origin requests with custom headers
 */
export function handleCORSPreflight(
  request: Request,
  config: CORSConfig = DEFAULT_CORS_CONFIG
) {
  // Check if this is a preflight request
  if (request.method === 'OPTIONS') {
    const response = new Response(null, { status: 204 })
    addCORSHeaders(response, config)
    addSecurityHeaders(response)
    return response
  }

  return null // Not a preflight request
}

/**
 * Get CORS-compatible headers object for NextResponse
 * Useful when constructing responses with headers object
 */
export function getCORSHeaders(
  config: CORSConfig = DEFAULT_CORS_CONFIG
): Record<string, string> {
  const allowOrigin =
    typeof config.allowOrigin === 'string'
      ? config.allowOrigin
      : (config.allowOrigin as string[])?.join(', ') || '*'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': config.allowMethods?.join(', ') || 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers':
      config.allowHeaders?.join(', ') || 'Content-Type, Range',
    'Access-Control-Expose-Headers': config.exposeHeaders?.join(', ') || 'Content-Type, Content-Length, Content-Range, Accept-Ranges, Cache-Control',
    'Access-Control-Max-Age': (config.maxAge || 86400).toString(),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer-when-downgrade',
  }
}
