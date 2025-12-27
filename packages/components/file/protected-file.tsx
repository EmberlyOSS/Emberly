'use client'

import { useState } from 'react'

import { FileActions } from '@/packages/components/file/file-actions'
import { AuthGuard } from '@/packages/components/file/protected/auth-guard'
import {
  CODE_FILE_TYPES,
  TEXT_FILE_TYPES,
} from '@/packages/components/file/protected/mime-types'
import { FileViewer } from '@/packages/components/file/viewer'

import { sanitizeUrl } from '@/packages/lib/utils/url'

interface ProtectedFileProps {
  file: {
    id: string
    name: string
    urlPath: string
    visibility: 'PUBLIC' | 'PRIVATE'
    password: string | null
    userId: string
    mimeType: string
  }
  verifiedPassword?: string
}

export function ProtectedFile({
  file,
  verifiedPassword: initialVerifiedPassword,
}: ProtectedFileProps) {
  const [codeContent] = useState<string>()

  const isTextBased = Boolean(
    CODE_FILE_TYPES[file.mimeType] ||
    TEXT_FILE_TYPES.includes(file.mimeType) ||
    file.mimeType === 'text/csv'
  )

  return (
    <AuthGuard file={file}>
      {(authGuardVerifiedPassword) => {
        const currentVerifiedPassword =
          authGuardVerifiedPassword || initialVerifiedPassword
        return (
          <div className="space-y-4">
            { }
            <FileViewer
              file={file}
              verifiedPassword={currentVerifiedPassword}
            />

            { }
            <div className="flex items-center justify-center px-3 sm:px-6 pb-4">
              <FileActions
                urlPath={sanitizeUrl(file.urlPath)}
                name={file.name}
                verifiedPassword={currentVerifiedPassword}
                showOcr={file.mimeType.startsWith('image/')}
                isTextBased={isTextBased}
                content={codeContent}
                fileId={file.id}
                fileUserId={file.userId}
                mimeType={file.mimeType}
              />
            </div>
          </div>
        )
      }}
    </AuthGuard>
  )
}
