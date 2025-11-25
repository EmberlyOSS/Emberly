'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'

import { signIn, signOut, useSession } from 'next-auth/react'

import { Icons } from '@/components/shared/icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function BaseNav() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!menuRef.current) return
      if (e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('click', handleOutside)
    }

    return () => document.removeEventListener('click', handleOutside)
  }, [open])

  return (
    <header className="top-0 left-0 right-0 z-40 pt-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg shadow-black/5 supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl" />
          <div className="relative flex h-16 items-center px-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2.5">
                <Icons.logo className="h-6 w-6" />
                <span className="emberly-text text-lg font-medium">
                  Emberly
                </span>
              </Link>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center space-x-4">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                About
              </Link>
              <Link
                href="/blog"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Blog
              </Link>
              <Link
                href="/docs"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Docs
              </Link>
              <Link
                href="/discord"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Discord
              </Link>
            </div>

            {/* Mobile hamburger */}
            <div className="ml-3 flex items-center md:hidden">
              <Button
                variant="ghost"
                className="p-2"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label="Open menu"
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {open ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  )}
                </svg>
              </Button>
            </div>

            <div className="ml-auto hidden md:flex items-center gap-3">
              {session ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-9 w-9 rounded-full"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={session.user?.image || undefined}
                            alt={session.user?.name || ''}
                          />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault()
                          signOut({ callbackUrl: '/' })
                        }}
                      >
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => signIn()}>
                    Sign In
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth/register">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu panel */}
          {open && (
            <div ref={menuRef} className="md:hidden px-4 pb-4">
              <div className="mt-2 rounded-xl border border-border/50 bg-background p-4 space-y-3 shadow">
                <div className="flex flex-col">
                  <Link
                    href="/"
                    className="py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Home
                  </Link>
                  <Link
                    href="/blog"
                    className="py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Blog
                  </Link>
                  <Link
                    href="/docs"
                    className="py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Docs
                  </Link>
                  <Link
                    href="/discord"
                    className="py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Discord
                  </Link>
                </div>

                <div className="pt-2 border-t border-border/50">
                  {session ? (
                    <div className="space-y-2">
                      <Link href="/dashboard/profile" className="block text-sm">
                        Profile
                      </Link>
                      <Link href="/dashboard" className="block text-sm">
                        Dashboard
                      </Link>
                      <button
                        className="w-full text-left text-sm text-red-600"
                        onClick={() => signOut({ callbackUrl: '/' })}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signIn()}
                      >
                        Sign In
                      </Button>
                      <Button asChild size="sm">
                        <Link href="/auth/register">Register</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default BaseNav
