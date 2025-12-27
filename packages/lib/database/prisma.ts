import { PrismaClient } from '@/prisma/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Create the PostgreSQL adapter with connection string
// Note: PrismaPg handles connection pooling internally
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
})

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === 'development'
                ? ['warn', 'error']
                : ['error'],
    })

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

/**
 * Execute a query with automatic retry on connection errors
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation()
        } catch (error) {
            lastError = error as Error
            const message = lastError.message?.toLowerCase() ?? ''

            // Only retry on connection-related errors
            const isConnectionError =
                message.includes('connection') ||
                message.includes('terminated') ||
                message.includes('timeout') ||
                message.includes('econnrefused') ||
                message.includes('econnreset')

            if (!isConnectionError || attempt === maxRetries) {
                throw error
            }

            // Exponential backoff
            const waitTime = delay * Math.pow(2, attempt - 1)
            console.warn(`[prisma] Connection error, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})`)
            await new Promise((r) => setTimeout(r, waitTime))
        }
    }

    throw lastError
}

export default prisma

