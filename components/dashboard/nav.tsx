'use client'

import { useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
import { useSession } from 'next-auth/react'

import { Icons } from '@/components/shared/icons'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const baseRoutes = [
  {
    href: '/',
    label: 'Home',
    icon: House,
  },
  {
    href: '/about',
    label: 'About',
    icon: BookOpen,
  },
  {
    href: '/blog',
    label: 'Blog',
    icon: Rss,
  },
  {
    href: '/contact',
    label: 'Contact',
    icon: Mail,
  },
  {
    href: '/docs',
    label: 'Docs',
    icon: FileText,
  },
  {
    href: '/pricing',
    label: 'Pricing',
    icon: CreditCard,
  },
  {
    href: 'https://status.emberly.site',
    label: 'Status',
    icon: ChartBar,
  }
]

const dashboardRoutes = [
  {
    href: '/dashboard',
    label: 'Files',
    icon: FolderOpen,
  },
  {
    href: '/dashboard/upload',
    label: 'Upload',
    icon: Upload,
  },
  {
    href: '/dashboard/paste',
    label: 'Paste',
    icon: Clipboard,
  },
  {
    href: '/dashboard/urls',
    label: 'Links',
    icon: LinkIcon,
  },
  {
    href: '/dashboard/domains',
    label: 'Domains',
    icon: Globe,
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: ChartBar
  }
]

const adminRoutes = [
  {
    href: '/dashboard/blog',
    label: 'Blog',
    icon: FileText,
  },
  {
    href: '/dashboard/users',
    label: 'Users',
    icon: Users,
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: Settings,
  },
]

const sections = [
  { id: 'main', title: 'Base', items: baseRoutes },
  { id: 'dashboard', title: 'Dashboard', items: dashboardRoutes },
  { id: 'admin', title: 'Administration', items: adminRoutes },
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
  const [hoverSection, setHoverSection] = useState<string | null>(null)

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
          <SheetContent side="right">
            <SheetTitle>Navigation</SheetTitle>
            <div className="mt-4 h-[calc(100vh-6rem)] overflow-auto">
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
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex flex-1 justify-center">
        <div className="flex items-center space-x-1 bg-muted/20 backdrop-blur-sm rounded-xl p-1 border border-border/30">
          {visibleSections.map((sec) => (
            <div
              key={sec.id}
              className="relative group"
              onMouseEnter={() => setHoverSection(sec.id)}
              onMouseLeave={() => setHoverSection(null)}
            >
              <div className="flex">
                <Button
                  variant="ghost"
                  className="h-9 px-4 rounded-lg font-medium border transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-background/50 border-transparent"
                  onFocus={() => setHoverSection(sec.id)}
                  onBlur={() => setHoverSection(null)}
                >
                  {(() => {
                    const Icon = sectionIcon(sec.id)
                    return (
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${hoverSection === sec.id ? 'text-foreground' : ''}`} />
                        <span>{sec.title}</span>
                        <ChevronDown className={`h-3 w-3 ml-2 transition-transform ${hoverSection === sec.id ? 'rotate-180' : 'rotate-0'}`} />
                      </div>
                    )
                  })()}
                </Button>
              </div>
              <div className={`absolute top-full left-0 mt-0 z-50 min-w-[160px] ${hoverSection === sec.id ? 'block' : 'hidden'} group-hover:block`}>
                <div className="bg-background rounded shadow-lg border border-border/30 py-2">
                  {sec.items.map((route) => {
                    const isActive = pathname === route.href
                    return (
                      <Link
                        key={route.href}
                        href={route.href}
                        className={`w-full inline-flex items-center text-sm px-4 py-2 ${isActive ? 'bg-secondary text-foreground' : 'hover:bg-secondary/50'}`}
                      >
                        <route.icon className={`mr-2 h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                        <span className="font-medium">{route.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}
