import { UserResponse, UserSchema } from '@/types/dto/user'
import { hash } from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

import {
  HTTP_STATUS,
  apiError,
  apiResponse,
  paginatedResponse,
} from '@/lib/api/response'
import { requireAdmin, requireSuperAdmin } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/database/prisma'
import { loggers } from '@/lib/logger'
import { getStorageProvider } from '@/lib/storage'

const logger = loggers.users

export async function GET(req: Request) {
  try {
    const { response } = await requireAdmin()
    if (response) return response

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = (page - 1) * limit

    const total = await prisma.user.count()

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        urlId: true,
        storageUsed: true,
        _count: {
          select: {
            files: true,
            shortenedUrls: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    const pagination = {
      total,
      pageCount: Math.ceil(total / limit),
      page,
      limit,
    }

    return paginatedResponse<UserResponse[]>(users, pagination)
  } catch (error) {
    logger.error('Error fetching users', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export async function POST(req: Request) {
  try {
    const { response } = await requireAdmin()
    if (response) return response

    const json = await req.json()

    const result = UserSchema.safeParse(json)
    if (!result.success) {
      return apiError(result.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    const body = result.data
    const raw = json as any

    const exists = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (exists) {
      return apiError('User already exists', HTTP_STATUS.BAD_REQUEST)
    }

    const generateUrlId = () =>
      Array.from({ length: 5 }, () => {
        const chars =
          '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
        return chars.charAt(Math.floor(Math.random() * chars.length))
      }).join('')

    let urlId = generateUrlId()
    let isUnique = false
    while (!isUnique) {
      const existing = await prisma.user.findUnique({
        where: { urlId },
      })
      if (!existing) {
        isUnique = true
      } else {
        urlId = generateUrlId()
      }
    }

    // If attempting to create an ADMIN/SUPERADMIN user, require SUPERADMIN
    if (body.role && (body.role === 'ADMIN' || body.role === 'SUPERADMIN')) {
      const { response: saResponse } = await requireSuperAdmin()
      if (saResponse) return saResponse
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: body.password ? await hash(body.password, 10) : undefined,
        role: body.role,
        urlId,
        uploadToken: uuidv4(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        urlId: true,
        storageUsed: true,
        _count: {
          select: {
            files: true,
            shortenedUrls: true,
          },
        },
      },
    })

    return apiResponse<UserResponse>(user)
  } catch (error) {
    logger.error('Error creating user', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export async function PUT(req: Request) {
  try {
    const { response } = await requireAdmin()
    if (response) return response

    const json = await req.json()

    const result = UserSchema.safeParse(json)
    if (!result.success) {
      return apiError(result.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    const body = result.data

    if (!body.id) {
      return apiError('User ID is required', HTTP_STATUS.BAD_REQUEST)
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: body.id },
    })

    if (!existingUser) {
      return apiError('User not found', HTTP_STATUS.NOT_FOUND)
    }

    if (body.urlId) {
      const existingUrlId = await prisma.user.findUnique({
        where: { urlId: body.urlId },
      })
      if (existingUrlId && existingUrlId.id !== body.id) {
        return apiError('URL ID is already in use', HTTP_STATUS.BAD_REQUEST)
      }
    }

    // If changing role, or modifying storage/grants/plans, only SUPERADMIN may do so
    const updateData: any = {
      updatedAt: new Date(),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.role !== undefined && { role: body.role }),
      ...(body.password && { password: await hash(body.password, 10) }),
      ...(body.urlId && { urlId: body.urlId }),
    }
    // If any of the following sensitive fields are present, require SUPERADMIN
    const sensitiveRequested =
      body.role !== undefined ||
      raw.storageQuotaMB !== undefined ||
      raw.grantStorageGB !== undefined ||
      raw.grantCustomDomains !== undefined ||
      raw.planProductId !== undefined ||
      raw.planSlug !== undefined

    if (sensitiveRequested) {
      const { response: saResp } = await requireSuperAdmin()
      if (saResp) return saResp
    }

    // allow admins/superadmins to set explicit storage quota (MB)
    if (raw.storageQuotaMB !== undefined) {
      updateData.storageQuotaMB = raw.storageQuotaMB === null ? null : Number(raw.storageQuotaMB)
    }

    // If admin requests to grant storage (in GB), create a one-off purchase record
    if (raw.grantStorageGB && Number(raw.grantStorageGB) > 0) {
      try {
        await prisma.oneOffPurchase.create({
          data: {
            userId: body.id,
            type: 'extra_storage',
            quantity: Math.max(1, Math.floor(Number(raw.grantStorageGB))),
            amountCents: 0,
            metadata: { adminGranted: true },
          },
        })
      } catch (err) {
        logger.error('Failed creating one-off extra storage', err as Error)
      }
    }

    // If admin grants custom domain slots, create a one-off purchase record
    if (raw.grantCustomDomains && Number(raw.grantCustomDomains) > 0) {
      try {
        await prisma.oneOffPurchase.create({
          data: {
            userId: body.id,
            type: 'custom_domain',
            quantity: Math.max(1, Math.floor(Number(raw.grantCustomDomains))),
            amountCents: 0,
            metadata: { adminGranted: true },
          },
        })
      } catch (err) {
        logger.error('Failed creating one-off custom domain grant', err as Error)
      }
    }

    // Allow superadmins to change the user's plan by providing a product id or slug
    if (raw.planProductId || raw.planSlug) {
      try {
        const product = await prisma.product.findFirst({
          where: {
            OR: [
              raw.planProductId ? { stripeProductId: String(raw.planProductId) } : undefined,
              raw.planSlug ? { slug: String(raw.planSlug) } : undefined,
            ].filter(Boolean) as any,
          },
        })
        if (!product) {
          return apiError('Plan product not found', HTTP_STATUS.BAD_REQUEST)
        }

        // try to update an existing subscription or create a new one
        const existingSub = await prisma.subscription.findFirst({ where: { userId: body.id } })
        if (existingSub) {
          await prisma.subscription.update({ where: { id: existingSub.id }, data: { productId: product.id, status: 'active', stripeSubscriptionId: null } })
        } else {
          await prisma.subscription.create({ data: { userId: body.id, productId: product.id, status: 'active' } })
        }
      } catch (err) {
        logger.error('Failed to change user plan', err as Error)
        return apiError('Failed to change plan', HTTP_STATUS.INTERNAL_SERVER_ERROR)
      }
    }

    if (body.urlId && body.urlId !== existingUser.urlId) {
      try {
        const storageProvider = await getStorageProvider()
        const oldPath = `uploads/${existingUser.urlId}`
        const newPath = `uploads/${body.urlId}`
        await storageProvider.renameFolder(oldPath, newPath)

        const files = await prisma.file.findMany({
          where: { userId: body.id },
          select: { id: true, path: true, urlPath: true },
        })

        for (const file of files) {
          await prisma.file.update({
            where: { id: file.id },
            data: {
              path: file.path.replace(`${oldPath}/`, `${newPath}/`),
              urlPath: file.urlPath.replace(
                `/${existingUser.urlId}/`,
                `/${body.urlId}/`
              ),
            },
          })
        }
      } catch (error) {
        logger.error('Error renaming user folder', error as Error)
        return apiError(
          'Failed to rename user folder',
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
      }
    }

    const user = await prisma.user.update({
      where: { id: body.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        urlId: true,
        storageUsed: true,
        _count: {
          select: {
            files: true,
            shortenedUrls: true,
          },
        },
      },
    })

    return apiResponse<UserResponse>(user)
  } catch (error) {
    logger.error('Error updating user', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
