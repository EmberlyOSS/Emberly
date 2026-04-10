import { useCallback, useEffect, useState } from 'react'

import type {
  FileType,
  PaginationInfo,
  SortOption,
} from '@/packages/types/components/file'
import { Users, FolderOpen, ChevronDown, Shield } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { FileCard } from '@/packages/components/dashboard/file-card'
import { FileCardSkeleton } from '@/packages/components/dashboard/file-grid/file-card-skeleton'
import { FileFilters } from '@/packages/components/dashboard/file-grid/file-filters'
import {
  FileGridPagination,
  PaginationSkeleton,
} from '@/packages/components/dashboard/file-grid/pagination'
import { SearchInput } from '@/packages/components/dashboard/file-grid/search-input'
import { SharedFileCard } from '@/packages/components/dashboard/shared-file-card'
import { EmptyPlaceholder } from '@/packages/components/shared/empty-placeholder'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/packages/components/ui/dropdown-menu'

import { useFileFilters } from '@/packages/hooks/use-file-filters'

interface SharedFile {
  id: string
  name: string
  urlPath: string
  mimeType: string
  size: number
  visibility: string
  uploadedAt: string
  updatedAt: string
  isPaste: boolean
  role: string
  owner: {
    id: string
    name: string | null
    urlId: string | null
    image: string | null
  }
  pendingSuggestions: number
}

interface UserSquad {
  id: string
  name: string
  myRole: string
}

type ViewMode =
  | { type: 'my-files' }
  | { type: 'shared' }
  | { type: 'squad'; squadId: string; squadName: string }

export function FileGrid() {
  const [files, setFiles] = useState<FileType[]>([])
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fileTypes, setFileTypes] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'my-files' })
  const [sharedCount, setSharedCount] = useState(0)
  const [userSquads, setUserSquads] = useState<UserSquad[]>([])
  const [enableRichEmbeds, setEnableRichEmbeds] = useState(true)
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    pageCount: 0,
    page: 1,
    limit: 24,
  })

  const {
    filters,
    setSearch,
    setTypes,
    setDateRange,
    setVisibility,
    setSortBy,
    setPage,
  } = useFileFilters()

  const handleDateChange = useCallback(
    (range: DateRange | undefined) => {
      if (range?.from) {
        setDateRange(
          range.from.toISOString(),
          range.to ? range.to.toISOString() : null
        )
      } else {
        setDateRange(null, null)
      }
    },
    [setDateRange]
  )

  useEffect(() => {
    async function fetchFileTypes() {
      try {
        const response = await fetch('/api/files/types')
        if (!response.ok) { setFileTypes([]); return }
        const data = await response.json()
        setFileTypes(Array.isArray(data.data.types) ? data.data.types : [])
      } catch {
        setFileTypes([])
      }
    }
    fetchFileTypes()
  }, [])

  useEffect(() => {
    async function fetchUserSettings() {
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setEnableRichEmbeds(data.data?.enableRichEmbeds ?? true)
        }
      } catch { /* ignore */ }
    }
    fetchUserSettings()
  }, [])

  useEffect(() => {
    async function fetchSharedCount() {
      try {
        const response = await fetch('/api/files/shared?limit=1')
        if (response.ok) {
          const data = await response.json()
          setSharedCount(data.pagination?.total || 0)
        }
      } catch { /* ignore */ }
    }
    fetchSharedCount()
  }, [])

  // Fetch user's squads for the switcher
  useEffect(() => {
    async function fetchUserSquads() {
      try {
        const response = await fetch('/api/discovery/squads?mine=true')
        if (response.ok) {
          const data = await response.json()
          setUserSquads(data.data?.squads ?? [])
        }
      } catch { /* ignore */ }
    }
    fetchUserSquads()
  }, [])

  useEffect(() => {
    async function fetchFiles() {
      try {
        setIsLoading(true)

        if (viewMode.type === 'shared') {
          const params = new URLSearchParams({
            page: filters.page.toString(),
            limit: filters.limit.toString(),
          })
          const response = await fetch(`/api/files/shared?${params}`)
          if (!response.ok) throw new Error('Failed to fetch shared files')
          const apiResult = await response.json()
          setSharedFiles(Array.isArray(apiResult.data) ? apiResult.data : [])
          setFiles([])
          if (apiResult.pagination) {
            setPaginationInfo({
              total: apiResult.pagination.total || 0,
              pageCount: apiResult.pagination.pageCount || 0,
              page: filters.page,
              limit: filters.limit,
            })
          }
        } else if (viewMode.type === 'squad') {
          const params = new URLSearchParams({
            page: filters.page.toString(),
            limit: filters.limit.toString(),
            squadId: viewMode.squadId,
            search: filters.search,
            sortBy: filters.sortBy,
            ...(filters.types.length > 0 && { types: filters.types.join(',') }),
            ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
            ...(filters.dateTo && { dateTo: filters.dateTo }),
            ...(filters.visibility.length > 0 && { visibility: filters.visibility.join(',') }),
          })
          const response = await fetch(`/api/files?${params}`)
          if (!response.ok) throw new Error('Failed to fetch squad files')
          const apiResult = await response.json()
          setFiles(Array.isArray(apiResult.data) ? apiResult.data : [])
          setSharedFiles([])
          setPaginationInfo(
            apiResult.pagination
              ? { total: apiResult.pagination.total || 0, pageCount: apiResult.pagination.pageCount || 0, page: filters.page, limit: filters.limit }
              : { total: 0, pageCount: 0, page: filters.page, limit: filters.limit }
          )
        } else {
          const params = new URLSearchParams({
            page: filters.page.toString(),
            limit: filters.limit.toString(),
            search: filters.search,
            sortBy: filters.sortBy,
            ...(filters.types.length > 0 && { types: filters.types.join(',') }),
            ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
            ...(filters.dateTo && { dateTo: filters.dateTo }),
            ...(filters.visibility.length > 0 && { visibility: filters.visibility.join(',') }),
          })
          const response = await fetch(`/api/files?${params}`)
          if (!response.ok) throw new Error('Failed to fetch files')
          const apiResult = await response.json()
          setFiles(Array.isArray(apiResult.data) ? apiResult.data : [])
          setSharedFiles([])
          setPaginationInfo(
            apiResult.pagination
              ? { total: apiResult.pagination.total || 0, pageCount: apiResult.pagination.pageCount || 0, page: filters.page, limit: filters.limit }
              : { total: 0, pageCount: 0, page: filters.page, limit: filters.limit }
          )
        }
      } catch (error) {
        console.error('Error fetching files:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFiles()
  }, [filters, viewMode])

  const handleDelete = (fileId: string) => {
    setFiles((files) => files.filter((file) => file.id !== fileId))
    setPaginationInfo((prev) => ({
      ...prev,
      total: prev.total - 1,
      pageCount: Math.ceil((prev.total - 1) / prev.limit),
    }))
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    setPage(1)
  }

  const dateRangeValue =
    filters.dateFrom || filters.dateTo
      ? {
          from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          to: filters.dateTo ? new Date(filters.dateTo) : undefined,
        }
      : undefined

  const currentLabel =
    viewMode.type === 'my-files'
      ? 'My Files'
      : viewMode.type === 'shared'
        ? 'Shared with Me'
        : viewMode.squadName

  const currentDescription =
    viewMode.type === 'my-files'
      ? 'View and manage your uploaded files'
      : viewMode.type === 'shared'
        ? 'Files others have shared with you'
        : `Files uploaded to ${viewMode.squadName}`

  const CurrentIcon =
    viewMode.type === 'my-files' ? FolderOpen : viewMode.type === 'shared' ? Users : Shield

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {Array.from({ length: 24 }, (_, i) => (
              <FileCardSkeleton key={`skeleton-${Date.now()}-${i}`} />
            ))}
          </div>
          <PaginationSkeleton />
        </>
      )
    }

    if (viewMode.type === 'shared') {
      if (sharedFiles.length === 0) {
        return (
          <EmptyPlaceholder>
            <EmptyPlaceholder.Icon name="users" />
            <EmptyPlaceholder.Title>No shared files</EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              Files shared with you will appear here.
            </EmptyPlaceholder.Description>
          </EmptyPlaceholder>
        )
      }
      return (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sharedFiles.map((file) => (
              <SharedFileCard key={file.id} file={file} />
            ))}
          </div>
          <FileGridPagination paginationInfo={paginationInfo} setPage={setPage} />
        </>
      )
    }

    if (files.length === 0 && paginationInfo.total === 0) {
      const hasActiveFilters =
        filters.search ||
        filters.types.length > 0 ||
        filters.visibility.length > 0 ||
        filters.dateFrom ||
        filters.dateTo

      if (viewMode.type === 'squad') {
        return (
          <EmptyPlaceholder>
            <EmptyPlaceholder.Icon name="users" />
            <EmptyPlaceholder.Title>No files in {viewMode.squadName}</EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              {hasActiveFilters
                ? 'Try adjusting your filters.'
                : 'No files have been uploaded to this squad yet.'}
            </EmptyPlaceholder.Description>
          </EmptyPlaceholder>
        )
      }

      return (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="file" />
          {hasActiveFilters ? (
            <>
              <EmptyPlaceholder.Title>No files found</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                Try adjusting your filters to find files.
              </EmptyPlaceholder.Description>
            </>
          ) : (
            <>
              <EmptyPlaceholder.Title>No files uploaded</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                Upload your first file to get started.
              </EmptyPlaceholder.Description>
            </>
          )}
        </EmptyPlaceholder>
      )
    }

    return (
      <>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {files.map((file) => (
            <FileCard key={file.id} file={file} onDelete={handleDelete} enableRichEmbeds={enableRichEmbeds} />
          ))}
        </div>
        <FileGridPagination paginationInfo={paginationInfo} setPage={setPage} />
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-8 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{currentLabel}</h1>
            <p className="text-muted-foreground mt-1">{currentDescription}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 shrink-0">
                <CurrentIcon className="h-4 w-4" />
                {currentLabel}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => handleViewModeChange({ type: 'my-files' })}
                className={viewMode.type === 'my-files' ? 'bg-secondary font-medium' : ''}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                My Files
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleViewModeChange({ type: 'shared' })}
                className={viewMode.type === 'shared' ? 'bg-secondary font-medium' : ''}
              >
                <Users className="h-4 w-4 mr-2" />
                Shared with Me
                {sharedCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {sharedCount}
                  </Badge>
                )}
              </DropdownMenuItem>
              {userSquads.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1">
                    Squads
                  </DropdownMenuLabel>
                  {userSquads.map((squad) => (
                    <DropdownMenuItem
                      key={squad.id}
                      onClick={() => handleViewModeChange({ type: 'squad', squadId: squad.id, squadName: squad.name })}
                      className={viewMode.type === 'squad' && viewMode.squadId === squad.id ? 'bg-secondary font-medium' : ''}
                    >
                      <Shield className="h-4 w-4 mr-2 shrink-0" />
                      <span className="truncate">{squad.name}</span>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {viewMode.type !== 'shared' && (
          <div className="px-8 pb-8 pt-2 border-t border-border/40">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchInput onSearch={setSearch} initialValue={filters.search} />
              <FileFilters
                sortBy={filters.sortBy as SortOption}
                onSortChange={setSortBy}
                selectedTypes={filters.types}
                onTypesChange={setTypes}
                fileTypes={fileTypes}
                date={dateRangeValue}
                onDateChange={handleDateChange}
                visibility={filters.visibility}
                onVisibilityChange={setVisibility}
              />
            </div>
          </div>
        )}
      </div>

      {renderContent()}
    </div>
  )
}
