/**
 * Centralized Error Handling
 * 
 * Provides consistent error handling patterns across all API routes
 * Logs errors consistently and returns standardized error responses
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { loggers } from '@/packages/lib/logger'
import { HTTP_STATUS } from '@/packages/lib/api/response'

const logger = loggers.api

export interface ApiErrorOptions {
  loggerName?: string
  context?: Record<string, any>
  statusCode?: number
  details?: boolean
}

/**
 * Handle different error types and return appropriate responses
 * Covers: Zod validation, database errors, auth errors, generic errors
 */
export function handleApiError(
  error: unknown,
  message: string,
  options: ApiErrorOptions = {}
): NextResponse {
  const {
    loggerName,
    context = {},
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details = false,
  } = options

  const log = loggerName ? logger.getChildLogger(loggerName) : logger

  // Zod validation error
  if (error instanceof ZodError) {
    const validationError = error.errors[0]
    const errorMessage = validationError?.message || 'Validation failed'

    log.warn(`Validation error: ${message}`, {
      ...context,
      validationError: validationError,
      issues: details ? error.errors : undefined,
    })

    return NextResponse.json(
      {
        error: 'Validation failed',
        message: errorMessage,
        ...(details && { issues: error.errors }),
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    )
  }

  // Error object
  if (error instanceof Error) {
    log.error(`${message}`, error, context)

    return NextResponse.json(
      {
        error: message,
        ...(details && { details: error.message }),
      },
      { status: statusCode }
    )
  }

  // Unknown error
  log.error(`Unknown error: ${message}`, error, context)
  return NextResponse.json(
    { error: message },
    { status: statusCode }
  )
}

/**
 * Safely execute an async handler with error handling
 * Wraps try/catch logic with consistent logging
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  message: string,
  options: ApiErrorOptions = {}
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    const log = options.loggerName ? logger.getChildLogger(options.loggerName) : logger

    if (error instanceof Error) {
      log.error(message, error, options.context || {})
    } else {
      log.error(message, error, options.context || {})
    }

    return null
  }
}

/**
 * Common error messages (standardized across codebase)
 */
export const ERROR_MESSAGES = {
  // Auth
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'You do not have permission to perform this action',
  INVALID_CREDENTIALS: 'Invalid email or password',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again',
  ACCOUNT_NOT_FOUND: 'Account not found',
  ACCOUNT_ALREADY_EXISTS: 'An account with this email already exists',

  // Validation
  VALIDATION_FAILED: 'Validation failed',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_REQUEST: 'Invalid request',

  // Database
  DATABASE_ERROR: 'Database error',
  RECORD_NOT_FOUND: 'Record not found',
  DUPLICATE_RECORD: 'This record already exists',

  // File operations
  FILE_NOT_FOUND: 'File not found',
  FILE_UPLOAD_FAILED: 'File upload failed',
  FILE_TOO_LARGE: 'File is too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  STORAGE_QUOTA_EXCEEDED: 'Storage quota exceeded',

  // Domain operations
  DOMAIN_NOT_FOUND: 'Domain not found',
  DOMAIN_NOT_VERIFIED: 'Domain not verified',
  DOMAIN_ALREADY_EXISTS: 'This domain is already in use',

  // Email operations
  EMAIL_SEND_FAILED: 'Failed to send email',
  EMAIL_ALREADY_IN_USE: 'This email is already in use',
  EMAIL_NOT_VERIFIED: 'Please verify your email address',

  // General
  INTERNAL_SERVER_ERROR: 'An error occurred. Please try again later',
  NOT_IMPLEMENTED: 'This feature is not yet implemented',
  RATE_LIMITED: 'Too many requests. Please try again later',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
}

/**
 * Create a standardized error response with context
 */
export function createErrorResponse(
  errorType: keyof typeof ERROR_MESSAGES,
  statusCode: number = HTTP_STATUS.BAD_REQUEST,
  additionalData?: Record<string, any>
): {
  error: string
  message: string
  [key: string]: any
} {
  return {
    error: errorType,
    message: ERROR_MESSAGES[errorType],
    ...additionalData,
  }
}
