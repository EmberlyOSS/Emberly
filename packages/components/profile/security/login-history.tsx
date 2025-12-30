'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
    Monitor,
    Smartphone,
    Globe,
    MapPin,
    Clock,
    Shield,
    AlertTriangle,
    RefreshCw,
    LogOut,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/packages/components/ui/alert-dialog'
import { useToast } from '@/packages/hooks/use-toast'

interface LoginEntry {
    id: string
    ip: string | null
    userAgent: string | null
    fingerprint: string | null
    country: string | null
    city: string | null
    createdAt: string
}

interface SessionInfo {
    sessionVersion: number
    lastLoginAt: string | null
    lastLoginIp: string | null
    lastLoginUserAgent: string | null
}

function parseUserAgent(userAgent: string | null): { device: string; browser: string; os: string } {
    if (!userAgent) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' }

    const ua = userAgent.toLowerCase()

    // Detect device type
    let device = 'Desktop'
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        device = 'Mobile'
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
        device = 'Tablet'
    }

    // Detect OS
    let os = 'Unknown'
    if (ua.includes('windows')) os = 'Windows'
    else if (ua.includes('mac os') || ua.includes('macos')) os = 'macOS'
    else if (ua.includes('linux')) os = 'Linux'
    else if (ua.includes('android')) os = 'Android'
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'

    // Detect browser
    let browser = 'Unknown'
    if (ua.includes('firefox')) browser = 'Firefox'
    else if (ua.includes('edg/')) browser = 'Edge'
    else if (ua.includes('chrome')) browser = 'Chrome'
    else if (ua.includes('safari')) browser = 'Safari'
    else if (ua.includes('opera') || ua.includes('opr/')) browser = 'Opera'

    return { device, browser, os }
}

function DeviceIcon({ userAgent }: { userAgent: string | null }) {
    const { device } = parseUserAgent(userAgent)
    if (device === 'Mobile') {
        return <Smartphone className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
}

export function LoginHistory() {
    const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([])
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRevoking, setIsRevoking] = useState(false)
    const [showAll, setShowAll] = useState(false)
    const { toast } = useToast()

    const fetchSessions = async () => {
        try {
            setIsLoading(true)
            const res = await fetch('/api/profile/sessions?limit=50')
            if (!res.ok) throw new Error('Failed to fetch sessions')
            const data = await res.json()
            setLoginHistory(data.loginHistory || [])
            setSessionInfo(data.sessionInfo || null)
        } catch (error) {
            console.error('Error fetching sessions:', error)
            toast({
                title: 'Error',
                description: 'Failed to load login history',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSessions()
    }, [])

    const handleRevokeAll = async () => {
        try {
            setIsRevoking(true)
            const res = await fetch('/api/profile/sessions', { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to revoke sessions')

            toast({
                title: 'Sessions Revoked',
                description: 'All sessions have been revoked. Please log in again.',
            })

            // Sign out after a brief delay
            setTimeout(() => {
                window.location.href = '/auth/login?revoked=true'
            }, 1500)
        } catch (error) {
            console.error('Error revoking sessions:', error)
            toast({
                title: 'Error',
                description: 'Failed to revoke sessions',
                variant: 'destructive',
            })
        } finally {
            setIsRevoking(false)
        }
    }

    const displayedHistory = showAll ? loginHistory : loginHistory.slice(0, 5)

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Login History & Sessions</h3>
                </div>
                <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold">Login History & Sessions</h3>
                    <p className="text-sm text-muted-foreground">
                        View your recent login activity and manage active sessions
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchSessions}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isRevoking} className="flex-1 sm:flex-none">
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out Everywhere
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Sign out of all devices?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will invalidate all your current sessions and sign you out everywhere, including this device. You will need to log in again.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleRevokeAll}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isRevoking ? 'Signing out...' : 'Sign Out Everywhere'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Current Session Info */}
            {sessionInfo && sessionInfo.lastLoginAt && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Current Session</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                            Active
                        </Badge>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="break-words">
                                Last login: {formatDistanceToNow(new Date(sessionInfo.lastLoginAt), { addSuffix: true })}
                            </span>
                        </div>
                        {sessionInfo.lastLoginIp && (
                            <div className="flex items-center gap-2">
                                <Globe className="h-3 w-3 flex-shrink-0" />
                                <span className="break-all">IP: {sessionInfo.lastLoginIp}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Login History */}
            <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Recent Logins</div>
                {loginHistory.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No login history available</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            {displayedHistory.map((entry, index) => {
                                const { device, browser, os } = parseUserAgent(entry.userAgent)
                                const isRecent = index === 0
                                const hasDeviceInfo = entry.userAgent && browser !== 'Unknown' && os !== 'Unknown'
                                const displayText = hasDeviceInfo
                                    ? `${browser} on ${os}`
                                    : entry.ip
                                        ? `Login from ${entry.ip}`
                                        : 'Login recorded'

                                return (
                                    <div
                                        key={entry.id}
                                        className={`rounded-lg border p-3 transition-colors ${isRecent
                                            ? 'border-primary/30 bg-primary/5'
                                            : 'border-border/50 bg-background/50 hover:bg-muted/30'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${isRecent ? 'bg-primary/10' : 'bg-muted/50'}`}>
                                                <DeviceIcon userAgent={entry.userAgent} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-sm break-words">
                                                        {displayText}
                                                    </span>
                                                    {isRecent && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Most Recent
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 sm:gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                                                    {entry.ip && hasDeviceInfo && (
                                                        <div className="flex items-center gap-1">
                                                            <Globe className="h-3 w-3 flex-shrink-0" />
                                                            <span className="break-all">{entry.ip}</span>
                                                        </div>
                                                    )}
                                                    {(entry.city || entry.country) && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3 flex-shrink-0" />
                                                            <span className="break-words">
                                                                {[entry.city, entry.country].filter(Boolean).join(', ')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3 flex-shrink-0" />
                                                        <span title={format(new Date(entry.createdAt), 'PPpp')} className="break-words">
                                                            {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {loginHistory.length > 5 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => setShowAll(!showAll)}
                            >
                                {showAll ? (
                                    <>
                                        <ChevronUp className="h-4 w-4 mr-2" />
                                        Show Less
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4 mr-2" />
                                        Show {loginHistory.length - 5} More
                                    </>
                                )}
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
