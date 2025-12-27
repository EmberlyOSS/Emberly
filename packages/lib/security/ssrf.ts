/**
 * SSRF protection utilities
 */

const PRIVATE_IP_REGEX = /^(?:10\.|127\.|169\.254\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|::1|fe80:|fc00:|fd00:)/i

/**
 * Validates if a URL is safe to use (not pointing to internal/private resources)
 * This is a basic check to prevent easy SSRF. Full protection would require
 * DNS resolution check.
 */
export function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        const hostname = parsed.hostname.toLowerCase()

        // Block localhost and common internal names
        if (hostname === 'localhost' || hostname === 'localhost.localdomain') {
            return false
        }

        // Block private IP addresses if specified directly in URL
        if (PRIVATE_IP_REGEX.test(hostname)) {
            return false
        }

        // Only allow http and https
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false
        }

        return true
    } catch (e) {
        return false
    }
}
