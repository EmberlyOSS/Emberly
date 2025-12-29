import { Adapter } from 'next-auth/adapters'
import { getRedisClient } from '@/packages/lib/cache/redis'

const SESSION_PREFIX = 'nextauth:session:'
const USER_SESSIONS_PREFIX = 'nextauth:user-sessions:'

export interface RedisSession {
  sessionToken: string
  userId: string
  expires: number
  createdAt: number
}

/**
 * Redis-backed session adapter for NextAuth
 * Enables cross-domain session sharing through a shared Redis store
 */
export function RedisSessionAdapter(): Adapter {
  return {
    async createSession(session) {
      const redis = await getRedisClient()
      const sessionToken = session.sessionToken
      const userId = session.userId
      const expiresAt = session.expires.getTime()
      
      const redisSession: RedisSession = {
        sessionToken,
        userId,
        expires: expiresAt,
        createdAt: Date.now(),
      }

      // Store session by token
      await redis.setex(
        `${SESSION_PREFIX}${sessionToken}`,
        Math.ceil((expiresAt - Date.now()) / 1000),
        JSON.stringify(redisSession)
      )

      // Store session reference in user's sessions list
      await redis.sadd(`${USER_SESSIONS_PREFIX}${userId}`, sessionToken)

      return {
        sessionToken,
        userId,
        expires: new Date(expiresAt),
      }
    },

    async getSessionAndUser(sessionToken) {
      const redis = await getRedisClient()
      const data = await redis.get(`${SESSION_PREFIX}${sessionToken}`)
      
      if (!data) {
        return null
      }

      const session = JSON.parse(data) as RedisSession

      // Check if session has expired
      if (session.expires < Date.now()) {
        await redis.del(`${SESSION_PREFIX}${sessionToken}`)
        await redis.srem(`${USER_SESSIONS_PREFIX}${session.userId}`, sessionToken)
        return null
      }

      // Session is valid - return it with user
      // Note: User data should be fetched from database in the session callback
      return {
        session: {
          sessionToken,
          userId: session.userId,
          expires: new Date(session.expires),
        },
        user: { id: session.userId } as any, // Type will be properly resolved in session callback
      }
    },

    async updateSession(session) {
      const redis = await getRedisClient()
      const sessionToken = session.sessionToken
      const expiresAt = session.expires.getTime()

      const data = await redis.get(`${SESSION_PREFIX}${sessionToken}`)
      if (!data) {
        return null
      }

      const redisSession = JSON.parse(data) as RedisSession

      // Update expiration
      await redis.setex(
        `${SESSION_PREFIX}${sessionToken}`,
        Math.ceil((expiresAt - Date.now()) / 1000),
        JSON.stringify({
          ...redisSession,
          expires: expiresAt,
        })
      )

      return {
        sessionToken,
        userId: redisSession.userId,
        expires: new Date(expiresAt),
      }
    },

    async deleteSession(sessionToken) {
      const redis = await getRedisClient()
      const data = await redis.get(`${SESSION_PREFIX}${sessionToken}`)
      
      if (data) {
        const session = JSON.parse(data) as RedisSession
        await redis.del(`${SESSION_PREFIX}${sessionToken}`)
        await redis.srem(`${USER_SESSIONS_PREFIX}${session.userId}`, sessionToken)
      }
    },

    // These are required by the Adapter interface but not used in our flow
    async createUser() {
      throw new Error('Not implemented')
    },
    async getUser() {
      throw new Error('Not implemented')
    },
    async getUserByEmail() {
      throw new Error('Not implemented')
    },
    async getUserByAccount() {
      throw new Error('Not implemented')
    },
    async updateUser() {
      throw new Error('Not implemented')
    },
    async deleteUser() {
      throw new Error('Not implemented')
    },
    async linkAccount() {
      throw new Error('Not implemented')
    },
    async unlinkAccount() {
      throw new Error('Not implemented')
    },
    async createVerificationToken() {
      throw new Error('Not implemented')
    },
    async useVerificationToken() {
      throw new Error('Not implemented')
    },
  }
}
