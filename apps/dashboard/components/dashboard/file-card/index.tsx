'use client'

import { useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { FileType } from '@/types/components/file'
import { ExpiryAction } from '@/types/events'
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
  MoreHorizontal,
  ScanText,
  Share2,
  Timer,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

import { EmbedPreviewDialog } from '@/components/dashboard/file-card/embed-preview-dialog'
import { getFileIcon } from '@/components/dashboard/file-card/utils'
import { ExpiryModal } from '@/components/shared/expiry-modal'
import { Icons } from '@/components/shared/icons'
import { OcrDialog } from '@/components/shared/ocr-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { formatFileSize, getRelativeTime } from '@/lib/utils'
import { writeToClipboard } from '@/lib/utils/clipboard'
import { sanitizeUrl } from '@/lib/utils/url'

import { useToast } from '@/hooks/use-toast'

interface FileCardProps {
  file: FileType
  onDelete?: (id: string) => void
  enableRichEmbeds?: boolean
}

export function FileCard({
  file: initialFile,
  onDelete,
  enableRichEmbeds = true,
}: FileCardProps) {
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
  const [collaborators, setCollaborators] = useState<
    Array<{
      id: string
      role: string
      user: {
        id: string
        name: string | null
        urlId: string | null
        image: string | null
      }
    }>
  >([])
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
    } catch {
      /* ignore */
    } finally {
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
      toast({
        title: 'File shared',
        description: 'Collaborator has been added',
      })
    } catch (error) {
      toast({
        title: 'Failed to share file',
        description:
          error instanceof Error ? error.message : 'Please try again',
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
    writeToClipboard(`${window.location.origin}${safeUrl}/`)
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
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error)
      }
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
    } catch (error) {
      toast({
        title: 'Failed to update password',
        description: (error as Error).message || 'Please try again',
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
    <Card className="group relative overflow-hidden border-border/50 bg-background/80 shadow-sm transition-colors hover:border-border">
      <div className="relative">
        <Link href={sanitizeUrl(file.urlPath)} className="block" tabIndex={-1}>
          {isImage ? (
            <div className="relative aspect-square bg-muted/30">
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Icons.spinner className="h-8 w-8 animate-spin text-white" />
                    <span className="text-sm font-medium text-white">
                      Reading text…
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex aspect-square items-center justify-center bg-muted/30">
              {getFileIcon(file.mimeType, 'h-14 w-14 text-muted-foreground')}
            </div>
          )}
        </Link>

        {(file.password || file.visibility !== 'PUBLIC') && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md border border-border/50 bg-background/80 px-2 py-1 text-xs backdrop-blur-md">
            {file.password ? (
              <>
                <KeyRound className="h-3 w-3" />
                Protected
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" />
                Private
              </>
            )}
          </div>
        )}

        {file.expiresAt && (
          <div
            title={`Deleted ${format(new Date(file.expiresAt), 'PPP p')}`}
            className={`absolute right-2 top-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white ${
              isBefore(
                new Date(file.expiresAt),
                new Date(Date.now() + 24 * 60 * 60 * 1000)
              )
                ? 'bg-red-500/85'
                : 'bg-amber-500/85'
            }`}
          >
            <Timer className="h-3 w-3" />
            {formatDistanceToNow(new Date(file.expiresAt), { addSuffix: true })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 border-t border-border/40 py-2 pl-3 pr-1.5">
        <div className="min-w-0 flex-1">
          <Link
            href={sanitizeUrl(file.urlPath)}
            title={file.name}
            className="block truncate text-sm font-medium transition-colors hover:text-primary"
          >
            {file.name}
          </Link>
          <p
            className="truncate text-xs text-muted-foreground"
            title={new Date(file.uploadedAt).toLocaleString()}
          >
            {formatFileSize(file.size)} ·{' '}
            {getRelativeTime(new Date(file.uploadedAt))} · {file.views}{' '}
            {file.views === 1 ? 'view' : 'views'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleCopyLink}
          aria-label="Copy link"
          title="Copy link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label={`Actions for ${file.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <a href={`/api/files/${file.id}/download`} download={file.name}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenShareDialog}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsEmbedPreviewOpen(true)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview embed
            </DropdownMenuItem>
            {isImage && (
              <DropdownMenuItem
                onClick={handleFetchOcr}
                disabled={isLoadingOcr}
              >
                <ScanText className="mr-2 h-4 w-4" />
                Extract text
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsVisibilityDialogOpen(true)}>
              {file.visibility === 'PUBLIC' ? (
                <Globe className="mr-2 h-4 w-4" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Visibility
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              {file.password ? 'Change password' : 'Add password'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsExpiryModalOpen(true)}>
              <Timer className="mr-2 h-4 w-4" />
              {file.expiresAt ? 'Change expiry' : 'Set expiry'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {}
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
                placeholder="At least 8 characters, or empty to remove"
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

      {}
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

      {}
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
            <p className="text-sm text-muted-foreground truncate">
              {file.name}
            </p>
            {/* Add collaborator */}
            <div className="space-y-2">
              <Label>Add collaborator</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Email or username"
                  value={shareInput}
                  onChange={(e) => setShareInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleAddCollaborator()
                  }
                  className="flex-1"
                />
                <Select
                  value={shareRole}
                  onValueChange={(v) =>
                    setShareRole(v as 'EDITOR' | 'SUGGESTER')
                  }
                >
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
                <p className="text-sm text-muted-foreground py-2">
                  No collaborators yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {collaborators.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 py-1">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage
                          src={c.user.image ?? undefined}
                          alt={c.user.name ?? 'User'}
                        />
                        <AvatarFallback className="text-xs">
                          {(c.user.name ??
                            c.user.urlId ??
                            '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {c.user.name ?? c.user.urlId ?? 'Unknown'}
                        </p>
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
