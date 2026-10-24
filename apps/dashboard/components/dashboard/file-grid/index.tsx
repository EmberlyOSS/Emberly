import { useCallback, useEffect, useState } from 'react'

import Link from 'next/link'

import type {
  FileType,
  PaginationInfo,
  SortOption,
} from '@/types/components/file'
import { FolderOpen, SearchX, Upload, Users, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { FileCard } from '@/components/dashboard/file-card'
import { FileCardSkeleton } from '@/components/dashboard/file-grid/file-card-skeleton'
import {
  FileFilters,
  SORT_OPTIONS,
  VISIBILITY_OPTIONS,
  formatDateRange,
} from '@/components/dashboard/file-grid/file-filters'
import { FileGridPagination } from '@/components/dashboard/file-grid/pagination'
import { SearchInput } from '@/components/dashboard/file-grid/search-input'
import { SharedFileCard } from '@/components/dashboard/shared-file-card'
import { EmptyState, FilterTabs } from '@/components/layout/page-kit'
import { Button } from '@/components/ui/button'

import { useFileFilters } from '@/hooks/use-file-filters'

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
    resetFilters,
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
          setFileTypes([])
          return
        }
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
      } catch {
        /* ignore */
      }
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
      } catch {
        /* ignore */
      }
    }
    fetchSharedCount()
  }, [])

  useEffect(() => {
    async function fetchUserSquads() {
      try {
        const response = await fetch('/api/discovery/squads?mine=true')
        if (response.ok) {
          const data = await response.json()
          setUserSquads(data.data?.squads ?? [])
        }
      } catch {
        /* ignore */
      }
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
            ...(filters.visibility.length > 0 && {
              visibility: filters.visibility.join(','),
            }),
          })
          const response = await fetch(`/api/files?${params}`)
          if (!response.ok) throw new Error('Failed to fetch squad files')
          const apiResult = await response.json()
          setFiles(Array.isArray(apiResult.data) ? apiResult.data : [])
          setSharedFiles([])
          setPaginationInfo(
            apiResult.pagination
              ? {
                  total: apiResult.pagination.total || 0,
                  pageCount: apiResult.pagination.pageCount || 0,
                  page: filters.page,
                  limit: filters.limit,
                }
              : {
                  total: 0,
                  pageCount: 0,
                  page: filters.page,
                  limit: filters.limit,
                }
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
            ...(filters.visibility.length > 0 && {
              visibility: filters.visibility.join(','),
            }),
          })
          const response = await fetch(`/api/files?${params}`)
          if (!response.ok) throw new Error('Failed to fetch files')
          const apiResult = await response.json()
          setFiles(Array.isArray(apiResult.data) ? apiResult.data : [])
          setSharedFiles([])
          setPaginationInfo(
            apiResult.pagination
              ? {
                  total: apiResult.pagination.total || 0,
                  pageCount: apiResult.pagination.pageCount || 0,
                  page: filters.page,
                  limit: filters.limit,
                }
              : {
                  total: 0,
                  pageCount: 0,
                  page: filters.page,
                  limit: filters.limit,
                }
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

  const viewKey =
    viewMode.type === 'squad' ? `squad:${viewMode.squadId}` : viewMode.type

  const viewOptions = [
    { value: 'my-files', label: 'My files' },
    {
      value: 'shared',
      label: 'Shared with me',
      count: sharedCount || undefined,
    },
    ...userSquads.map((squad) => ({
      value: `squad:${squad.id}`,
      label: squad.name,
    })),
  ]

  const changeView = (key: string) => {
    if (key === 'my-files' || key === 'shared') {
      handleViewModeChange({ type: key })
      return
    }
    const squad = userSquads.find((s) => `squad:${s.id}` === key)
    if (squad) {
      handleViewModeChange({
        type: 'squad',
        squadId: squad.id,
        squadName: squad.name,
      })
    }
  }

  const description =
    viewMode.type === 'my-files'
      ? 'Everything you’ve uploaded and pasted.'
      : viewMode.type === 'shared'
        ? 'Files other people have shared with you.'
        : `Files uploaded to ${viewMode.squadName}.`

  const chips: Array<{ key: string; label: string; clear: () => void }> = [
    ...(filters.search
      ? [
          {
            key: 'search',
            label: `“${filters.search}”`,
            clear: () => setSearch(''),
          },
        ]
      : []),
    ...filters.visibility.map((v) => ({
      key: `vis-${v}`,
      label: VISIBILITY_OPTIONS.find((o) => o.value === v)?.label ?? v,
      clear: () =>
        setVisibility(filters.visibility.filter((item) => item !== v)),
    })),
    ...filters.types.map((t) => ({
      key: `type-${t}`,
      label: t,
      clear: () => setTypes(filters.types.filter((item) => item !== t)),
    })),
    ...(dateRangeValue
      ? [
          {
            key: 'date',
            label: formatDateRange(dateRangeValue as DateRange) ?? 'Date',
            clear: () => setDateRange(null, null),
          },
        ]
      : []),
    ...(filters.sortBy !== 'newest'
      ? [
          {
            key: 'sort',
            label: `Sorted: ${SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label}`,
            clear: () => setSortBy('newest'),
          },
        ]
      : []),
  ]
  const hasFilters = chips.some((c) => c.key !== 'sort')

  const grid = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={grid}>
          {Array.from({ length: 8 }, (_, i) => (
            <FileCardSkeleton key={i} />
          ))}
        </div>
      )
    }

    if (viewMode.type === 'shared') {
      if (sharedFiles.length === 0) {
        return (
          <EmptyState
            className="glass-card"
            icon={Users}
            title="Nothing shared with you yet"
            description="When someone adds you as a collaborator on a file or paste, it shows up here."
          />
        )
      }
      return (
        <>
          <div className={grid}>
            {sharedFiles.map((file) => (
              <SharedFileCard key={file.id} file={file} />
            ))}
          </div>
          <FileGridPagination
            paginationInfo={paginationInfo}
            setPage={setPage}
          />
        </>
      )
    }

    if (files.length === 0 && paginationInfo.total === 0) {
      if (hasFilters) {
        return (
          <EmptyState
            className="glass-card"
            icon={SearchX}
            title="No files match"
            description="Try a different search or remove some filters."
            action={
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        )
      }
      if (viewMode.type === 'squad') {
        return (
          <EmptyState
            className="glass-card"
            icon={Users}
            title={`No files in ${viewMode.squadName} yet`}
            description="Files uploaded to this squad will appear here."
          />
        )
      }
      return (
        <EmptyState
          className="glass-card"
          icon={FolderOpen}
          title="No files yet"
          description="Upload something, or drop files anywhere on the dashboard."
          action={
            <Button size="sm" asChild>
              <Link href="/dashboard/upload">
                <Upload className="mr-1.5 h-4 w-4" />
                Upload files
              </Link>
            </Button>
          }
        />
      )
    }

    return (
      <>
        <div className={grid}>
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDelete={handleDelete}
              enableRichEmbeds={enableRichEmbeds}
            />
          ))}
        </div>
        <FileGridPagination paginationInfo={paginationInfo} setPage={setPage} />
      </>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
          <p className="text-sm text-muted-foreground">
            {description}
            {!isLoading && paginationInfo.total > 0 && (
              <span className="tabular-nums">
                {' '}
                {paginationInfo.total}{' '}
                {paginationInfo.total === 1 ? 'file' : 'files'}
                {hasFilters ? ' match.' : '.'}
              </span>
            )}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/upload">
            <Upload className="mr-1.5 h-4 w-4" />
            Upload
          </Link>
        </Button>
      </div>

      {viewOptions.length > 1 && (
        <FilterTabs
          label="Which files"
          value={viewKey}
          onChange={changeView}
          options={viewOptions}
        />
      )}

      {viewMode.type !== 'shared' && (
        <div className="space-y-3">
          <div className="glass-card flex flex-wrap items-center gap-2 p-2.5">
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

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex max-w-[16rem] items-center gap-1 rounded-full border border-border/60 bg-muted/30 py-0.5 pl-2.5 pr-1.5 text-xs transition-colors hover:border-border hover:bg-muted/60"
                  aria-label={`Remove ${chip.label}`}
                >
                  <span className="truncate">{chip.label}</span>
                  <X className="h-3 w-3 shrink-0 text-muted-foreground" />
                </button>
              ))}
              {chips.length > 1 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {renderContent()}
    </div>
  )
}
