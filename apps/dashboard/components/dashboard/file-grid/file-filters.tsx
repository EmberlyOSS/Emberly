import React, { memo, useCallback, useRef, useState } from 'react'

import { SortOption } from '@/types/components/file'
import { format } from 'date-fns'
import {
  ArrowDownUp,
  Calendar as CalendarIcon,
  ChevronDown,
} from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { cn } from '@/lib/utils'

interface FileFiltersProps {
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  selectedTypes: string[]
  onTypesChange: (types: string[]) => void
  fileTypes: string[]
  date: DateRange | undefined
  onDateChange: (range: DateRange | undefined) => void
  visibility: string[]
  onVisibilityChange: (visibility: string[]) => void
}

export const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'largest', label: 'Largest' },
  { value: 'smallest', label: 'Smallest' },
  { value: 'most-viewed', label: 'Most viewed' },
  { value: 'least-viewed', label: 'Least viewed' },
  { value: 'most-downloaded', label: 'Most downloaded' },
  { value: 'least-downloaded', label: 'Least downloaded' },
]

export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'hasPassword', label: 'Password protected' },
]

const TYPE_GROUPS = ['Images', 'Videos', 'Audio', 'Documents', 'Other']

function typeGroup(type: string) {
  const t = type.toLowerCase()
  if (t.startsWith('image/')) return 'Images'
  if (t.startsWith('video/')) return 'Videos'
  if (t.startsWith('audio/')) return 'Audio'
  if (t.includes('pdf') || t.includes('document') || t.startsWith('text/'))
    return 'Documents'
  return 'Other'
}

export function formatDateRange(date: DateRange | undefined) {
  if (!date?.from) return null
  return date.to
    ? `${format(date.from, 'MMM d')} – ${format(date.to, 'MMM d')}`
    : `From ${format(date.from, 'MMM d')}`
}

/**
 * On touch, opening waits a frame so a scroll that starts on a trigger
 * cancels the open instead of popping a menu mid-scroll.
 */
function useScrollSafeOpen() {
  const [open, setOpen] = useState(false)
  const rafRef = useRef<number | undefined>(undefined)
  const isTouchRef = useRef(false)

  const cancelPending = useCallback(() => {
    if (rafRef.current !== undefined) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = undefined
    }
  }, [])

  const onOpenChange = useCallback(
    (next: boolean) => {
      cancelPending()
      if (next && isTouchRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setOpen(true)
          rafRef.current = undefined
        })
      } else {
        setOpen(next)
      }
    },
    [cancelPending]
  )

  const triggerProps = {
    onPointerDown: (e: React.PointerEvent) => {
      isTouchRef.current = e.pointerType === 'touch'
    },
    onPointerCancel: cancelPending,
  }

  return { open, onOpenChange, triggerProps }
}

const triggerClass =
  'h-9 gap-1.5 border-border/60 bg-background/50 font-normal hover:bg-muted/50'

function Count({ n }: { n: number }) {
  if (!n) return null
  return (
    <span className="rounded-full bg-primary/15 px-1.5 text-xs font-medium tabular-nums text-primary">
      {n}
    </span>
  )
}

export const FileFilters = memo(function FileFilters({
  sortBy,
  onSortChange,
  selectedTypes,
  onTypesChange,
  fileTypes,
  date,
  onDateChange,
  visibility,
  onVisibilityChange,
}: FileFiltersProps) {
  const sortMenu = useScrollSafeOpen()
  const visibilityMenu = useScrollSafeOpen()
  const typeMenu = useScrollSafeOpen()
  const dateMenu = useScrollSafeOpen()

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const grouped = TYPE_GROUPS.map((group) => ({
    group,
    types: fileTypes.filter((t) => typeGroup(t) === group),
  })).filter((g) => g.types.length > 0)

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Newest'
  const dateLabel = formatDateRange(date)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu open={sortMenu.open} onOpenChange={sortMenu.onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={triggerClass}
            {...sortMenu.triggerProps}
          >
            <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
            {sortLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={sortBy}
            onValueChange={(v) => onSortChange(v as SortOption)}
          >
            {SORT_OPTIONS.map((option, i) => (
              <React.Fragment key={option.value}>
                {i > 0 && i % 2 === 0 && <DropdownMenuSeparator />}
                <DropdownMenuRadioItem value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              </React.Fragment>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu
        open={visibilityMenu.open}
        onOpenChange={visibilityMenu.onOpenChange}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={triggerClass}
            {...visibilityMenu.triggerProps}
          >
            Visibility
            <Count n={visibility.length} />
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {VISIBILITY_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={visibility.includes(option.value)}
              onCheckedChange={() =>
                onVisibilityChange(toggle(visibility, option.value))
              }
              onSelect={(e) => e.preventDefault()}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu open={typeMenu.open} onOpenChange={typeMenu.onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={triggerClass}
            disabled={fileTypes.length === 0}
            {...typeMenu.triggerProps}
          >
            Type
            <Count n={selectedTypes.length} />
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="max-h-[22rem] w-64 overflow-y-auto"
        >
          {grouped.map(({ group, types }, i) => (
            <React.Fragment key={group}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                {group}
              </DropdownMenuLabel>
              {types.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() =>
                    onTypesChange(toggle(selectedTypes, type))
                  }
                  onSelect={(e) => e.preventDefault()}
                  className="font-mono text-xs"
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover open={dateMenu.open} onOpenChange={dateMenu.onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(triggerClass, dateLabel && 'text-foreground')}
            {...dateMenu.triggerProps}
          >
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            {dateLabel ?? 'Any date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
          {date?.from && (
            <div className="flex justify-end border-t border-border/50 p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDateChange(undefined)}
              >
                Clear dates
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
})
