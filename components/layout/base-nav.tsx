"use client"

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { signIn, signOut, useSession } from 'next-auth/react'

import {
  House,
  BookOpen,
  Rss,
  Mail,
  FileText,
  CreditCard,
  ChartBar,
  ChevronDown,
  Menu,
  FolderOpen,
  Upload,
  Clipboard,
  Link as LinkIcon,
  Globe,
  Users,
  Settings,
  GitGraph,
} from 'lucide-react'

import { Icons } from '@/components/shared/icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const baseRoutes = [
  { href: '/', label: 'Home', icon: House },
  { href: '/about', label: 'About', icon: BookOpen },
  { href: '/contact', label: 'Contact', icon: Mail },
  { href: '/blog', label: 'Blog', icon: Rss },
]

const docsRoutes = [
  { href: '/docs/getting-started', label: 'Getting Started', icon: FileText },
  { href: '/docs/custom-domains', label: 'Custom Domains', icon: Globe },
  { href: '/docs/api', label: 'API Reference', icon: FileText },
  { href: '/docs/user', label: 'User Guide', icon: FileText },
]


const extrasRoutes = [
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
  { href: 'https://status.emberly.site', label: 'Status', icon: ChartBar },
  { href: '/changelogs', label: 'Changelogs', icon: GitGraph },
  { href: '/st5', label: 'ST5', icon: Globe },
]

const dashboardRoutes = [
  { href: '/dashboard', label: 'Files', icon: FolderOpen },
  { href: '/dashboard/upload', label: 'Upload', icon: Upload },
  { href: '/dashboard/paste', label: 'Paste', icon: Clipboard },
  { href: '/dashboard/urls', label: 'Links', icon: LinkIcon },
  { href: '/dashboard/domains', label: 'Domains', icon: Globe },
  { href: '/dashboard/analytics', label: 'Analytics', icon: ChartBar },
]

const adminRoutes = [
  { href: '/dashboard/blog', label: 'Blog', icon: BookOpen },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const sectionsAll = [
  { id: 'base', title: 'Base', items: baseRoutes },
  { id: 'docs', title: 'Documentation', items: docsRoutes },
  { id: 'dashboard', title: 'Dashboard', items: dashboardRoutes },
  { id: 'admin', title: 'Admin', items: adminRoutes },
  { id: 'extras', title: 'Extras', items: extrasRoutes },
]

function sectionIcon(id: string) {
  switch (id) {
    case 'main':
      return House
    default:
      return FileText
  }
}

export function BaseNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sectionsAll.map((s) => [s.id, true]))
  )
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

  const toggleSection = (id: string) => setOpenSections((s) => ({ ...s, [id]: !s[id] }))

  const visibleSections = sectionsAll.filter((sec) => {
    if (sec.id === 'admin') return session?.user?.role === 'ADMIN'
    if (sec.id === 'dashboard') return !!session
    return true
  })

  const isRouteActive = (href: string) => {
    try {
      if (!href || href.startsWith('http')) return false
      if (href === '/') return pathname === '/'
      return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href)
    } catch {
      return false
    }
  }

  return (
    <header className="top-0 left-0 right-0 z-40 pt-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg shadow-black/5 supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl pointer-events-none" />
          <div className="relative flex h-16 items-center px-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2.5">
                <Icons.logo className="h-6 w-6" />
                <span className="emberly-text text-lg font-medium">Emberly</span>
              </Link>
            </div>

            {/* Desktop center sections */}
            <div className="hidden md:flex flex-1 justify-center">
              <div className="flex items-center space-x-1 bg-muted/20 backdrop-blur-sm rounded-xl p-1 border border-border/30">
                {visibleSections.map((sec) => (
                  <div key={sec.id} className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-9 px-4 rounded-lg font-medium border transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-background/50 border-transparent"
                        >
                          {(() => {
                            const Icon = sectionIcon(sec.id)
                            return (
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{sec.title}</span>
                                <ChevronDown className="h-3 w-3 ml-2" />
                              </div>
                            )
                          })()}
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent sideOffset={4}>
                        {sec.items.map((route) => {
                          const isActive = isRouteActive(route.href)
                          return (
                            <DropdownMenuItem asChild key={route.href}>
                              <Link href={route.href} className={`w-full inline-flex items-center text-sm px-4 py-2 ${isActive ? 'bg-secondary text-foreground' : ''}`}>
                                <route.icon className={`mr-2 h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                                <span className="font-medium">{route.label}</span>
                              </Link>
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile hamburger */}
            <div className="ml-3 flex items-center md:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex flex-col">
                  <SheetTitle>Navigation</SheetTitle>
                  <div className="mt-2 flex-1 overflow-auto pb-6">
                    {visibleSections.map((sec) => (
                      <div key={sec.id} className="mb-4 px-2">
                        <div className="w-full text-left font-medium mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = sectionIcon(sec.id)
                              return <Icon className="h-5 w-5" />
                            })()}
                            <span className="text-sm font-semibold">{sec.title}</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 transform transition-transform ${openSections[sec.id] ? 'rotate-180' : 'rotate-0'}`} />
                        </div>
                        {openSections[sec.id] && (
                          <div className="flex flex-col divide-y divide-border/40 rounded-md overflow-hidden bg-background/50">
                            {sec.items.map((route) => {
                              const active = isRouteActive(route.href)
                              return (
                                <Link
                                  key={route.href}
                                  href={route.href}
                                  onClick={() => setOpen(false)}
                                  className={`w-full inline-flex items-center px-4 py-3 gap-3 ${active ? 'bg-secondary text-foreground' : 'hover:bg-background/60'}`}
                                >
                                  <route.icon className="h-5 w-5" />
                                  <span className="font-medium">{route.label}</span>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border/30 px-3 bg-background/80 backdrop-blur-sm">
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
                        <Button variant="ghost" size="sm" onClick={() => signIn()}>
                          Sign In
                        </Button>
                        <Button asChild size="sm">
                          <Link href="/auth/register">Register</Link>
                        </Button>
                      </div>
                    )}
                  </div>

                </SheetContent>
              </Sheet>
            </div>

            <div className="ml-auto hidden md:flex items-center gap-3">
              {session ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || ''} />
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
        </div>
      </div>
    </header>
  )
}

export default BaseNav
