'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signIn, signOut, useSession } from 'next-auth/react'

import {
  FileText,
  FolderOpen,
  House,
  LinkIcon,
  Menu,
  ChevronDown,
  Mail,
  MessageSquare,
  Rss,
  Clipboard,
  BookOpen,
  CreditCard,
  Settings,
  Upload,
  Users,
  Globe,
  GitGraph,
  Handshake,
  ChartBar,
  Gavel,
} from 'lucide-react'

import { Icons } from '@/packages/components/shared/icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Button } from '@/packages/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/packages/components/ui/sheet'


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  { href: '/status', label: 'Status', icon: ChartBar },
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
  { href: '/admin/products', label: 'Products', icon: CreditCard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/email', label: 'Email', icon: Mail },
  { href: '/admin/partners', label: 'Partners', icon: Handshake },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

const sections = [
  { id: 'base', title: 'Base', items: baseRoutes },
  { id: 'dashboard', title: 'Dashboard', items: dashboardRoutes },
  { id: 'admin', title: 'Administration', items: adminRoutes },
  { id: 'extras', title: 'Extras', items: extrasRoutes },
]

function sectionIcon(id: string) {
  switch (id) {
    case 'main':
      return House
    case 'dashboard':
      return FolderOpen
    case 'admin':
      return Settings
    default:
      return FileText
  }
}

export function DashboardNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const adminItems = useMemo(
    () =>
      adminRoutes.filter(
        (route) =>
          !['/admin/settings', '/admin/email'].includes(route.href) ||
          session?.user?.role === 'SUPERADMIN'
      ),
    [session?.user?.role]
  )
  const computedSections = useMemo(
    () => sections.map((sec) => (sec.id === 'admin' ? { ...sec, items: adminItems } : sec)),
    [adminItems]
  )
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(computedSections.map((s) => [s.id, s.id === 'base']))
  )
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(computedSections.map((s) => [s.id, false]))
  )

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const visibleSections = computedSections.filter(
    (sec) => sec.id !== 'admin' || session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
  )

  const toggleSection = (id: string) => {
    setOpenSections((s) => ({ ...s, [id]: !s[id] }))
  }

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
    <nav className="flex items-center w-full h-16 px-6">
      <div className="flex items-center">
        <Link href="/dashboard" className="flex items-center space-x-2.5 group">
          <Icons.logo className="h-6 w-6 transition-transform group-hover:scale-110" />
          <span className="emberly-text text-lg font-medium">Emberly</span>
        </Link>
      </div>

      {/* Mobile sheet */}
      <div className="flex md:hidden ml-auto">
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

      {/* Desktop */}
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
                    className="h-9 px-4 rounded-xl font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-white/10 dark:hover:bg-white/5"
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
                        <Link
                          href={route.href}
                          className={`w-full inline-flex items-center text-sm px-4 py-2 ${isActive ? 'bg-secondary text-foreground' : ''}`}
                        >
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

      <div className="ml-auto hidden md:flex items-center gap-3">
        {session ? (
          <Button variant="ghost" className="relative h-9 w-9 rounded-full" asChild>
            <Link href="/dashboard/profile">
              <Avatar className="h-9 w-9">
                <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || ''} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Link>
          </Button>
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
    </nav>
  )
}