'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

import Image from 'next/image'

import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  EyeOff,
  File,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Link2,
  Lock,
  MoreVertical,
  Music,
  Plus,
  Shield,
  Trash2,
  Users,
  UserX,
  Video,
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
}

interface ShortenedUrl {
  id: string
  shortCode: string
  targetUrl: string
  clicks: number
  createdAt: string
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
    <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>URL ID</TableHead>
            <TableHead>Files</TableHead>
            <TableHead>Storage Used</TableHead>
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
      role: user.role,
      urlId: user.urlId,
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

      <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>URL ID</TableHead>
              <TableHead>Files</TableHead>
              <TableHead>Storage Used</TableHead>
              <TableHead>URLs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32">
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
                        <p className="font-medium leading-none">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
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
                    <span className="text-sm">{formatFileSize(user.storageUsed)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user._count.shortenedUrls}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <DialogContent>
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
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
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
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{viewingUser?.name}&apos;s Content</DialogTitle>
            <DialogDescription>
              View and manage user&apos;s files and shortened URLs
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="files">
                Files ({filePagination?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="urls">
                URLs ({urlPagination?.total || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search files..."
                      value={fileFilters.search}
                      onChange={(e) =>
                        handleFileFilterChange({ search: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>
                  <Select
                    value={fileFilters.visibility || 'all'}
                    onValueChange={(value) =>
                      handleFileFilterChange({
                        visibility:
                          value === 'all'
                            ? null
                            : (value as 'PUBLIC' | 'PRIVATE'),
                      })
                    }
                  >
                    <SelectTrigger className="w-[150px]">
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
                    onValueChange={(value) =>
                      handleFileFilterChange({
                        type: value === 'all' ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="File Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="image/">Images</SelectItem>
                      <SelectItem value="text/">Text</SelectItem>
                      <SelectItem value="application/">Documents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userFiles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24">
                            <div className="flex flex-col items-center justify-center text-center">
                              <FolderOpen className="h-8 w-8 text-muted-foreground/50 mb-2" />
                              <p className="text-sm text-muted-foreground">No files found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        userFiles.map((file: File) => (
                          <TableRow key={file.id} className="border-border/50 group">
                            <TableCell className="w-[50px]">
                              <div className="flex items-center justify-center">
                                {getFilePreview(file)}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium max-w-[300px]">
                              <div className="flex items-center justify-between gap-2">
                                <a
                                  href={sanitizeUrl(file.urlPath)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline flex items-center gap-2 truncate hover:text-primary transition-colors"
                                >
                                  {file.name}
                                </a>
                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedFile(file)
                                          setIsFileSettingsOpen(true)
                                        }}
                                      >
                                        <Lock className="h-4 w-4 mr-2" />
                                        Settings
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          setSelectedFile(file)
                                          setIsFileDeleteDialogOpen(true)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <span
                                className="truncate block text-sm text-muted-foreground"
                                title={file.mimeType}
                              >
                                {file.mimeType}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {formatFileSize(file.size)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {file.password ? (
                                <Badge className="bg-chart-4/20 text-chart-4 hover:bg-chart-4/30 border-0">Protected</Badge>
                              ) : file.visibility === 'PRIVATE' ? (
                                <Badge variant="secondary" className="bg-muted/50">Private</Badge>
                              ) : (
                                <Badge className="bg-chart-2/20 text-chart-2 hover:bg-chart-2/30 border-0">Public</Badge>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {filePagination && filePagination.pages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.preventDefault()
                            if (viewingUser) {
                              fetchUserFiles(viewingUser.id, filePage - 1)
                            }
                          }}
                          disabled={filePage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                      {getPaginationRange(filePage, filePagination.pages).map(
                        (p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              onClick={(
                                e: React.MouseEvent<HTMLAnchorElement>
                              ) => {
                                e.preventDefault()
                                if (viewingUser) {
                                  fetchUserFiles(viewingUser.id, p)
                                }
                              }}
                              isActive={p === filePage}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.preventDefault()
                            if (viewingUser) {
                              fetchUserFiles(viewingUser.id, filePage + 1)
                            }
                          }}
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

            <TabsContent value="urls">
              <div className="space-y-4">
                <Input
                  placeholder="Search URLs..."
                  value={urlSearch}
                  onChange={(e) => handleUrlSearchChange(e.target.value)}
                  className="w-full bg-background/50 border-border/50"
                />

                <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead>Short URL</TableHead>
                        <TableHead>Target URL</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userUrls.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24">
                            <div className="flex flex-col items-center justify-center text-center">
                              <Link2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
                              <p className="text-sm text-muted-foreground">No URLs found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        userUrls.map((url) => (
                          <TableRow key={url.id} className="border-border/50 group">
                            <TableCell className="font-medium">
                              <div className="flex items-center justify-between">
                                <a
                                  href={`/u/${url.shortCode}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline flex items-center gap-2 hover:text-primary transition-colors"
                                >
                                  <Link2 className="h-4 w-4" />
                                  <code className="text-sm">{url.shortCode}</code>
                                </a>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreVertical className="h-4 w-4" />
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
                            </TableCell>
                            <TableCell className="max-w-[300px] truncate">
                              <a
                                href={url.targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {url.targetUrl}
                              </a>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-muted/50">{url.clicks}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(url.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {urlPagination && urlPagination.pages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.preventDefault()
                            if (viewingUser) {
                              fetchUserUrls(viewingUser.id, urlPage - 1)
                            }
                          }}
                          disabled={urlPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                      {getPaginationRange(urlPage, urlPagination.pages).map(
                        (p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              onClick={(
                                e: React.MouseEvent<HTMLAnchorElement>
                              ) => {
                                e.preventDefault()
                                if (viewingUser) {
                                  fetchUserUrls(viewingUser.id, p)
                                }
                              }}
                              isActive={p === urlPage}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.preventDefault()
                            if (viewingUser) {
                              fetchUserUrls(viewingUser.id, urlPage + 1)
                            }
                          }}
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
