'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

import Image from 'next/image'

import {
  Archive,
  Ban,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  EyeOff,
  ExternalLink,
  File,
  FileText,
  Flag,
  FolderOpen,
  Image as ImageIcon,
  Link2,
  Lock,
  MoreVertical,
  Music,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  UserX,
  Video,
  Zap,
} from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/packages/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/packages/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/packages/components/ui/dropdown-menu'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Progress } from '@/packages/components/ui/progress'
import { Textarea } from '@/packages/components/ui/textarea'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/packages/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { Skeleton } from '@/packages/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/packages/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/packages/components/ui/tooltip'

import { formatFileSize } from '@/packages/lib/utils'
import { cn } from '@/packages/lib/utils'
import { sanitizeUrl } from '@/packages/lib/utils/url'

import { useToast } from '@/packages/hooks/use-toast'
import { UserFormData, useUserManagement } from '@/packages/hooks/use-user-management'

interface User {
  id: string
  name: string
  email: string
  image: string | null
  role: 'SUPERADMIN' | 'ADMIN' | 'USER'
  urlId: string
  storageUsed: number
  storageQuotaMB: number | null
  isVerified: boolean
  bannedAt: string | null
  banReason: string | null
  banType: string | null
  banExpiresAt: string | null
  subscriptions: Array<{
    status: string
    product: {
      name: string
      slug: string
      storageQuotaGB: number | null
      uploadSizeCapMB: number | null
      customDomainsLimit: number | null
    }
  }>
  _count: {
    files: number
    shortenedUrls: number
  }
}

interface File {
  id: string
  name: string
  mimeType: string
  size: number
  visibility: 'PUBLIC' | 'PRIVATE'
  password?: string | null
  uploadedAt: string
  urlPath: string
  flagged?: boolean
  flagReason?: string | null
}

interface ShortenedUrl {
  id: string
  shortCode: string
  targetUrl: string
  clicks: number
  createdAt: string
  flagged?: boolean
  flagReason?: string | null
}

interface PaginationData {
  total: number
  pages: number
  page: number
  limit: number
}

interface FileFilters {
  search: string
  visibility: 'PUBLIC' | 'PRIVATE' | null
  type: string
}

interface FileResponse {
  files: File[]
  pagination: PaginationData
}

interface UrlResponse {
  urls: ShortenedUrl[]
  pagination: PaginationData
}

function UserTableSkeleton() {
  return (
    <div className="glass-subtle overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>URL ID</TableHead>
            <TableHead>Files</TableHead>
            <TableHead>Storage</TableHead>
            <TableHead>URLs</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i} className="border-border/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[120px]" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[70px] rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[60px] rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[50px] rounded" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[40px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[80px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[40px]" />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function getPaginationRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  let start = Math.max(currentPage - Math.floor(maxVisible / 2), 1)
  let end = start + maxVisible - 1

  if (end > totalPages) {
    end = totalPages
    start = Math.max(end - maxVisible + 1, 1)
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

interface FileSettingsDialogProps {
  file: File | null
  isOpen: boolean
  onClose: () => void
  onSave: (visibility: 'PUBLIC' | 'PRIVATE', password?: string) => Promise<void>
}

function FileSettingsDialog({
  file,
  isOpen,
  onClose,
  onSave,
}: FileSettingsDialogProps) {
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (file) {
      setVisibility(file.visibility)
      setPassword('')
    }
  }, [file])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(visibility, password || undefined)
      onClose()
    } catch (error) {
      console.error('Error saving file settings:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File Settings</DialogTitle>
          <DialogDescription>
            Update visibility and protection settings for {file?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(value: 'PUBLIC' | 'PRIVATE') =>
                  setVisibility(value)
                }
              >
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="PRIVATE">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      Private
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-protection">Password Protection</Label>
              <Input
                id="password-protection"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for no password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function UserList() {
  const {
    users,
    isLoading,
    currentPage,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    removeUserAvatar,
    verifyUser,
  } = useUserManagement()

  const { data: session } = useSession()
  const isSuperAdmin = (session as any)?.user?.role === 'SUPERADMIN'

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewingFiles, setIsViewingFiles] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [userFiles, setUserFiles] = useState<File[]>([])
  const [userUrls, setUserUrls] = useState<ShortenedUrl[]>([])
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'USER',
  })
  const [fileFilters, setFileFilters] = useState<FileFilters>({
    search: '',
    visibility: null,
    type: '',
  })
  const [urlSearch, setUrlSearch] = useState('')
  const [filePage, setFilePage] = useState(1)
  const [urlPage, setUrlPage] = useState(1)
  const [filePagination, setFilePagination] = useState<PaginationData | null>(
    null
  )
  const [urlPagination, setUrlPagination] = useState<PaginationData | null>(
    null
  )
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isFileSettingsOpen, setIsFileSettingsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isFileDeleteDialogOpen, setIsFileDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [banTarget, setBanTarget] = useState<User | null>(null)
  const [banReason, setBanReason] = useState('')
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('permanent')
  const [banExpiry, setBanExpiry] = useState('')
  const [isBanning, setIsBanning] = useState(false)
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false)
  const [flagTarget, setFlagTarget] = useState<{ type: 'file' | 'url'; id: string; name: string; flagged: boolean } | null>(null)
  const [flagReason, setFlagReason] = useState('')
  const [isFlagging, setIsFlagging] = useState(false)

  // Available plans from DB for the plan-change dropdown
  const [availablePlans, setAvailablePlans] = useState<Array<{ id: string; slug: string; name: string }>>([])

  useEffect(() => {
    fetch('/api/products/catalog')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.data?.plans) setAvailablePlans(d.data.plans)
      })
      .catch(() => {})
  }, [])

  const fetchUserFiles = useCallback(
    async (userId: string, page: number) => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
        })

        if (fileFilters.search) {
          params.set('search', fileFilters.search)
        }
        if (fileFilters.visibility) {
          params.set('visibility', fileFilters.visibility)
        }
        if (fileFilters.type) {
          params.set('type', fileFilters.type)
        }

        const response = await fetch(`/api/users/${userId}/files?${params}`)
        if (!response.ok) throw new Error('Failed to fetch user files')
        const data: FileResponse = await response.json()
        setUserFiles(data.files)
        setFilePagination(data.pagination)
        setFilePage(page)
      } catch (error) {
        console.error('Error fetching user files:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch user files',
          variant: 'destructive',
        })
      }
    },
    [fileFilters, toast]
  )

  const fetchUserUrls = useCallback(
    async (userId: string, page: number) => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
        })

        if (urlSearch) {
          params.set('search', urlSearch)
        }

        const response = await fetch(`/api/users/${userId}/urls?${params}`)
        if (!response.ok) throw new Error('Failed to fetch user URLs')
        const data: UrlResponse = await response.json()
        setUserUrls(data.urls)
        setUrlPagination(data.pagination)
        setUrlPage(page)
      } catch (error) {
        console.error('Error fetching user URLs:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch user URLs',
          variant: 'destructive',
        })
      }
    },
    [urlSearch, toast]
  )

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (viewingUser) {
      const timer = setTimeout(() => {
        fetchUserFiles(viewingUser.id, 1)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [fileFilters, viewingUser, fetchUserFiles])

  useEffect(() => {
    if (viewingUser) {
      const timer = setTimeout(() => {
        fetchUserUrls(viewingUser.id, 1)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [urlSearch, viewingUser, fetchUserUrls])

  const notifyUserOfChanges = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/login`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Failed to notify user of changes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData)
        await notifyUserOfChanges(editingUser.id)
      } else {
        await createUser(formData)
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      urlId: user.urlId,
      planSlug: user.subscriptions?.[0]?.product?.slug,
    })
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'USER',
    })
    setIsDialogOpen(true)
  }

  const handleViewFiles = async (user: User) => {
    setViewingUser(user)
    setIsViewingFiles(true)
    await fetchUserFiles(user.id, 1)
    await fetchUserUrls(user.id, 1)
  }

  const handleFileFilterChange = (filters: Partial<FileFilters>) => {
    const newFilters = { ...fileFilters, ...filters }
    setFileFilters(newFilters)
  }

  const handleUrlSearchChange = (search: string) => {
    setUrlSearch(search)
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/'))
      return <ImageIcon className="h-4 w-4" aria-label="Image file" />
    if (mimeType.startsWith('text/')) return <FileText className="h-4 w-4" />
    if (mimeType.startsWith('application/pdf'))
      return <FileText className="h-4 w-4" />
    if (
      mimeType.startsWith('application/msword') ||
      mimeType.startsWith(
        'application/vnd.openxmlformats-officedocument.wordprocessingml'
      )
    )
      return <FileText className="h-4 w-4" />
    if (
      mimeType.startsWith('application/vnd.ms-excel') ||
      mimeType.startsWith(
        'application/vnd.openxmlformats-officedocument.spreadsheetml'
      )
    )
      return <FileText className="h-4 w-4" />
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (
      mimeType.startsWith('application/zip') ||
      mimeType.startsWith('application/x-rar-compressed')
    )
      return <Archive className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getFilePreview = (file: File) => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="relative w-10 h-10 rounded overflow-hidden flex items-center justify-center bg-muted">
          <Image
            src={`/api/files/${file.id}/thumbnail`}
            alt={file.name}
            fill
            className="object-cover"
            sizes="40px"
            priority={false}
            loading="lazy"
          />
        </div>
      )
    }
    return (
      <div className="w-10 h-10 rounded flex items-center justify-center bg-muted">
        {getFileIcon(file.mimeType)}
      </div>
    )
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!viewingUser) return

    try {
      const response = await fetch(
        `/api/users/${viewingUser.id}/files/${fileId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      toast({
        title: 'Success',
        description: 'File deleted successfully',
      })

      fetchUserFiles(viewingUser.id, filePage)
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUrl = async (urlId: string) => {
    if (!viewingUser) return

    try {
      const response = await fetch(
        `/api/users/${viewingUser.id}/urls/${urlId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete URL')
      }

      toast({
        title: 'Success',
        description: 'URL deleted successfully',
      })

      fetchUserUrls(viewingUser.id, urlPage)
    } catch (error) {
      console.error('Error deleting URL:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete URL',
        variant: 'destructive',
      })
    }
  }

  const handleFileSettings = async (
    visibility: 'PUBLIC' | 'PRIVATE',
    password?: string
  ) => {
    if (!viewingUser || !selectedFile) return

    try {
      const response = await fetch(
        `/api/users/${viewingUser.id}/files/${selectedFile.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visibility, password }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update file settings')
      }

      toast({
        title: 'Success',
        description: 'File settings updated successfully',
      })

      fetchUserFiles(viewingUser.id, filePage)
    } catch (error) {
      console.error('Error updating file settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to update file settings',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveAvatar = async (userId: string) => {
    try {
      await removeUserAvatar(userId)
    } catch (error) {
      console.error('Error removing avatar:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const invalidateResponse = await fetch(`/api/users/${userId}/sessions`, {
        method: 'DELETE',
      })

      if (!invalidateResponse.ok) {
        throw new Error('Failed to invalidate user sessions')
      }

      await deleteUser(userId)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (error) {
      console.error('Error during user deletion process:', error)
    }
  }

  const handleOpenBan = (user: User) => {
    setBanTarget(user)
    setBanReason('')
    setBanType('permanent')
    setBanExpiry('')
    setIsBanDialogOpen(true)
  }

  const handleBanUser = async () => {
    if (!banTarget || banReason.length < 10) return
    setIsBanning(true)
    try {
      const body: Record<string, unknown> = { reason: banReason, type: banType }
      if (banType === 'temporary' && banExpiry) {
        body.expiresAt = new Date(banExpiry).toISOString()
      }
      const res = await fetch(`/api/admin/users/${banTarget.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to ban user')
      }
      toast({ title: 'User Banned', description: `${banTarget.name} has been banned.` })
      setIsBanDialogOpen(false)
      setBanTarget(null)
      fetchUsers(currentPage)
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to ban user', variant: 'destructive' })
    } finally {
      setIsBanning(false)
    }
  }

  const handleUnbanUser = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/ban`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to unban user')
      }
      toast({ title: 'User Unbanned', description: `${user.name} has been unbanned.` })
      fetchUsers(currentPage)
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to unban user', variant: 'destructive' })
    }
  }

  const handleVerifyUser = async (user: User) => {
    try {
      await verifyUser(user.id, !user.isVerified)
    } catch {
      // toast already shown in hook
    }
  }

  const handleOpenFlag = (type: 'file' | 'url', id: string, name: string, flagged: boolean) => {
    setFlagTarget({ type, id, name, flagged })
    setFlagReason('')
    setIsFlagDialogOpen(true)
  }

  const handleFlagContent = async () => {
    if (!flagTarget) return
    if (!flagTarget.flagged && flagReason.length < 3) return
    setIsFlagging(true)
    try {
      const res = await fetch('/api/admin/content/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: flagTarget.type,
          contentId: flagTarget.id,
          reason: flagTarget.flagged ? 'Unflagged by admin' : flagReason,
          flagged: !flagTarget.flagged,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to flag content')
      }
      toast({
        title: flagTarget.flagged ? 'Content Unflagged' : 'Content Flagged',
        description: flagTarget.flagged
          ? `${flagTarget.name} is now visible again.`
          : `${flagTarget.name} has been flagged and hidden from public view.`,
      })
      setIsFlagDialogOpen(false)
      setFlagTarget(null)
      if (viewingUser) {
        fetchUserFiles(viewingUser.id, filePage)
        fetchUserUrls(viewingUser.id, urlPage)
      }
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to flag content', variant: 'destructive' })
    } finally {
      setIsFlagging(false)
    }
  }

  if (isLoading) {
    return <UserTableSkeleton />
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-0 gap-1"><Shield className="h-3 w-3" />Superadmin</Badge>
      case 'ADMIN':
        return <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0 gap-1"><Shield className="h-3 w-3" />Admin</Badge>
      default:
        return <Badge variant="secondary" className="bg-muted/50 gap-1"><Shield className="h-3 w-3" />User</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Users</h2>
            <p className="text-sm text-muted-foreground">{users.length} user{users.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New User
        </Button>
      </div>

      <div className="glass-subtle overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>URL ID</TableHead>
              <TableHead>Files</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>URLs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-border/50 group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {user.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium leading-none">{user.name}</p>
                          {user.isVerified && (
                            <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {getRoleBadge(user.role)}
                      {user.bannedAt && (
                        <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-0 gap-1">
                          <Ban className="h-3 w-3" />
                          Banned
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.subscriptions?.[0]?.product ? (
                      <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-0">
                        <Zap className="h-3 w-3" />
                        {user.subscriptions[0].product.name}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-muted/50 border-0">Free</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="relative rounded-md bg-muted/50 px-2 py-1 font-mono text-xs">
                      {user.urlId}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user._count.files}</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 min-w-[100px]">
                      <span className="text-sm">{formatFileSize(user.storageUsed)}</span>
                      {(() => {
                        const quotaGB = user.subscriptions?.[0]?.product?.storageQuotaGB
                        const quotaMB = user.storageQuotaMB ?? (quotaGB != null ? quotaGB * 1024 : 10240)
                        const pct = quotaMB > 0 ? Math.min((user.storageUsed / quotaMB) * 100, 100) : 0
                        return (
                          <Progress
                            value={pct}
                            className={`h-1 ${pct > 90 ? '[&>div]:bg-red-500' : pct > 75 ? '[&>div]:bg-orange-500' : ''}`}
                          />
                        )
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user._count.shortenedUrls}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(user)}
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit User</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewFiles(user)}
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            >
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Content</p>
                          </TooltipContent>
                        </Tooltip>

                        {user.image && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveAvatar(user.id)}
                                className="h-8 w-8 hover:bg-chart-4/10 hover:text-chart-4"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove Avatar</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {user.role !== 'SUPERADMIN' && user.role !== 'ADMIN' && (
                          user.bannedAt ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUnbanUser(user)}
                                  className="h-8 w-8 text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Unban User</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenBan(user)}
                                  className="h-8 w-8 text-amber-500 hover:text-amber-500 hover:bg-amber-500/10"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ban User</p>
                              </TooltipContent>
                            </Tooltip>
                          )
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVerifyUser(user)}
                              className={`h-8 w-8 ${user.isVerified ? 'text-blue-500 hover:text-blue-500 hover:bg-blue-500/10' : 'text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10'}`}
                            >
                              <BadgeCheck className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.isVerified ? 'Remove Verification' : 'Verify User'}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setUserToDelete(user)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete User</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/[0.08] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'New User'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Edit user details and permissions.'
                : 'Create a new user account.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Username</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                  required
                />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}
              {editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    New Password
                    <span className="text-sm text-muted-foreground ml-2">
                      (Leave empty to keep current password)
                    </span>
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    {isSuperAdmin && <SelectItem value="ADMIN">Admin</SelectItem>}
                    {isSuperAdmin && <SelectItem value="SUPERADMIN">Superadmin</SelectItem>}
                  </SelectContent>
                </Select>
                {!isSuperAdmin && (
                  <p className="text-sm text-muted-foreground">Only Superadmins can assign elevated roles.</p>
                )}
              </div>
              {editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="urlId">
                    URL ID
                    <span className="text-sm text-muted-foreground ml-2">
                      (5 characters, alphanumeric)
                    </span>
                  </Label>
                  <Input
                    id="urlId"
                    value={formData.urlId || ''}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      if (/^[A-Z0-9]*$/.test(value) && value.length <= 5) {
                        setFormData({ ...formData, urlId: value })
                      }
                    }}
                    placeholder="e.g. ABC12"
                    maxLength={5}
                  />
                </div>
              )}

              {editingUser && (
                <>
                  {isSuperAdmin ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="storageQuotaMB">Storage Quota (MB)</Label>
                        <Input
                          id="storageQuotaMB"
                          type="number"
                          value={formData.storageQuotaMB ?? ''}
                          onChange={(e) =>
                            setFormData({ ...formData, storageQuotaMB: e.target.value === '' ? null : Number(e.target.value) })
                          }
                          min="0"
                          placeholder="e.g. 10240"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="grantStorageGB">Grant Storage (GB)</Label>
                        <Input
                          id="grantStorageGB"
                          type="number"
                          value={formData.grantStorageGB ?? ''}
                          onChange={(e) =>
                            setFormData({ ...formData, grantStorageGB: e.target.value === '' ? undefined : Number(e.target.value) })
                          }
                          min="0"
                          placeholder="e.g. 10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="grantCustomDomains">Grant Custom Domain Slots</Label>
                        <Input
                          id="grantCustomDomains"
                          type="number"
                          value={formData.grantCustomDomains ?? ''}
                          onChange={(e) =>
                            setFormData({ ...formData, grantCustomDomains: e.target.value === '' ? undefined : Number(e.target.value) })
                          }
                          min="0"
                          placeholder="e.g. 2"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="plan">Plan</Label>
                        {editingUser?.subscriptions?.[0]?.product && (
                          <p className="text-xs text-muted-foreground">
                            Current: <span className="font-medium text-foreground">{editingUser.subscriptions[0].product.name}</span>
                            {' · '}
                            {editingUser.subscriptions[0].product.storageQuotaGB == null ? '∞' : `${editingUser.subscriptions[0].product.storageQuotaGB} GB`} storage
                          </p>
                        )}
                        <Select
                          value={(formData.planSlug as string) || 'keep'}
                          onValueChange={(value: string) =>
                            setFormData({ ...formData, planSlug: value === 'keep' ? undefined : value })
                          }
                        >
                          <SelectTrigger id="plan">
                            <SelectValue placeholder="Keep current" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="keep">Keep current</SelectItem>
                            {availablePlans.map((plan) => (
                              <SelectItem key={plan.slug} value={plan.slug}>
                                {plan.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Only Superadmins can grant storage, custom domains, or change plans.</p>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingUser ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewingFiles} onOpenChange={setIsViewingFiles}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 glass">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 pb-4 border-b border-border/50">
            <Avatar className="h-10 w-10 border border-border/50">
              <AvatarImage src={viewingUser?.image || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {viewingUser?.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold truncate">{viewingUser?.name}&apos;s Content</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {filePagination?.total || 0} files · {urlPagination?.total || 0} URLs · {viewingUser ? formatFileSize(viewingUser.storageUsed) : '0 B'} used
              </DialogDescription>
            </div>
          </div>

          <Tabs defaultValue="files" className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-4">
              <TabsList className="h-9 items-center gap-1 p-1 rounded-xl bg-muted/50">
                <TabsTrigger value="files" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-1.5 text-sm gap-1.5">
                  <File className="h-3.5 w-3.5" />
                  Files
                  <Badge variant="secondary" className="bg-muted/50 text-xs ml-1 px-1.5 py-0">{filePagination?.total || 0}</Badge>
                </TabsTrigger>
                <TabsTrigger value="urls" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-1.5 text-sm gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  URLs
                  <Badge variant="secondary" className="bg-muted/50 text-xs ml-1 px-1.5 py-0">{urlPagination?.total || 0}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="files" className="flex-1 flex flex-col min-h-0 mt-0 px-6 pb-6">
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                {/* Search & filters */}
                <div className="flex gap-2 pt-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search files..."
                      value={fileFilters.search}
                      onChange={(e) => handleFileFilterChange({ search: e.target.value })}
                      className="pl-9 bg-background/50 border-border/50"
                    />
                  </div>
                  <Select
                    value={fileFilters.visibility || 'all'}
                    onValueChange={(value) =>
                      handleFileFilterChange({ visibility: value === 'all' ? null : (value as 'PUBLIC' | 'PRIVATE') })
                    }
                  >
                    <SelectTrigger className="w-[130px] bg-background/50 border-border/50">
                      <SelectValue placeholder="Visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={fileFilters.type || 'all'}
                    onValueChange={(value) => handleFileFilterChange({ type: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger className="w-[130px] bg-background/50 border-border/50">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="image/">Images</SelectItem>
                      <SelectItem value="video/">Videos</SelectItem>
                      <SelectItem value="text/">Text</SelectItem>
                      <SelectItem value="application/">Documents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* File grid */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {userFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-3 rounded-xl bg-muted/50 mb-3">
                        <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">No files found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {userFiles.map((file: File) => (
                        <div
                          key={file.id}
                          className={cn(
                            'group relative flex items-center gap-3 p-3 rounded-xl transition-all',
                            'glass-subtle glass-hover',
                            file.flagged && 'ring-1 ring-destructive/50 bg-destructive/5'
                          )}
                        >
                          {/* Preview */}
                          <div className="shrink-0">
                            {getFilePreview(file)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <a
                                href={sanitizeUrl(file.urlPath)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium truncate hover:text-primary transition-colors"
                              >
                                {file.name}
                              </a>
                              {file.flagged && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Flag className="h-3.5 w-3.5 text-destructive shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Flagged: {file.flagReason || 'No reason'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                              <span className="text-xs text-muted-foreground/40">·</span>
                              <span className="text-xs text-muted-foreground">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground/40">·</span>
                              {file.password ? (
                                <Badge className="bg-chart-4/20 text-chart-4 border-0 text-[10px] px-1.5 py-0 h-4">Protected</Badge>
                              ) : file.visibility === 'PRIVATE' ? (
                                <Badge variant="secondary" className="bg-muted/50 text-[10px] px-1.5 py-0 h-4">Private</Badge>
                              ) : (
                                <Badge className="bg-chart-2/20 text-chart-2 border-0 text-[10px] px-1.5 py-0 h-4">Public</Badge>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="shrink-0 flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => window.open(sanitizeUrl(file.urlPath), '_blank')}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Open</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn('h-7 w-7', file.flagged ? 'text-destructive hover:text-destructive' : 'hover:text-amber-500')}
                                    onClick={() => handleOpenFlag('file', file.id, file.name, !!file.flagged)}
                                  >
                                    {file.flagged ? <ShieldOff className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{file.flagged ? 'Unflag' : 'Flag'}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedFile(file); setIsFileSettingsOpen(true) }}>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => { setSelectedFile(file); setIsFileDeleteDialogOpen(true) }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {filePagination && filePagination.pages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); viewingUser && fetchUserFiles(viewingUser.id, filePage - 1) }}
                          disabled={filePage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                      {getPaginationRange(filePage, filePagination.pages).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); viewingUser && fetchUserFiles(viewingUser.id, p) }}
                            isActive={p === filePage}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); viewingUser && fetchUserFiles(viewingUser.id, filePage + 1) }}
                          disabled={filePage === filePagination.pages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </TabsContent>

            <TabsContent value="urls" className="flex-1 flex flex-col min-h-0 mt-0 px-6 pb-6">
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                {/* Search */}
                <div className="relative pt-3">
                  <Search className="absolute left-3 top-1/2 mt-1.5 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search URLs..."
                    value={urlSearch}
                    onChange={(e) => handleUrlSearchChange(e.target.value)}
                    className="pl-9 bg-background/50 border-border/50"
                  />
                </div>

                {/* URL list */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {userUrls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-3 rounded-xl bg-muted/50 mb-3">
                        <Link2 className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">No URLs found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userUrls.map((url) => (
                        <div
                          key={url.id}
                          className={cn(
                            'group flex items-center gap-3 p-3 rounded-xl transition-all',
                            'glass-subtle glass-hover',
                            url.flagged && 'ring-1 ring-destructive/50 bg-destructive/5'
                          )}
                        >
                          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                            <Link2 className="h-4 w-4 text-primary" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`/u/${url.shortCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium font-mono hover:text-primary transition-colors"
                              >
                                /u/{url.shortCode}
                              </a>
                              {url.flagged && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Flag className="h-3.5 w-3.5 text-destructive shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Flagged: {url.flagReason || 'No reason'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <Badge variant="secondary" className="bg-muted/50 text-[10px] px-1.5 py-0 h-4 ml-1">{url.clicks} clicks</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{url.targetUrl}</p>
                            <span className="text-xs text-muted-foreground/60">{new Date(url.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="shrink-0 flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => window.open(`/u/${url.shortCode}`, '_blank')}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Open</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn('h-7 w-7', url.flagged ? 'text-destructive hover:text-destructive' : 'hover:text-amber-500')}
                                    onClick={() => handleOpenFlag('url', url.id, url.shortCode, !!url.flagged)}
                                  >
                                    {url.flagged ? <ShieldOff className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{url.flagged ? 'Unflag' : 'Flag'}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteUrl(url.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {urlPagination && urlPagination.pages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); viewingUser && fetchUserUrls(viewingUser.id, urlPage - 1) }}
                          disabled={urlPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                      {getPaginationRange(urlPage, urlPagination.pages).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); viewingUser && fetchUserUrls(viewingUser.id, p) }}
                            isActive={p === urlPage}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); viewingUser && fetchUserUrls(viewingUser.id, urlPage + 1) }}
                          disabled={urlPage === urlPagination.pages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <FileSettingsDialog
        file={selectedFile}
        isOpen={isFileSettingsOpen}
        onClose={() => {
          setSelectedFile(null)
          setIsFileSettingsOpen(false)
        }}
        onSave={handleFileSettings}
      />

      <AlertDialog
        open={isFileDeleteDialogOpen}
        onOpenChange={setIsFileDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedFile?.name}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedFile(null)
                setIsFileDeleteDialogOpen(false)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedFile) {
                  handleDeleteFile(selectedFile.id)
                }
                setSelectedFile(null)
                setIsFileDeleteDialogOpen(false)
              }}
            >
              Delete File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action
              cannot be undone. All of their files and data will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setUserToDelete(null)
                setIsDeleteDialogOpen(false)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (userToDelete) {
                  handleDeleteUser(userToDelete.id)
                }
              }}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban User Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Ban {banTarget?.name} from the platform. They will be immediately logged out.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ban-reason">Reason</Label>
              <Textarea
                id="ban-reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Explain why this user is being banned (min 10 characters)..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ban-type">Type</Label>
              <Select
                value={banType}
                onValueChange={(v: 'temporary' | 'permanent') => setBanType(v)}
              >
                <SelectTrigger id="ban-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {banType === 'temporary' && (
              <div className="space-y-2">
                <Label htmlFor="ban-expiry">Expires At</Label>
                <Input
                  id="ban-expiry"
                  type="datetime-local"
                  value={banExpiry}
                  onChange={(e) => setBanExpiry(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBanDialogOpen(false)} disabled={isBanning}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBanUser}
              disabled={isBanning || banReason.length < 10 || (banType === 'temporary' && !banExpiry)}
            >
              {isBanning ? 'Banning...' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Content Dialog */}
      <Dialog open={isFlagDialogOpen} onOpenChange={setIsFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{flagTarget?.flagged ? 'Unflag Content' : 'Flag Content'}</DialogTitle>
            <DialogDescription>
              {flagTarget?.flagged
                ? `Remove the flag from "${flagTarget?.name}"? It will be visible to the public again.`
                : `Flag "${flagTarget?.name}"? It will be hidden from everyone except the owner and admins.`}
            </DialogDescription>
          </DialogHeader>
          {!flagTarget?.flagged && (
            <div className="space-y-2 py-2">
              <Label htmlFor="flag-reason">Reason</Label>
              <Textarea
                id="flag-reason"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Why is this content being flagged? (min 3 characters)"
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFlagDialogOpen(false)} disabled={isFlagging}>
              Cancel
            </Button>
            <Button
              className={flagTarget?.flagged ? '' : 'bg-amber-500 text-white hover:bg-amber-600'}
              onClick={handleFlagContent}
              disabled={isFlagging || (!flagTarget?.flagged && flagReason.length < 3)}
            >
              {isFlagging ? 'Processing...' : flagTarget?.flagged ? 'Remove Flag' : 'Flag Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault()
                    fetchUsers(currentPage - 1)
                  }}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>
              {getPaginationRange(currentPage, pagination.pages).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault()
                      fetchUsers(p)
                    }}
                    isActive={p === currentPage}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault()
                    fetchUsers(currentPage + 1)
                  }}
                  disabled={currentPage === pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
