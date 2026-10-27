interface StorageErrorShape {
  name?: string
  code?: string
  Code?: string
  message?: string
  $fault?: string
  $metadata?: { httpStatusCode?: number; requestId?: string }
}

/** The parts of a storage error worth logging, without dumping the whole SDK object. */
export function describeStorageError(error: unknown) {
  const e = (error ?? {}) as StorageErrorShape
  const status = e.$metadata?.httpStatusCode
  return {
    code: e.Code ?? e.code ?? e.name,
    status,
    requestId: e.$metadata?.requestId,
    message: e.message,
    // S3 answers 403 rather than 404 for a missing object when the key can't list the bucket,
    // and HEAD responses carry no body, so the SDK can only report "UnknownError"
    hint:
      status === 403
        ? 'Access denied: the object may be missing, or the storage key may lack read access to it'
        : undefined,
  }
}

export function isStorageNotFound(error: unknown) {
  const { code, status } = describeStorageError(error)
  return (
    status === 404 ||
    code === 'NoSuchKey' ||
    code === 'NotFound' ||
    code === 'ENOENT' ||
    (error instanceof Error && error.message.includes('NoSuchKey'))
  )
}
