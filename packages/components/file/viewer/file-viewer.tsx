'use client'

import { FileViewerProvider } from './context'
import { FileViewerContent } from './file-viewer-content'
import type { FileViewerProps } from './types'

export function FileViewer({ file, verifiedPassword }: FileViewerProps) {
  return (
    <div className="flex items-center justify-center w-full px-3 sm:px-4">
      <FileViewerProvider file={file} verifiedPassword={verifiedPassword}>
        <div className="w-full min-w-0">
          <FileViewerContent />
        </div>
      </FileViewerProvider>
    </div>
  )
}
