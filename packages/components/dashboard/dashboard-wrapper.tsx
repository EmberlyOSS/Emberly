import { DashboardNav } from '@/packages/components/dashboard/nav'
import { GlobalDropZone } from '@/packages/components/dashboard/global-drop-zone'
import { DynamicBackground } from '@/packages/components/layout/dynamic-background'

interface DashboardWrapperProps {
  children: React.ReactNode
  showFooter: boolean
  maxUploadSize: number
  nav?: 'base' | 'dashboard'
}

export function DashboardWrapper({
  children,
  showFooter,
  maxUploadSize,
  nav = 'dashboard',
}: DashboardWrapperProps) {
  return (
    <div className="relative flex flex-col flex-1 min-h-screen overflow-hidden">
      <DynamicBackground />
      <GlobalDropZone maxSize={maxUploadSize} />

      {nav === 'dashboard' && (
        <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="relative bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-lg shadow-black/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl pointer-events-none" />
              <div className="relative">
                <DashboardNav />
              </div>
            </div>
          </div>
        </header>
      )}
      <main className="flex-1 w-full pt-24 relative z-10">
        <div className="max-w-7xl mx-auto py-6 px-4">{children}</div>
      </main>
    </div>
  )
}
