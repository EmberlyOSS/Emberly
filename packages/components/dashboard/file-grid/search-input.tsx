import React, { memo, useEffect, useRef, useState } from 'react'

import { Search } from 'lucide-react'

import { Input } from '@/packages/components/ui/input'
import { Button } from '@/packages/components/ui/button'

import { useDebounce } from '@/packages/hooks/use-debounce'

interface SearchInputProps {
  onSearch: (value: string) => void
  initialValue?: string
}

export const SearchInput = memo(function SearchInput({
  onSearch,
  initialValue = '',
}: SearchInputProps) {
  const [value, setValue] = useState(initialValue)
  const [isOpen, setIsOpen] = useState(Boolean(initialValue))
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(value, 300)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    onSearch(debouncedSearch)
  }, [debouncedSearch, onSearch])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const toggleSearch = () => {
    if (isOpen) {
      setIsOpen(false)
      if (inputRef.current) inputRef.current.blur()
    } else {
      setIsOpen(true)
    }
  }

  const handleBlur = () => {
    if (!value) {
      setIsOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-1 sm:flex-none">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 bg-background/80 backdrop-blur-lg border-border/50 hover:bg-background/90 hover:border-border/50 transition-all duration-200"
        onClick={toggleSearch}
        aria-label="Open search"
        aria-expanded={isOpen}
      >
        <Search className="h-4 w-4" />
      </Button>

      <div
        className={`relative flex-1 transition-all duration-200 sm:overflow-hidden ${isOpen ? 'sm:w-[260px] sm:opacity-100' : 'sm:w-0 sm:opacity-0 sm:pointer-events-none'
          }`}
      >
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder="Search files..."
          className="pl-9 bg-background/80 backdrop-blur-lg border-border/50 focus:bg-background/90 focus:border-border/50 transition-all duration-200"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
        />
      </div>
    </div>
  )
})
