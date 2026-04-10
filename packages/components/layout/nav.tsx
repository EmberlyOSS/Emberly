'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

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
  Sparkles,
  Handshake,
  Gavel,
  Flag,
  ClipboardList,
  ShieldAlert,
  Database,
  LayoutDashboard,
  Shield,
} from 'lucide-react'

import { Icons } from '@/packages/components/shared/icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Button } from '@/packages/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/packages/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/packages/components/ui/dropdown-menu'

// ─── Route definitions ────────────────────────────────────────────────────────

const baseRoutes = [
  { href: '/', label: 'Home', icon: House },
  { href: '/about', label: 'About', icon: BookOpen },
  { href: '/contact', label: 'Contact', icon: Mail },
  { href: '/leaderboard', label: 'Leaderboard', icon: Users },
  { href: '/discovery', label: 'Discovery', icon: Sparkles },
  { href: '/applications', label: 'Apply', icon: ClipboardList },
  { href: '/blog', label: 'Blog', icon: Rss },
  { href: 'https://docs.embrly.ca', label: 'Docs', icon: FileText },
]

const dashboardRoutes = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/files', label: 'Files', icon: FolderOpen },
  { href: '/dashboard/upload', label: 'Upload', icon: Upload },
  { href: '/dashboard/paste', label: 'Paste', icon: Clipboard },
  { href: '/dashboard/urls', label: 'Links', icon: LinkIcon },
  { href: '/dashboard/domains', label: 'Domains', icon: Globe },
  { href: '/dashboard/analytics', label: 'Analytics', icon: ChartBar },
  { href: '/dashboard/discovery', label: 'Discovery', icon: Sparkles },
  { href: '/dashboard/bucket', label: 'Buckets', icon: Database },
]

const extrasRoutes = [
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
  { href: 'https://emberlystat.us', label: 'Status', icon: ChartBar },
  { href: '/changelogs', label: 'Changelogs', icon: GitGraph },
  { href: '/press', label: 'Press Kit', icon: FileText },
]

const adminRoutesBase = [
  { href: '/admin', label: 'Admin', icon: Shield },
  { href: '/admin/blog', label: 'Blogs', icon: BookOpen },
  { href: '/admin/legal', label: 'Legal', icon: Gavel },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: ShieldAlert },
  { href: '/admin/applications', label: 'Applications', icon: ClipboardList },
  { href: '/admin/products', label: 'Products', icon: CreditCard },
  { href: '/admin/email', label: 'Email', icon: Mail, superAdminOnly: true },
  { href: '/admin/partners', label: 'Partners', icon: Handshake },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  { href: '/admin/logs', label: 'Audit Logs', icon: ChartBar, superAdminOnly: true },
  { href: '/admin/settings', label: 'Settings', icon: Settings, superAdminOnly: true },
]

const sectionsTemplate = [
  { id: 'base', title: 'Base', icon: House, items: baseRoutes },
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, items: dashboardRoutes },
  { id: 'admin', title: 'Administration', icon: Settings, items: adminRoutesBase },
  { id: 'extras', title: 'Extras', icon: GitGraph, items: extrasRoutes },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string) {
  if (!href || href.startsWith('http')) return false
  if (href === '/' || href === '/dashboard' || href === '/admin') return pathname === href
  return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href)
}

// ─── Main component ───────────────────────────────────────────────────────────

interface NavContentProps {
  /** href for the logo link — '/' for public pages, '/dashboard' for dashboard */
  logoHref?: string
}

export function NavContent({ logoHref = '/' }: NavContentProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role as string | undefined

  const isSuperAdmin = role === 'SUPERADMIN'
  const isAdmin = role === 'ADMIN' || isSuperAdmin

  // Build admin routes filtered by role
  const adminItems = useMemo(
    () => adminRoutesBase.filter((r) => !r.superAdminOnly || isSuperAdmin),
    [isSuperAdmin]
  )

  // Build visible sections based on auth state
  const sections = useMemo(
    () =>
      sectionsTemplate
        .map((sec) => (sec.id === 'admin' ? { ...sec, items: adminItems } : sec))
        .filter((sec) => {
          if (sec.id === 'admin') return isAdmin
          if (sec.id === 'dashboard') return !!session
          return true
        }),
    [adminItems, isAdmin, session]
  )

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sectionsTemplate.map((s) => [s.id, s.id === 'base' || s.id === 'extras']))
  )

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))

  // ── Drag-to-dismiss logic ─────────────────────────────────────────────────
  const drawerRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragOffset = useRef(0)
  const isDragging = useRef(false)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true
    dragStartY.current = e.clientY
    dragOffset.current = 0
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !drawerRef.current) return
    const dy = Math.max(0, e.clientY - dragStartY.current)
    dragOffset.current = dy
    drawerRef.current.style.transform = `translateY(${dy}px)`
    drawerRef.current.style.transition = 'none'
  }, [])

  const onPointerUp = useCallback(() => {
    if (!isDragging.current || !drawerRef.current) return
    isDragging.current = false
    drawerRef.current.style.transition = ''
    if (dragOffset.current > 100) {
      drawerRef.current.style.transform = ''
      setSheetOpen(false)
    } else {
      drawerRef.current.style.transform = 'translateY(0)'
    }
    dragOffset.current = 0
  }, [setSheetOpen])

  return (
    <div className="relative flex h-16 items-center px-6 mt-1">
      {/* Logo */}
      <Link href={logoHref} className="flex items-center space-x-2.5 group shrink-0">
        <Icons.logo className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
        <span className="emberly-text text-lg font-medium">Emberly</span>
      </Link>

      {/* Desktop nav — centered dropdown pill */}
      <div className="hidden md:flex flex-1 justify-center">
        <div className="flex items-center space-x-0.5 bg-background/80 backdrop-blur-lg rounded-2xl p-1.5 border border-border/50 shadow-lg shadow-black/5">
          {sections.map((sec) => {
            const SectionIcon = sec.icon

            // Dashboard and Admin render as simple links on desktop
            if (sec.id === 'dashboard' || sec.id === 'admin') {
              const href = sec.items[0].href
              const active = isActive(pathname, href)
              return (
                <Button
                  key={sec.id}
                  variant="ghost"
                  className={`h-9 px-4 rounded-xl font-medium transition-all duration-200 hover:bg-background/90 focus-visible:ring-0 ${
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  asChild
                >
                  <Link href={href}>
                    <SectionIcon className="h-4 w-4" />
                    <span className="mx-1.5">{sec.title}</span>
                  </Link>
                </Button>
              )
            }

            return (
              <DropdownMenu
                key={sec.id}
                onOpenChange={(open) => setOpenMenus((prev) => ({ ...prev, [sec.id]: open }))}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 px-4 rounded-xl font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-background/90 focus-visible:ring-0"
                  >
                    <SectionIcon className="h-4 w-4" />
                    <span className="mx-1.5">{sec.title}</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${
                        openMenus[sec.id] ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  sideOffset={8}
                  align="center"
                  className="min-w-72 p-1.5"
                >
                  <div className="grid grid-cols-2 gap-0.5">
                    {sec.items.map((route) => {
                      const active = isActive(pathname, route.href)
                      return (
                        <DropdownMenuItem asChild key={route.href}>
                          <Link
                            href={route.href}
                            className={`inline-flex items-center w-full gap-2 px-3 py-1.5 text-sm rounded-md ${
                              active ? 'bg-secondary text-foreground font-medium' : ''
                            }`}
                          >
                            <route.icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                            {route.label}
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          })}
        </div>
      </div>

      {/* Desktop right — avatar or auth buttons */}
      <div className="hidden md:flex ml-auto items-center gap-3 shrink-0">
        {session ? (
          <Button variant="ghost" className="h-9 w-9 rounded-full p-0" asChild>
            <Link href="/me">
              <Avatar className="h-9 w-9">
                <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? ''} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
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

      {/* Mobile — sheet trigger */}
      <div className="ml-auto flex md:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              {session ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? ''} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent ref={drawerRef} side="bottom" className="flex flex-col bg-background/80 backdrop-blur-xl border-border/50 p-0 max-h-[85dvh] rounded-t-2xl [&>button:has(.sr-only)]:hidden">
            {/* Drag handle / bezel */}
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/40" />
            </div>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex-1 overflow-auto px-4 pb-6 space-y-2">
              {sections.filter(s => s.id !== 'dashboard' && s.id !== 'admin').map((sec) => {
                const SectionIcon = sec.icon
                const isOpen = openSections[sec.id]
                return (
                  <div key={sec.id}>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-background/60"
                      onClick={() => toggleSection(sec.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <SectionIcon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span>{sec.title}</span>
                      </div>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-1 ml-3 space-y-0.5">
                        {sec.items.map((route) => {
                          const active = isActive(pathname, route.href)
                          return (
                            <Link
                              key={route.href}
                              href={route.href}
                              onClick={() => setSheetOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                                active
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                              }`}
                            >
                              <route.icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                              {route.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Mobile footer auth */}
            <div className="px-4 py-3 border-t border-border/30 safe-area-bottom">
              {session ? (
                <div className="space-y-0.5">
                  <Link
                    href="/me"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-background/60 transition-colors"
                    onClick={() => setSheetOpen(false)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? ''} />
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                    Profile
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-background/60 transition-colors"
                    onClick={() => setSheetOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-background/60 transition-colors"
                      onClick={() => setSheetOpen(false)}
                    >
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 text-sm text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                    onClick={() => {
                      setSheetOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSheetOpen(false)
                      signIn()
                    }}
                  >
                    Sign In
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth/register" onClick={() => setSheetOpen(false)}>
                      Register
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
