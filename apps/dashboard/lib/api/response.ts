import { NextResponse } from 'next/server'

import {
  ApiErrorResponse,
  ApiResponse,
  PaginatedApiResponse,
  PaginationMeta,
} from '@/types/dto/api-responses'

export function apiResponse<T>(
  data: T,
  status: number = HTTP_STATUS.OK
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data,
      success: true,
    },
    { status }
  )
}

export function paginatedResponse<T>(
  data: T,
  pagination: PaginationMeta
): NextResponse<PaginatedApiResponse<T>> {
  return NextResponse.json({
    data,
    pagination,
    success: true,
  })
}

export function apiError(
  message: string,
  status: number = 400
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      success: false,
    },
    { status }
  )
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
}
