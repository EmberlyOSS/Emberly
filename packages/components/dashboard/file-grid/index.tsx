import { useCallback, useEffect, useState } from 'react'

import type {
  FileType,
  PaginationInfo,
  SortOption,
} from '@/packages/types/components/file'
import { Users } from 'lucide-react'
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

export function FileGrid() {
  const [files, setFiles] = useState<FileType[]>([])
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fileTypes, setFileTypes] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'my-files' | 'shared'>('my-files')
  const [sharedCount, setSharedCount] = useState(0)
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
        if (!response.ok) {
          console.error('Failed to fetch file types, status:', response.status)
          setFileTypes([])
          return
        }
        const data = await response.json()
        setFileTypes(Array.isArray(data.data.types) ? data.data.types : [])
      } catch (error) {
        console.error('Error fetching file types:', error)
        setFileTypes([])
      }
    }
    fetchFileTypes()
  }, [])

  // Fetch user's enableRichEmbeds setting on mount
  useEffect(() => {
    async function fetchUserSettings() {
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setEnableRichEmbeds(data.data?.enableRichEmbeds ?? true)
        }
      } catch (error) {
        console.error('Error fetching user settings:', error)
      }
    }
    fetchUserSettings()
  }, [])

  // Fetch shared files count on mount
  useEffect(() => {
    async function fetchSharedCount() {
      try {
        const response = await fetch('/api/files/shared?limit=1')
        if (response.ok) {
          const data = await response.json()
          setSharedCount(data.pagination?.total || 0)
        }
      } catch (error) {
        console.error('Error fetching shared count:', error)
      }
    }
    fetchSharedCount()
  }, [])

  useEffect(() => {
    async function fetchFiles() {
      try {
        setIsLoading(true)

        if (viewMode === 'shared') {
          // Fetch shared files
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
        } else {
          // Fetch user's own files
          const params = new URLSearchParams({
            page: filters.page.toString(),
            limit: filters.limit.toString(),
            search: filters.search,
            sortBy: filters.sortBy,
            ...(filters.types.length > 0 && { types: filters.types.join(',') }),
            ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
            ...(filters.dateTo && { dateTo: filters.dateTo }),
            ...(filters.visibility.length > 0 && {
              visibility: filters.visibility.join(','),
            }),
          })
          const response = await fetch(`/api/files?${params}`)
          if (!response.ok) throw new Error('Failed to fetch files')
          const apiResult = await response.json()
          setFiles(Array.isArray(apiResult.data) ? apiResult.data : [])
          setSharedFiles([])
          if (apiResult.pagination) {
            setPaginationInfo({
              total: apiResult.pagination.total || 0,
              pageCount: apiResult.pagination.pageCount || 0,
              page: filters.page,
              limit: filters.limit,
            })
          } else {
            setPaginationInfo({
              total: 0,
              pageCount: 0,
              page: filters.page,
              limit: filters.limit,
            })
          }
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

  const dateRangeValue =
    filters.dateFrom || filters.dateTo
      ? {
        from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        to: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
      : undefined

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 24 }, (_, i) => (
              <FileCardSkeleton key={`skeleton-${Date.now()}-${i}`} />
            ))}
          </div>
          <PaginationSkeleton />
        </>
      )
    }

    // Shared files view
    if (viewMode === 'shared') {
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sharedFiles.map((file) => (
              <SharedFileCard key={file.id} file={file} />
            ))}
          </div>
          <FileGridPagination paginationInfo={paginationInfo} setPage={setPage} />
        </>
      )
    }

    // User's own files view
    if (files.length === 0 && paginationInfo.total === 0) {
      const hasActiveFilters =
        filters.search ||
        filters.types.length > 0 ||
        filters.visibility.length > 0 ||
        filters.dateFrom ||
        filters.dateTo

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => (
            <FileCard key={file.id} file={file} onDelete={handleDelete} enableRichEmbeds={enableRichEmbeds} />
          ))}
        </div>
        <FileGridPagination paginationInfo={paginationInfo} setPage={setPage} />
      </>
    )
  }

  const handleViewModeChange = (mode: 'my-files' | 'shared') => {
    setViewMode(mode)
    setPage(1) // Reset to first page when switching views
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
        <div className="relative">
          {/* Title and View Toggle */}
          <div className="p-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {viewMode === 'shared' ? 'Shared with Me' : 'Your Files'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {viewMode === 'shared'
                    ? 'Files others have shared with you'
                    : 'View and manage your uploaded files'}
                </p>
              </div>
              <Button
                variant={viewMode === 'shared' ? 'default' : 'outline'}
                onClick={() => handleViewModeChange(viewMode === 'shared' ? 'my-files' : 'shared')}
                className="flex items-center gap-2 shrink-0"
              >
                <Users className="h-4 w-4" />
                {viewMode === 'shared' ? 'My Files' : 'Shared with Me'}
                {sharedCount > 0 && viewMode !== 'shared' && (
                  <Badge variant="secondary" className="ml-1">
                    {sharedCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Filters - only show for user's own files */}
          {viewMode === 'my-files' && (
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row gap-4">
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
      </div>
      {renderContent()}
    </div>
  )
}
