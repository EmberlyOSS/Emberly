import { createClient } from 'redis'

import { loggers } from '@/packages/lib/logger'

const logger = loggers.events.getChildLogger('redis')

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

let client: ReturnType<typeof createClient> | null = null
let isConnecting = false
let isConnected = false

export async function getRedisClient() {
    if (client && isConnected) {
        return client
    }

    if (isConnecting) {
        // Wait for connection to complete
        let attempts = 0
        while (isConnecting && attempts < 50) {
            await new Promise((resolve) => setTimeout(resolve, 100))
            attempts++
        }
        if (client && isConnected) return client
    }

    isConnecting = true

    try {
        client = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Redis reconnection failed after 10 attempts')
                        return new Error('Redis max retries exceeded')
                    }
                    return Math.min(retries * 50, 500)
                },
            },
        })

        client.on('error', (err) => {
            logger.error('Redis client error', err)
            isConnected = false
        })

        client.on('connect', () => {
            logger.info('Redis connected')
            isConnected = true
        })

        client.on('ready', () => {
            logger.info('Redis ready')
            isConnected = true
        })

        client.on('reconnecting', () => {
            logger.warn('Redis reconnecting')
            isConnected = false
        })

        await client.connect()
        isConnected = true
        logger.info('Redis client initialized')
        return client
    } catch (error) {
        logger.error('Failed to connect to Redis', error as Error)
        isConnected = false
        throw error
    } finally {
        isConnecting = false
    }
}

export async function closeRedis() {
    if (client) {
        await client.quit()
        client = null
        isConnected = false
        logger.info('Redis connection closed')
    }
}

export function isRedisConnected(): boolean {
    return isConnected
}

// Redis key helpers
export const redisKeys = {
    // Event queue
    eventQueue: (status: string) => `emberly:events:queue:${status.toLowerCase()}`,
    eventProcessing: () => 'emberly:events:processing',
    eventLock: (eventId: string) => `emberly:event:lock:${eventId}`,

    // Stats
    eventStats: () => 'emberly:events:stats',
    workerStats: () => 'emberly:worker:stats',

    // Handler registry
    handlerRegistry: () => 'emberly:handlers:registry',
    handlersByType: (eventType: string) =>
        `emberly:handlers:by-type:${eventType}`,

    // Scheduled events
    scheduledEvents: () => 'emberly:events:scheduled',

    // Upload metadata (chunked uploads)
    uploadMetadata: (uploadId: string) => `emberly:upload:${uploadId}`,
    uploadList: () => 'emberly:uploads:active',

    // Config cache
    config: () => 'emberly:config',
    setupStatus: () => 'emberly:setup:status',

    // Session/auth cache
    userSession: (userId: string) => `emberly:session:user:${userId}`,
    userByEmail: (email: string) => `emberly:user:email:${email}`,
    userByToken: (token: string) => `emberly:user:token:${token}`,

    // Rate limiting
    rateLimit: (key: string) => `emberly:ratelimit:${key}`,

    // General cache
    cache: (key: string) => `emberly:cache:${key}`,
}
