# add-api-route

Scaffold a new API route following Emberly's conventions.

## Pattern

```ts
// app/api/<path>/route.ts
import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth' // or requireAuth for user-level
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.api // pick the right logger namespace

export async function GET(req: Request) {
  try {
    const { response, session } = await requireAdmin(req) // or requireAuth
    if (response) return response

    // ... handler logic ...

    return apiResponse(data)
  } catch (error) {
    logger.error('Failed to ...', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
```

## Auth helpers

| Helper              | Use when                                       |
| ------------------- | ---------------------------------------------- |
| `requireAdmin(req)` | Admin panel routes — user must have ADMIN role |
| `requireAuth(req)`  | Authenticated user routes                      |
| `verifyApiKey(req)` | API key auth (programmatic access)             |

## Rules

- Always wrap in try/catch and return `apiError('Internal server error')` on unexpected failures.
- Never return raw S3 secrets or sensitive credentials.
- Validate and sanitise body input before using it in DB queries.
- Use `prisma` from `@/packages/lib/database/prisma`, never instantiate a new client.
