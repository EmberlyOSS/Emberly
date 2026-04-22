const INTERNAL_API_SECRET_HEADER = 'x-internal-api-secret'

function getInternalApiSecret() {
  return process.env.INTERNAL_API_SECRET?.trim() || ''
}

export function getInternalApiSecretHeader() {
  return INTERNAL_API_SECRET_HEADER
}

export function getInternalApiHeaders(): HeadersInit {
  const secret = getInternalApiSecret()
  return secret ? { [INTERNAL_API_SECRET_HEADER]: secret } : {}
}

export function hasValidInternalApiSecret(request: Request) {
  const expectedSecret = getInternalApiSecret()
  if (!expectedSecret) {
    return false
  }

  return request.headers.get(INTERNAL_API_SECRET_HEADER) === expectedSecret
}

export function internalApiSecretConfigured() {
  return Boolean(getInternalApiSecret())
}
