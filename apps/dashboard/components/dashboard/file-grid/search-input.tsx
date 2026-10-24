import React, { memo, useEffect, useState } from 'react'

import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'

import { useDebounce } from '@/hooks/use-debounce'

interface SearchInputProps {
  onSearch: (value: string) => void
  initialValue?: string
}

export const SearchInput = memo(function SearchInput({
  onSearch,
  initialValue = '',
}: SearchInputProps) {
  const [value, setValue] = useState(initialValue)
  const debouncedSearch = useDebounce(value, 300)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    onSearch(debouncedSearch)
  }, [debouncedSearch, onSearch])

  return (
    <div className="relative min-w-[12rem] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search by name"
        aria-label="Search files"
        className="h-9 border-border/60 bg-background/50 pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setValue('')}
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
})
