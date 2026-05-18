import { NextResponse } from 'next/server'
import { prisma } from '@/packages/lib/database/prisma'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.api

type RepairAction = 'replace-hyphen' | 'replace-underscore' | 'remove-spaces'

interface RepairRequest {
  action: RepairAction
  confirm?: boolean
  dryRun?: boolean
}

interface RepairResult {
  userId: string
  email: string
  oldName: string
  newName: string
  status: 'success' | 'skipped' | 'error'
  reason?: string
}

/**
 * POST /api/admin/users/repair-usernames
 * 
 * Finds all users with spaces in their usernames and repairs them.
 * Supports three actions:
 * - 'replace-hyphen': Replace spaces with hyphens (e.g., "John Doe" → "John-Doe")
 * - 'replace-underscore': Replace spaces with underscores (e.g., "John Doe" → "John_Doe")
 * - 'remove-spaces': Remove spaces entirely (e.g., "John Doe" → "JohnDoe")
 * 
 * Query parameters:
 * - action: The repair action to perform
 * - dryRun: If true (default), only report what would be changed, don't persist
 * - confirm: If true with dryRun=false, actually persist the changes
 * 
 * Returns an array of repair results with details about each user processed.
 */
export async function POST(req: Request) {
  try {
    const { user: admin, response } = await requireAuth(req)
    if (response) return response

    // Only superadmins can repair usernames
    if (admin?.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Only superadmins can repair usernames' },
        { status: 403 }
      )
    }

    const { action = 'replace-hyphen', confirm = false, dryRun = !confirm } = (await req.json()) as RepairRequest

    if (!['replace-hyphen', 'replace-underscore', 'remove-spaces'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: replace-hyphen, replace-underscore, remove-spaces' },
        { status: 400 }
      )
    }

    // Find all users with spaces in their names
    const usersWithSpaces = await prisma.user.findMany({
      where: {
        name: {
          contains: ' ',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    if (usersWithSpaces.length === 0) {
      return NextResponse.json({
        message: 'No users found with spaces in their usernames',
        results: [],
        mode: 'scan',
      })
    }

    const results: RepairResult[] = []
    const processedNames = new Set<string>()

    // Process each user
    for (const user of usersWithSpaces) {
      let newName = user.name

      // Apply the repair action
      switch (action) {
        case 'replace-hyphen':
          newName = user.name.replace(/ /g, '-')
          break
        case 'replace-underscore':
          newName = user.name.replace(/ /g, '_')
          break
        case 'remove-spaces':
          newName = user.name.replace(/ /g, '')
          break
      }

      // Check for duplicate names
      if (processedNames.has(newName)) {
        results.push({
          userId: user.id,
          email: user.email,
          oldName: user.name,
          newName,
          status: 'skipped',
          reason: 'Would create a duplicate username in this repair batch',
        })
        continue
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          name: newName,
          id: { not: user.id },
        },
        select: { id: true, name: true },
      })

      if (existingUser) {
        results.push({
          userId: user.id,
          email: user.email,
          oldName: user.name,
          newName,
          status: 'skipped',
          reason: `Username already taken by another user (${existingUser.id})`,
        })
        continue
      }

      processedNames.add(newName)

      if (dryRun) {
        results.push({
          userId: user.id,
          email: user.email,
          oldName: user.name,
          newName,
          status: 'success',
        })
      } else {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { name: newName },
          })

          results.push({
            userId: user.id,
            email: user.email,
            oldName: user.name,
            newName,
            status: 'success',
          })

          logger.info(`[Admin] Repaired username: "${user.name}" → "${newName}" for user ${user.id}`)
        } catch (err) {
          results.push({
            userId: user.id,
            email: user.email,
            oldName: user.name,
            newName,
            status: 'error',
            reason: err instanceof Error ? err.message : 'Unknown error',
          })
          logger.error(`[Admin] Failed to repair username for user ${user.id}`, err)
        }
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length
    const skippedCount = results.filter((r) => r.status === 'skipped').length
    const errorCount = results.filter((r) => r.status === 'error').length

    return NextResponse.json({
      message: dryRun
        ? `DRY RUN: Would repair ${successCount} username(s), ${skippedCount} skipped, ${errorCount} error(s)`
        : `Repaired ${successCount} username(s), ${skippedCount} skipped, ${errorCount} error(s)`,
      mode: dryRun ? 'dry-run' : 'applied',
      action,
      summary: {
        total: usersWithSpaces.length,
        success: successCount,
        skipped: skippedCount,
        error: errorCount,
      },
      results,
    })
  } catch (err) {
    logger.error('[Admin] Username repair endpoint error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
