'use client'

import { useState } from 'react'

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
  Rss,
  Clipboard,
  BookOpen,
  CreditCard,
  Settings,
  Upload,
  Users,
  Globe,
  GitGraph,
  ChartBar,
} from 'lucide-react'

import { Icons } from '@/components/shared/icons'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'


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
  { href: '/dashboard/blog', label: 'Blog', icon: FileText },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const sections = [
  { id: 'base', title: 'Base', items: baseRoutes },
  { id: 'docs', title: 'Documentation', items: docsRoutes },
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.id, true]))
  )
  const { data: session } = useSession()

  const visibleSections = sections.filter(
    (sec) => sec.id !== 'admin' || session?.user?.role === 'ADMIN'
  )

  const routes =
    session?.user?.role === 'ADMIN'
      ? [...baseRoutes, ...dashboardRoutes, ...adminRoutes]
      : [...baseRoutes, ...dashboardRoutes]

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
    <nav className="flex items-center w-full">
      <div className="flex items-center">
        <Link href="/dashboard" className="flex items-center space-x-2.5">
          <Icons.logo className="h-6 w-6" />
          <span className="emberly-text text-lg font-medium">Emberly</span>
        </Link>
      </div>

      {/* Mobile sheet */}
      <div className="flex md:hidden ml-auto">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col">
            <SheetTitle>Navigation</SheetTitle>
            <div className="mt-4 flex-1 overflow-auto pb-6">
              {visibleSections.map((sec) => (
                <div key={sec.id} className="mb-4">
                  <button
                    className="w-full text-left font-medium mb-2 flex items-center justify-between"
                    onClick={() => toggleSection(sec.id)}
                    aria-expanded={openSections[sec.id]}
                  >
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = sectionIcon(sec.id)
                        return <Icon className="h-4 w-4" />
                      })()}
                      <span>{sec.title}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transform transition-transform ${openSections[sec.id] ? 'rotate-180' : 'rotate-0'}`} />
                  </button>
                  {openSections[sec.id] && (
                    <div className="flex flex-col space-y-2">
                      {sec.items.map((route) => (
                        <Link
                          key={route.href}
                          href={route.href}
                          onClick={() => setOpen(false)}
                          className="w-full inline-flex items-center px-3 py-2 rounded-md hover:bg-background/50"
                        >
                          <route.icon className="mr-2 h-4 w-4" />
                          <span className="font-medium">{route.label}</span>
                        </Link>
                      ))}
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

      {/* Desktop */}
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

                <div className="z-50">
                  <div className="relative">
                    <div className="absolute top-full left-0 mt-0 z-50 min-w-[160px]">
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
                    </div>
                  </div>
                </div>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}
