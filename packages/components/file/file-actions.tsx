'use client'

import { useCallback, useEffect, useState } from 'react'

import DOMPurify from 'dompurify'
import { Copy, Download, ExternalLink, Flag, Link, Pencil, ScanText, Send } from 'lucide-react'
import NextLink from 'next/link'
import { useSession } from 'next-auth/react'

import { CollaboratorManager } from '@/packages/components/file/collaborator-manager'
import { SuggestionManager } from '@/packages/components/file/suggestion-manager'
import { OcrDialog } from '@/packages/components/shared/ocr-dialog'
import { ReportContentDialog } from '@/packages/components/shared/report-content-dialog'
import { Button } from '@/packages/components/ui/button'

import { writeToClipboard } from '@/packages/lib/utils/clipboard'

import { useFileActions } from '@/packages/hooks/use-file-actions'
import { useToast } from '@/packages/hooks/use-toast'

interface FileActionsProps {
  urlPath: string
  name: string
  mimeType?: string
  verifiedPassword?: string
  showOcr?: boolean
  isTextBased?: boolean
  content?: string
  fileId?: string
  fileUserId?: string
  allowSuggestions?: boolean
}

interface CollaboratorInfo {
  role: 'EDITOR' | 'SUGGESTER' | null
  allowSuggestions: boolean
}

export function FileActions({
  urlPath,
  name,
  mimeType,
  verifiedPassword,
  showOcr = false,
  isTextBased = false,
  content,
  fileId,
  fileUserId,
  allowSuggestions: initialAllowSuggestions = false,
}: FileActionsProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false)
  const [ocrText, setOcrText] = useState<string | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [isLoadingOcr, setIsLoadingOcr] = useState(false)
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null)
  const [urls, setUrls] = useState<{ fileUrl: string; rawUrl: string }>()
  const [collaboratorInfo, setCollaboratorInfo] = useState<CollaboratorInfo>({
    role: null,
    allowSuggestions: initialAllowSuggestions,
  })

  const isOwner = session?.user?.id === fileUserId
  const isEditor = collaboratorInfo.role === 'EDITOR'
  const isSuggester = collaboratorInfo.role === 'SUGGESTER'
  const canEditDirectly = (isOwner || isEditor) && isTextBased && fileId
  const canSuggest = !isOwner && (isSuggester || collaboratorInfo.allowSuggestions) && isTextBased && fileId

  const isMarkdown = mimeType === 'text/markdown' ||
    mimeType === 'text/x-markdown' ||
    name.endsWith('.md') ||
    name.endsWith('.markdown')

  const { copyUrl, download, openRaw } = useFileActions({
    urlPath,
    name,
    fileId,
    verifiedPassword,
  })

  const sanitizeUrl = (url: string): string => {
    return DOMPurify.sanitize(url)
  }

  // Initialize URLs - this was missing and caused urls to always be undefined
  useEffect(() => {
    const passwordParam = verifiedPassword
      ? `?password=${encodeURIComponent(DOMPurify.sanitize(verifiedPassword))}`
      : ''
    const sanitizedUrlPath = DOMPurify.sanitize(urlPath)
    const fileUrl = `/api/files${sanitizedUrlPath}${passwordParam}`
    const rawUrl = `${sanitizedUrlPath}/raw${passwordParam}`
    setUrls({ fileUrl, rawUrl })
  }, [urlPath, verifiedPassword])

  // Fetch collaborator info for current user
  const fetchCollaboratorInfo = useCallback(async () => {
    if (!fileId || !session?.user || isOwner) return

    try {
      // Check if user is a collaborator by trying to access the file's collaboration status
      const res = await fetch(`/api/files/${fileId}/collaborators/me`)
      if (res.ok) {
        const data = await res.json()
        setCollaboratorInfo({
          role: data.role || null,
          allowSuggestions: data.allowSuggestions || false,
        })
      }
    } catch {
      // Silent fail - user might not be a collaborator
    }
  }, [fileId, session?.user, isOwner])

  useEffect(() => {
    fetchCollaboratorInfo()
  }, [fetchCollaboratorInfo])

  const handleCopyText = async () => {
    if (!urls) return
    try {
      if (content) {
        await writeToClipboard(content)
        toast({
          title: 'Text copied',
          description: 'File content has been copied to clipboard',
        })
      } else {
        const response = await fetch(sanitizeUrl(urls.fileUrl))
        const text = await response.text()
        await writeToClipboard(text)
        toast({
          title: 'Text copied',
          description: 'File content has been copied to clipboard',
        })
      }
    } catch {
      toast({
        title: 'Failed to copy text',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  const handleOcr = async () => {
    if (!fileId) {
      toast({
        title: 'Error',
        description: 'File ID is required for OCR',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoadingOcr(true)
      setOcrError(null)
      console.log('[OCR] Starting OCR request for file:', fileId)
      const sanitizedFileId = DOMPurify.sanitize(fileId)
      const passwordParam = verifiedPassword
        ? `?password=${DOMPurify.sanitize(verifiedPassword)}`
        : ''
      const ocrUrl = `/api/files/${sanitizedFileId}/ocr${passwordParam}`

      const response = await fetch(sanitizeUrl(ocrUrl))
      console.log('[OCR] Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[OCR] Error response:', errorData)
        throw new Error(errorData.error || 'Failed to process OCR')
      }

      const data = await response.json()
      console.log('[OCR] Response data:', data)

      if (!data.success) {
        console.error('[OCR] OCR processing failed:', data.error)
        setOcrError(data.error || 'There was an error processing the image')
        setOcrText(null)
        setOcrConfidence(null)
      } else {
        console.log('[OCR] OCR processing successful')
        setOcrText(data.text)
        setOcrConfidence(data.confidence)
        setOcrError(null)
      }
      setIsOcrDialogOpen(true)
    } catch (error) {
      console.error('[OCR] Error in handleFetchOcr:', error)
      toast({
        title: 'Failed to fetch OCR text',
        description:
          error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingOcr(false)
    }
  }

  if (!urls) return null

  return (
    <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={copyUrl}
        className="glass-subtle glass-hover rounded-xl px-2.5 sm:px-3"
      >
        <Link className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Copy URL</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={download}
        className="glass-subtle glass-hover rounded-xl px-2.5 sm:px-3"
      >
        <Download className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Download</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={openRaw}
        className="glass-subtle glass-hover rounded-xl px-2.5 sm:px-3"
      >
        <ExternalLink className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Raw</span>
      </Button>
      {showOcr && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleOcr}
          disabled={isLoadingOcr}
          className="glass-subtle glass-hover rounded-xl px-2.5 sm:px-3"
        >
          <ScanText className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">OCR</span>
        </Button>
      )}
      {isTextBased && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyText}
          className="glass-subtle glass-hover rounded-xl px-2.5 sm:px-3"
        >
          <Copy className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Copy</span>
        </Button>
      )}
      {canEditDirectly && (
        <Button
          variant="outline"
          size="sm"
          asChild
          className="glass-subtle glass-hover rounded-xl px-2.5 sm:px-3"
        >
          <NextLink href={`/dashboard/paste/${fileId}/edit`}>
            <Pencil className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </NextLink>
        </Button>
      )}
      {canSuggest && (
        <Button
          variant="outline"
          size="sm"
          asChild
          className="glass-subtle glass-hover rounded-xl px-2.5 sm:px-3"
        >
          <NextLink href={`/dashboard/paste/${fileId}/suggest`}>
            <Send className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Suggest Edit</span>
          </NextLink>
        </Button>
      )}

      {/* Owner-only collaboration management */}
      {isOwner && isTextBased && fileId && (
        <>
          <CollaboratorManager fileId={fileId} isOwner={isOwner} />
          <SuggestionManager fileId={fileId} isOwner={isOwner} isMarkdown={isMarkdown} />
        </>
      )}

      {/* Report button for non-owners */}
      {!isOwner && session?.user && fileId && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsReportOpen(true)}
          className="glass-subtle glass-hover rounded-xl px-2.5 sm:px-3 text-destructive hover:text-destructive"
        >
          <Flag className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Report</span>
        </Button>
      )}

      <OcrDialog
        isOpen={isOcrDialogOpen}
        onOpenChange={setIsOcrDialogOpen}
        isLoading={isLoadingOcr}
        error={ocrError}
        text={ocrText}
        confidence={ocrConfidence}
      />

      {!isOwner && fileId && (
        <ReportContentDialog
          contentType="FILE"
          contentId={fileId}
          contentName={name}
          open={isReportOpen}
          onOpenChange={setIsReportOpen}
        />
      )}
    </div>
  )
}
