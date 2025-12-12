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
  Settings,
  Upload,
  Users,
  Globe,
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
    icon: FileText,
  },
  {
    href: '/blog',
    label: 'Blog',
    icon: Upload,
  },
  {
    href: '/contact',
    label: 'Contact',
    icon: FileText,
  },
  {
    href: '/docs',
    label: 'Docs',
    icon: LinkIcon,
  },
  {
    href: '/pricing',
    label: 'Pricing',
    icon: Globe,
  },
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
    icon: FileText,
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
            <div className="mt-4">
              {visibleSections.map((sec) => (
                <div key={sec.id} className="mb-4">
                  <button
                    className="w-full text-left font-medium mb-2"
                    onClick={() => toggleSection(sec.id)}
                  >
                    {sec.title}
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
          {sections.map((sec) => (
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
                  {sec.title}
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
