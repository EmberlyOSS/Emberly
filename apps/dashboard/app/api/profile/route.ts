import { ProfileResponse, UpdateProfileSchema } from '@/types/dto/profile'
import { Prisma } from '@emberly/db'
import { compare, hash } from 'bcryptjs'

import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import { sessionCache } from '@/lib/cache/session-cache'
import { prisma } from '@emberly/db'
import { events } from '@/lib/events'
import { loggers } from '@/lib/logger'
import { getProviderForStoredFile, getStorageProvider } from '@/lib/storage'
import { storagePathFromMediaUrl } from '@/lib/storage/public-media'
import {
  checkPasswordReuse,
  recordPasswordHistory,
} from '@/lib/security/password-reuse-checker'
import { removePreview } from '@/lib/embeds/preview'

const logger = loggers.users

export async function GET(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        randomizeFileUrls: true,
        enableRichEmbeds: true,
        emailNotificationsEnabled: true,
        emailPreferences: true,
        discordWebhookUrl: true,
        discordNotificationsEnabled: true,
        discordPreferences: true,
        createdAt: true,
        updatedAt: true,
        // Public profile fields
        bio: true,
        website: true,
        twitter: true,
        github: true,
        discord: true,
        isProfilePublic: true,
        profileVisibility: true,
        urlId: true,
        vanityId: true,
        files: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            visibility: true,
            uploadedAt: true,
            isOcrProcessed: true,
            ocrText: true,
            isPaste: true,
            path: true,
          },
        },
        shortenedUrls: {
          select: {
            shortCode: true,
            targetUrl: true,
            clicks: true,
            createdAt: true,
          },
        },
        theme: true,
        twoFactorEnabled: true,
      },
    })

    if (!userData) {
      return apiError('User not found', HTTP_STATUS.NOT_FOUND)
    }

    logger.info('Profile fetched', {
      userId: user.id,
      emailVerified: userData.emailVerified,
    })
    return apiResponse(userData)
  } catch (error) {
    logger.error('Profile fetch error:', error as Error)
    return apiError('Internal server error')
  }
}

export async function PUT(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const json = await req.json()

    const result = UpdateProfileSchema.safeParse(json)
    if (!result.success) {
      return apiError(result.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    const body = result.data

    if (body.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: body.email,
          NOT: {
            id: user.id,
          },
        },
      })

      if (existingUser) {
        return apiError('Email already taken', HTTP_STATUS.BAD_REQUEST)
      }
    }

    if (body.newPassword) {
      if (!body.currentPassword) {
        return apiError('Current password is required', HTTP_STATUS.BAD_REQUEST)
      }

      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      })

      if (!userData?.password) {
        return apiError('Invalid credentials', HTTP_STATUS.BAD_REQUEST)
      }

      const isPasswordValid = await compare(
        body.currentPassword,
        userData.password
      )

      if (!isPasswordValid) {
        return apiError('Invalid credentials', HTTP_STATUS.BAD_REQUEST)
      }

      // Check if new password is being reused
      const reuseCheck = await checkPasswordReuse(user.id, body.newPassword)
      if (reuseCheck.isReused) {
        return apiError(
          'Cannot reuse a recent password. Please use a different password.',
          HTTP_STATUS.BAD_REQUEST
        )
      }
    }

    const updateData: Prisma.UserUpdateInput = {}
    if (body.name) updateData.name = body.name
    if (body.email) updateData.email = body.email
    if (body.newPassword) {
      // Record current password to history before updating
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      })
      if (currentUser?.password) {
        await recordPasswordHistory(user.id, currentUser.password)
      }
      updateData.password = await hash(body.newPassword, 10)
    }
    if (body.image) updateData.image = body.image
    if (typeof body.randomizeFileUrls === 'boolean')
      updateData.randomizeFileUrls = body.randomizeFileUrls
    if (typeof body.enableRichEmbeds === 'boolean')
      updateData.enableRichEmbeds = body.enableRichEmbeds
    if (typeof body.theme === 'string') updateData.theme = body.theme
    if (body.customColors) updateData.customColors = body.customColors
    // theme: null clears the user's choice so they follow the system theme again
    if (body.theme === null) {
      updateData.theme = null
      updateData.customColors = Prisma.DbNull
    }
    if (body.defaultFileExpiration)
      updateData.defaultFileExpiration = body.defaultFileExpiration
    if (body.defaultFileExpirationAction)
      updateData.defaultFileExpirationAction = body.defaultFileExpirationAction
    // Email notification preferences
    if (typeof body.emailNotificationsEnabled === 'boolean')
      updateData.emailNotificationsEnabled = body.emailNotificationsEnabled
    if (body.emailPreferences) {
      // Merge with existing preferences
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { emailPreferences: true },
      })
      const existingPrefs =
        (existingUser?.emailPreferences as Record<string, boolean>) || {}
      updateData.emailPreferences = {
        ...existingPrefs,
        ...body.emailPreferences,
      }
    }
    if (body.discordWebhookUrl !== undefined)
      updateData.discordWebhookUrl = body.discordWebhookUrl
    if (typeof body.discordNotificationsEnabled === 'boolean')
      updateData.discordNotificationsEnabled = body.discordNotificationsEnabled
    if (body.discordPreferences) {
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { discordPreferences: true },
      })
      const existingPrefs =
        (existingUser?.discordPreferences as Record<string, boolean>) || {}
      updateData.discordPreferences = {
        ...existingPrefs,
        ...body.discordPreferences,
      }
    }

    // Public profile fields
    if (body.fullName !== undefined) updateData.fullName = body.fullName
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.website !== undefined) updateData.website = body.website
    if (body.twitter !== undefined) updateData.twitter = body.twitter
    if (body.github !== undefined) updateData.github = body.github
    if (body.discord !== undefined) updateData.discord = body.discord
    if (typeof body.isProfilePublic === 'boolean')
      updateData.isProfilePublic = body.isProfilePublic
    if (typeof body.showLinkedAccounts === 'boolean')
      updateData.showLinkedAccounts = body.showLinkedAccounts
    if (body.profileVisibility)
      updateData.profileVisibility = body.profileVisibility

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        fullName: true,
        email: true,
        image: true,
        randomizeFileUrls: true,
        enableRichEmbeds: true,
        emailNotificationsEnabled: true,
        emailPreferences: true,
        discordWebhookUrl: true,
        discordNotificationsEnabled: true,
        discordPreferences: true,
        // Public profile fields
        bio: true,
        website: true,
        twitter: true,
        github: true,
        discord: true,
        isProfilePublic: true,
        showLinkedAccounts: true,
        profileVisibility: true,
      },
    })

    // Invalidate session cache
    await sessionCache.invalidateUserSession(user.id)

    // Emit auditable event (fire-and-forget)
    if (body.newPassword) {
      void events
        .emit('auth.password-changed', {
          userId: user.id,
          email: updatedUser.email!,
          changedBy: 'user',
        })
        .catch((err) =>
          console.error('[Events] Failed to emit auth.password-changed', err)
        )
    } else {
      void events
        .emit('account.profile-updated', {
          userId: user.id,
          email: updatedUser.email!,
          fields: Object.keys(updateData),
        })
        .catch((err) =>
          console.error('[Events] Failed to emit account.profile-updated', err)
        )
    }

    const profileResponse: ProfileResponse = {
      ...updatedUser,
      emailPreferences:
        updatedUser.emailPreferences as ProfileResponse['emailPreferences'],
      discordPreferences:
        updatedUser.discordPreferences as ProfileResponse['discordPreferences'],
    }
    return apiResponse<ProfileResponse>(profileResponse)
  } catch (error) {
    logger.error('Profile update error:', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export async function DELETE(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    // Deleting an account must be confirmed with the password, so a leaked
    // API key or upload token can't wipe it
    const { password } = (await req.json().catch(() => ({}))) as {
      password?: unknown
    }
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })
    if (
      typeof password !== 'string' ||
      !password ||
      !account?.password ||
      !(await compare(password, account.password))
    ) {
      return apiError(
        'Enter your password to delete your account',
        HTTP_STATUS.FORBIDDEN
      )
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        files: {
          select: {
            id: true,
            path: true,
            storageBucketId: true,
          },
        },
      },
    })

    if (!userData) {
      return apiError('User not found', HTTP_STATUS.NOT_FOUND)
    }

    for (const file of userData.files) {
      try {
        const storage = await getProviderForStoredFile(file.storageBucketId)
        await storage.deleteFile(file.path)
        await removePreview(file.id)
      } catch (error) {
        logger.error(`Error deleting file ${file.path}:`, error as Error)
      }
    }

    for (const [url, kind] of [
      [userData.image, 'avatars'],
      [userData.banner, 'banners'],
    ] as const) {
      const mediaPath = storagePathFromMediaUrl(url, kind)
      if (!mediaPath) continue
      try {
        await (await getStorageProvider()).deleteFile(mediaPath)
      } catch (error) {
        logger.error(`Error deleting ${kind} image:`, error as Error)
      }
    }

    await prisma.user.delete({
      where: { id: user.id },
    })

    // Emit auditable event (fire-and-forget)
    void events
      .emit('account.deleted', {
        userId: user.id,
        email: userData.email!,
        deletedBy: 'user',
      })
      .catch((err) =>
        console.error('[Events] Failed to emit account.deleted', err)
      )

    return new Response(null, { status: HTTP_STATUS.NO_CONTENT })
  } catch (error) {
    logger.error('Account deletion error:', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
