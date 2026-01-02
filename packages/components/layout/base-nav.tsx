"use client"

import { useEffect, useMemo, useRef, useState } from 'react'

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
  MessageSquare,
  Menu,
  FolderOpen,
  Upload,
  Clipboard,
  Link as LinkIcon,
  Globe,
  Users,
  Settings,
  GitGraph,
  Handshake,
  Gavel,
} from 'lucide-react'

import { Icons } from '@/packages/components/shared/icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Button } from '@/packages/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/packages/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/packages/components/ui/dropdown-menu'

const baseRoutes = [
  { href: '/', label: 'Home', icon: House },
  { href: '/about', label: 'About', icon: BookOpen },
  { href: '/contact', label: 'Contact', icon: Mail },
  { href: '/blog', label: 'Blog', icon: Rss },
  { href: '/docs', label: 'Docs', icon: BookOpen },
  { href: '/press', label: 'Press', icon: FileText },
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
  { href: '/admin/blog', label: 'Blogs', icon: BookOpen },
  { href: '/admin/docs', label: 'Docs', icon: FileText },
  { href: '/admin/legal', label: 'Legal', icon: Gavel },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/products', label: 'Products', icon: CreditCard },
  { href: '/admin/partners', label: 'Partners', icon: Handshake },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

const sectionsAll = [
  { id: 'base', title: 'Base', items: baseRoutes },
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
  const adminItems = useMemo(
    () => adminRoutes.filter((route) => route.href !== '/admin/settings' || session?.user?.role === 'SUPERADMIN'),
    [session?.user?.role]
  )
  const sections = useMemo(
    () => sectionsAll.map((sec) => (sec.id === 'admin' ? { ...sec, items: adminItems } : sec)),
    [adminItems]
  )
  const [open, setOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.id, s.id === 'base']))
  )
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.id, false]))
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

  const visibleSections = sections.filter((sec) => {
    if (sec.id === 'admin') return session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
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
    <header className="fixed top-0 left-0 right-0 z-40 pt-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-lg shadow-black/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl pointer-events-none" />
          <div className="relative flex h-16 items-center px-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2.5 group">
                <Icons.logo className="h-6 w-6 transition-transform group-hover:scale-110" />
                <span className="emberly-text text-lg font-medium">Emberly</span>
              </Link>
            </div>

            {/* Desktop center sections */}
            <div className="hidden md:flex flex-1 justify-center">
              <div className="flex items-center space-x-1 bg-white/5 dark:bg-black/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 dark:border-white/5 shadow-lg shadow-black/5">
                {visibleSections.map((sec) => (
                  <div key={sec.id} className="relative">
                    <DropdownMenu
                      onOpenChange={(isOpen) =>
                        setOpenMenus((prev) => ({ ...prev, [sec.id]: isOpen }))
                      }
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-9 px-4 rounded-xl font-medium transition-all duration-200 text-muted-foreground hover:text-primary hover:bg-white/10 dark:hover:bg-white/5"
                        >
                          {(() => {
                            const Icon = sectionIcon(sec.id)
                            return (
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{sec.title}</span>
                                <ChevronDown
                                  className={`h-3 w-3 ml-2 transition-transform duration-200 ${openMenus[sec.id] ? 'rotate-180' : ''
                                    }`}
                                />
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

            {/* Mobile sheet trigger (moved to right) */}
            <div className="ml-auto flex items-center md:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {session ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || ''} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex flex-col">
                  <SheetTitle>Navigation</SheetTitle>
                  <div className="mt-2 flex-1 overflow-auto pb-6">
                    {visibleSections.map((sec) => (
                      <div key={sec.id} className="mb-4 px-2">
                        <div
                          className="w-full text-left font-medium mb-2 flex items-center justify-between cursor-pointer"
                          onClick={() => toggleSection(sec.id)}
                          role="button"
                          tabIndex={0}
                        >
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
                        <Link href="/dashboard/profile" className="block text-sm" onClick={() => setOpen(false)}>
                          Profile
                        </Link>
                        <Link href="/dashboard" className="block text-sm" onClick={() => setOpen(false)}>
                          Dashboard
                        </Link>
                        <button
                          className="w-full text-left text-sm text-red-600"
                          onClick={() => {
                            setOpen(false)
                            signOut({ callbackUrl: '/' })
                          }}
                        >
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { signIn(); setOpen(false) }}>
                          Sign In
                        </Button>
                        <Button asChild size="sm">
                          <Link href="/auth/register" onClick={() => setOpen(false)}>Register</Link>
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
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" asChild>
                    <Link href="/dashboard/profile">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || ''} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </Link>
                  </Button>
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