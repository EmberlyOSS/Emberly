'use client'

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import {
  AlertTriangle,
  Bug,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  LayoutDashboard,
  MessageCircle,
  RefreshCcw,
} from 'lucide-react'

import { DynamicBackground } from '@/packages/components/layout/dynamic-background'
import { BaseNav } from '@/packages/components/layout/base-nav'
import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  const message = error?.message || 'An unexpected error occurred'
  const stack = String((error as any)?.stack || '')
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    Sentry.captureException(error)

    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message || 'Unknown error',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        stack: error.stack?.slice(0, 2000),
        type: 'client',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      }),
    }).catch(() => {}) // Never throw from error handler
  }, [error]) // Only run when error changes

  const handleCopy = async () => {
    const errorInfo = `Error: ${message}\n\nDigest: ${error?.digest || 'N/A'}\n\n${isDev ? `Stack:\n${stack}` : ''}`
    try {
      await navigator.clipboard.writeText(errorInfo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { }
  }

  return (
    <div className="relative flex flex-col min-h-screen">
      <DynamicBackground />

      <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg p-2">
            <div className="relative flex h-16 items-center px-6">
              <BaseNav />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full pt-28 relative z-10">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-6 space-y-6">
          {/* Main Error Card */}
          <GlassCard>
            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Error Icon */}
                <div className="flex-shrink-0">
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="h-10 w-10 text-red-500" />
                  </div>
                </div>

                {/* Error Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge variant="destructive" className="text-sm">
                      <Bug className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                    {error?.digest && (
                      <Badge variant="secondary" className="bg-background/50 font-mono text-xs">
                        Code: {error.digest}
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    Something went
                    <span className="block bg-gradient-to-r from-destructive via-destructive/80 to-primary bg-clip-text text-transparent">
                      wrong
                    </span>
                  </h1>

                  <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
                    We hit a snag while loading this page. You can try again,
                    head back to the dashboard, or copy the error details below
                    if you need to report it.
                  </p>

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={reset} size="lg" className="group">
                      <RefreshCcw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                      Try Again
                    </Button>
                    <Button variant="outline" size="lg" asChild className="bg-background/50">
                      <Link href="/dashboard">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Go to Dashboard
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Error Details Accordion */}
              <div className="mt-8 pt-6 border-t border-border/40">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {showDetails ? 'Hide' : 'Show'} error details
                </button>

                {showDetails && (
                  <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Error Message */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Error Message
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopy}
                          className="h-7 text-xs"
                        >
                          {copied ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <ClipboardCopy className="h-3 w-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm break-words font-mono">{message}</p>
                    </div>

                    {/* Stack Trace (Dev only) */}
                    {isDev && stack && (
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Stack Trace
                        </span>
                        <pre className="mt-2 text-xs overflow-auto max-h-48 text-muted-foreground font-mono whitespace-pre-wrap">
                          {stack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Report Issue */}
          <GlassCard>
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Bug className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Think this is a bug?</p>
                  <p className="text-xs text-muted-foreground">
                    Let us know so we can fix it
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="bg-background/50">
                  <Link href="/discord">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Report on Discord
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="bg-background/50">
                  <Link href="https://github.com/EmberlyOSS/Emberly/issues" target="_blank">
                    <Bug className="h-4 w-4 mr-2" />
                    GitHub Issue
                  </Link>
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  )
}
