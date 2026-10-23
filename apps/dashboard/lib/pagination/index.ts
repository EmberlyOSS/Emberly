/**
 * Pagination utilities
 * Centralizes pagination logic (parsing, calculation, response formatting)
 */

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 100
const DEFAULT_PAGE = 1

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

/**
 * Parse pagination parameters from URLSearchParams or query object
 * Returns validated page and limit values
 *
 * @param params URLSearchParams from request.url or query object
 * @param defaultLimit Optional custom default limit (default: 24)
 * @param maxLimit Optional custom max limit (default: 100)
 */
export function parsePaginationParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  defaultLimit = DEFAULT_LIMIT,
  maxLimit = MAX_LIMIT
): PaginationParams {
  let page = DEFAULT_PAGE
  let limit = defaultLimit

  if (params instanceof URLSearchParams) {
    const pageStr = params.get('page')
    const limitStr = params.get('limit')

    if (pageStr) {
      const parsed = parseInt(pageStr, 10)
      page = Math.max(1, !isNaN(parsed) ? parsed : DEFAULT_PAGE)
    }

    if (limitStr) {
      const parsed = parseInt(limitStr, 10)
      limit = Math.max(1, Math.min(!isNaN(parsed) ? parsed : defaultLimit, maxLimit))
    }
  } else {
    const pageVal = params.page
    const limitVal = params.limit

    if (pageVal && typeof pageVal === 'string') {
      const parsed = parseInt(pageVal, 10)
      page = Math.max(1, !isNaN(parsed) ? parsed : DEFAULT_PAGE)
    }

    if (limitVal && typeof limitVal === 'string') {
      const parsed = parseInt(limitVal, 10)
      limit = Math.max(1, Math.min(!isNaN(parsed) ? parsed : defaultLimit, maxLimit))
    }
  }

  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Calculate skip value from page and limit
 * Used typically in Prisma queries with skip/take
 */
export function calculateSkip(page: number, limit: number): number {
  return Math.max(0, (page - 1) * limit)
}

/**
 * Calculate total number of pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit)
}

/**
 * Check if there is a next page
 */
export function hasNextPage(page: number, totalPages: number): boolean {
  return page < totalPages
}

/**
 * Check if there is a previous page
 */
export function hasPreviousPage(page: number): boolean {
  return page > 1
}

/**
 * Create a paginated response with metadata
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = calculateTotalPages(total, limit)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: hasNextPage(page, totalPages),
      hasPreviousPage: hasPreviousPage(page),
    },
  }
}

/**
 * Legacy response format for backwards compatibility
 * Some routes might return {items, page, limit, total} instead of {data, pagination}
 */
export function createLegacyPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
} {
  const totalPages = calculateTotalPages(total, limit)

  return {
    items,
    page,
    limit,
    total,
    totalPages,
    hasMore: hasNextPage(page, totalPages),
  }
}
