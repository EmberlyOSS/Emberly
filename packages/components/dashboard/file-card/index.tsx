'use client'

import { useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { FileType } from '@/packages/types/components/file'
import { ExpiryAction } from '@/packages/types/events'
import { format, formatDistanceToNow, isBefore } from 'date-fns'
import {
  Clock,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
  KeyRound,
  Link as LinkIcon,
  Lock,
  ScanText,
  Share2,
  Timer,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

import { EmbedPreviewDialog } from '@/packages/components/dashboard/file-card/embed-preview-dialog'
import { getFileIcon } from '@/packages/components/dashboard/file-card/utils'
import { ExpiryModal } from '@/packages/components/shared/expiry-modal'
import { Icons } from '@/packages/components/shared/icons'
import { OcrDialog } from '@/packages/components/shared/ocr-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Card } from '@/packages/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/packages/components/ui/dialog'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/packages/components/ui/radio-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/packages/components/ui/tooltip'

import { formatFileSize, getRelativeTime } from '@/packages/lib/utils'
import { writeToClipboard } from '@/packages/lib/utils/clipboard'
import { sanitizeUrl } from '@/packages/lib/utils/url'

import { useToast } from '@/packages/hooks/use-toast'

interface FileCardProps {
  file: FileType
  onDelete?: (id: string) => void
  enableRichEmbeds?: boolean
}

export function FileCard({ file: initialFile, onDelete, enableRichEmbeds = true }: FileCardProps) {
  const { toast } = useToast()
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isVisibilityDialogOpen, setIsVisibilityDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEmbedPreviewOpen, setIsEmbedPreviewOpen] = useState(false)
  const [password, setPassword] = useState(initialFile.password || '')
  const [file, setFile] = useState(initialFile)
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(
    file.visibility
  )
  const [isDeleted, setIsDeleted] = useState(false)
  const [isLoadingOcr, setIsLoadingOcr] = useState(false)
  const [ocrText, setOcrText] = useState<string | null>(null)
  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null)
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [collaborators, setCollaborators] = useState<Array<{
    id: string
    role: string
    user: { id: string; name: string | null; urlId: string | null; image: string | null }
  }>>([])
  const [shareInput, setShareInput] = useState('')
  const [shareRole, setShareRole] = useState<'EDITOR' | 'SUGGESTER'>('EDITOR')
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false)
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false)

  const fetchCollaborators = async () => {
    setIsLoadingCollaborators(true)
    try {
      const response = await fetch(`/api/files/${file.id}/collaborators`)
      if (response.ok) {
        const data = await response.json()
        setCollaborators(data.data ?? [])
      }
    } catch { /* ignore */ } finally {
      setIsLoadingCollaborators(false)
    }
  }

  const handleOpenShareDialog = () => {
    setIsShareDialogOpen(true)
    fetchCollaborators()
  }

  const handleAddCollaborator = async () => {
    if (!shareInput.trim()) return
    setIsAddingCollaborator(true)
    try {
      const response = await fetch(`/api/files/${file.id}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: shareInput.trim(), role: shareRole }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to share file')
      }
      setShareInput('')
      await fetchCollaborators()
      toast({ title: 'File shared', description: 'Collaborator has been added' })
    } catch (error) {
      toast({
        title: 'Failed to share file',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsAddingCollaborator(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const response = await fetch(
        `/api/files/${file.id}/collaborators?collaboratorId=${collaboratorId}`,
        { method: 'DELETE' }
      )
      if (!response.ok) throw new Error()
      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId))
      toast({ title: 'Collaborator removed' })
    } catch {
      toast({ title: 'Failed to remove collaborator', variant: 'destructive' })
    }
  }

  const handleCopyLink = () => {
    const safeUrl = sanitizeUrl(file.urlPath)
    writeToClipboard(`${window.location.origin}${safeUrl}`)
      .then(() => {
        toast({
          title: 'Link copied',
          description: 'File link has been copied to clipboard',
        })
      })
      .catch(() => {
        toast({
          title: 'Failed to copy link',
          description: 'Please copy the link manually',
          variant: 'destructive',
        })
      })
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error()

      setIsDeleted(true)

      if (onDelete) {
        onDelete(file.id)
      }

      toast({
        title: 'File deleted',
        description: 'The file has been permanently deleted',
      })
    } catch {
      toast({
        title: 'Failed to delete file',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  if (isDeleted) {
    return null
  }

  const handlePasswordUpdate = async () => {
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password || null }),
      })
      if (!response.ok) throw new Error()
      toast({
        title: password
          ? 'Password protection enabled'
          : 'Password protection disabled',
        description: password
          ? 'File is now password protected'
          : 'Password protection has been removed',
      })
      setIsPasswordDialogOpen(false)
      setFile((prev) => ({ ...prev, password: password || null }))
    } catch {
      toast({
        title: 'Failed to update password',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  const handleVisibilityUpdate = async () => {
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ visibility }),
      })
      if (!response.ok) throw new Error()
      toast({
        title: 'Visibility updated',
        description: 'File visibility has been updated',
      })
      setIsVisibilityDialogOpen(false)
      setFile((prev) => ({ ...prev, visibility }))
    } catch {
      toast({
        title: 'Failed to update visibility',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  const handleFetchOcr = async () => {
    setIsLoadingOcr(true)
    setOcrError(null)
    try {
      const response = await fetch(`/api/files/${file.id}/ocr`, {
        method: 'GET',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process OCR')
      }

      const data = await response.json()

      if (!data.success) {
        setOcrError(data.error || 'There was an error processing the image')
        setOcrText(null)
        setOcrConfidence(null)
      } else {
        setOcrText(data.text)
        setOcrConfidence(data.confidence)
        setOcrError(null)
      }
      setIsOcrDialogOpen(true)
    } catch (error) {
      toast({
        title: 'Failed to extract text',
        description:
          error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingOcr(false)
    }
  }

  const handleExpiryUpdate = async (
    expiresAt: Date | null,
    action?: ExpiryAction
  ) => {
    try {
      if (expiresAt) {
        const response = await fetch(`/api/files/${file.id}/expiry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            expiresAt: expiresAt.toISOString(),
            action: action || ExpiryAction.DELETE,
          }),
        })

        if (!response.ok) throw new Error()

        toast({
          title: 'Expiration set',
          description: 'File expiration has been updated successfully',
        })
      } else {
        const response = await fetch(`/api/files/${file.id}/expiry`, {
          method: 'DELETE',
        })

        if (!response.ok) throw new Error()

        toast({
          title: 'Expiration removed',
          description: 'File expiration has been removed',
        })
      }

      setFile((prev) => ({
        ...prev,
        expiresAt: expiresAt?.toISOString() || null,
      }))
    } catch {
      toast({
        title: 'Failed to update expiration',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  const isImage = file.mimeType.startsWith('image/')

  return (
    <Card className="group relative overflow-hidden bg-background/80 backdrop-blur-lg border-border/50 shadow-sm hover:shadow-md hover:bg-background/90 hover:border-border/50 transition-all duration-300">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/10 via-transparent to-transparent pointer-events-none" />

      {/* Thumbnail section */}
      <div className="relative">
        <Link href={sanitizeUrl(file.urlPath)} className="block">
          {isImage ? (
            <div className="relative aspect-square">
              <Image
                src={`/api/files/${file.id}/thumbnail`}
                alt={file.name}
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                priority={false}
                loading="lazy"
              />
              {isLoadingOcr && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Icons.spinner className="h-8 w-8 animate-spin text-white" />
                    <span className="text-sm text-white font-medium">
                      Processing OCR...
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative aspect-square bg-muted/30 flex items-center justify-center">
              {getFileIcon(file.mimeType, 'h-16 w-16 text-muted-foreground')}
            </div>
          )}
        </Link>

        {/* Action overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20 opacity-0 ${!isLoadingOcr && 'group-hover:opacity-100'} transition-all duration-300 flex flex-col items-center justify-center gap-3`}
        >
          {/* View button */}
          <Button variant="secondary" className="bg-white/15 hover:bg-white/25 backdrop-blur-md border-border/50 text-white" size="sm" asChild>
            <Link href={sanitizeUrl(file.urlPath)}>View</Link>
          </Button>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-1 px-2">
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/15 hover:bg-white/25 backdrop-blur-md border-border/50 text-white"
                    onClick={handleCopyLink}
                    aria-label="Copy link"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy link</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/15 hover:bg-white/25 backdrop-blur-md border-border/50 text-white"
                    asChild
                    aria-label={`Download ${file.name}`}
                  >
                    <a
                      href={`/api/files/${file.id}/download`}
                      download={file.name}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/15 hover:bg-white/25 backdrop-blur-md border-border/50 text-white"
                    onClick={() => setIsVisibilityDialogOpen(true)}
                    aria-label="Change visibility"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Change visibility</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/15 hover:bg-white/25 backdrop-blur-md border-border/50 text-white"
                    onClick={() => setIsPasswordDialogOpen(true)}
                    aria-label="Password protect"
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Password protect</TooltipContent>
              </Tooltip>
              {isImage && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/15 hover:bg-white/25 backdrop-blur-md border-border/50 text-white"
                      onClick={handleFetchOcr}
                      disabled={isLoadingOcr}
                      aria-label="Extract text (OCR)"
                    >
                      <ScanText className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Extract text (OCR)</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/15 hover:bg-white/25 backdrop-blur-md border-border/50 text-white"
                    onClick={() => setIsExpiryModalOpen(true)}
                    aria-label="Manage expiration"
                  >
                    <Timer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Manage expiration</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/15 hover:bg-white/25 backdrop-blur-md border-border/50 text-white"
                    onClick={() => setIsEmbedPreviewOpen(true)}
                    aria-label="Embed preview"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Embed preview</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/15 hover:bg-white/25 backdrop-blur-md border-border/50 text-white"
                    onClick={handleOpenShareDialog}
                    aria-label="Share file"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/15 hover:bg-white/25 backdrop-blur-md border-border/50 text-white"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    aria-label="Delete file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Visibility badge */}
        <div className="absolute bottom-2 left-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-xs backdrop-blur-md border border-border/50">
            {file.password ? (
              <>
                <KeyRound className="h-3 w-3" />
                Protected
              </>
            ) : file.visibility === 'PUBLIC' ? (
              <>
                <Globe className="h-3 w-3" />
                Public
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" />
                Private
              </>
            )}
          </div>
        </div>

        {/* Expiry badge */}
        {file.expiresAt && (
          <div className="absolute top-2 right-2">
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-md backdrop-blur-md text-xs border ${isBefore(
                      new Date(file.expiresAt),
                      new Date(Date.now() + 24 * 60 * 60 * 1000)
                    )
                      ? 'bg-red-500/80 border-red-400/50 text-white'
                      : isBefore(
                        new Date(file.expiresAt),
                        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      )
                        ? 'bg-orange-500/80 border-orange-400/50 text-white'
                        : 'bg-amber-500/80 border-amber-400/50 text-white'
                      }`}
                  >
                    <Timer className="h-3 w-3" />
                    {formatDistanceToNow(new Date(file.expiresAt), {
                      addSuffix: true,
                    })}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" sideOffset={8}>
                  <div className="text-center">
                    <p className="font-medium">Auto-delete scheduled</p>
                    <p>{format(new Date(file.expiresAt), 'PPP p')}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Timestamp badge */}
        <div className="absolute bottom-2 right-2">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-xs backdrop-blur-md border border-border/50">
                  <Clock className="h-3 w-3" />
                  {getRelativeTime(new Date(file.uploadedAt))}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="end" sideOffset={8}>
                {new Date(file.uploadedAt).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* File info section */}
      <div className="p-3 relative border-t border-border/20">
        <div className="flex items-center justify-between gap-2">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={sanitizeUrl(file.urlPath)}
                  className="font-medium hover:text-primary truncate block text-sm transition-colors"
                >
                  {file.name}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                {file.name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatFileSize(file.size)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center space-x-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{file.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            <span>{file.downloads}</span>
          </div>
        </div>
      </div>

      { }
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Protection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty to remove protection"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handlePasswordUpdate}>
                {password ? 'Enable Protection' : 'Remove Protection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      { }
      <Dialog
        open={isVisibilityDialogOpen}
        onOpenChange={setIsVisibilityDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Visibility</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <RadioGroup
              value={visibility}
              onValueChange={(value) =>
                setVisibility(value as 'PUBLIC' | 'PRIVATE')
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PUBLIC" id="public" />
                <Label htmlFor="public" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Public
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PRIVATE" id="private" />
                <Label htmlFor="private" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Private
                </Label>
              </div>
            </RadioGroup>
            <div className="text-sm text-muted-foreground mt-2">
              {visibility === 'PUBLIC'
                ? 'Public files can be accessed by anyone with the link.'
                : 'Private files require authentication to access.'}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsVisibilityDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleVisibilityUpdate}>
                Update Visibility
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      { }
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p>
              Are you sure you want to delete this file? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  handleDelete()
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* OCR Dialog */}
      <OcrDialog
        isOpen={isOcrDialogOpen}
        onOpenChange={setIsOcrDialogOpen}
        text={ocrText}
        error={ocrError}
        confidence={ocrConfidence}
        filename={file.name}
      />

      {/* Expiry Modal */}
      <ExpiryModal
        isOpen={isExpiryModalOpen}
        onOpenChange={setIsExpiryModalOpen}
        onConfirm={handleExpiryUpdate}
        initialDate={file.expiresAt ? new Date(file.expiresAt) : null}
        title="Manage File Expiration"
        description="Set when this file should be automatically deleted"
      />

      {/* Embed Preview Dialog */}
      <EmbedPreviewDialog
        isOpen={isEmbedPreviewOpen}
        onOpenChange={setIsEmbedPreviewOpen}
        file={file}
        enableRichEmbeds={enableRichEmbeds}
      />

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share File
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground truncate">{file.name}</p>
            {/* Add collaborator */}
            <div className="space-y-2">
              <Label>Add collaborator</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Email or username"
                  value={shareInput}
                  onChange={(e) => setShareInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCollaborator()}
                  className="flex-1"
                />
                <Select value={shareRole} onValueChange={(v) => setShareRole(v as 'EDITOR' | 'SUGGESTER')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                    <SelectItem value="SUGGESTER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  onClick={handleAddCollaborator}
                  disabled={!shareInput.trim() || isAddingCollaborator}
                  aria-label="Add collaborator"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Collaborators list */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Collaborators
              </Label>
              {isLoadingCollaborators ? (
                <p className="text-sm text-muted-foreground py-2">Loading...</p>
              ) : collaborators.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No collaborators yet.</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {collaborators.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 py-1">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={c.user.image ?? undefined} alt={c.user.name ?? 'User'} />
                        <AvatarFallback className="text-xs">
                          {(c.user.name ?? c.user.urlId ?? '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.user.name ?? c.user.urlId ?? 'Unknown'}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {c.role === 'EDITOR' ? 'Editor' : 'Viewer'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveCollaborator(c.id)}
                        aria-label="Remove collaborator"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
