"use client"

import React, { useEffect, useState } from 'react'
import {
    BarChart3,
    Download,
    Eye,
    File,
    Globe,
    HardDrive,
    Link2,
    RefreshCw,
    TrendingUp,
    Upload,
    ExternalLink,
    Clock,
    FileText,
    Zap,
    Shield,
} from 'lucide-react'
import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import { Progress } from '@/packages/components/ui/progress'
import { useToast } from '@/packages/hooks/use-toast'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts'

// Glass card component for consistent styling
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`glass-card ${className}`}>
            {children}
        </div>
    )
}

// Stat card with icon
function StatCard({ icon: Icon, label, value, subtitle, color = 'primary' }: {
    icon: React.ElementType
    label: string
    value: string | number
    subtitle?: string
    color?: 'primary' | 'green' | 'blue' | 'orange' | 'purple'
}) {
    const colorClasses = {
        primary: 'text-primary bg-primary/10',
        green: 'text-green-500 bg-green-500/10',
        blue: 'text-blue-500 bg-blue-500/10',
        orange: 'text-orange-500 bg-orange-500/10',
        purple: 'text-purple-500 bg-purple-500/10',
    }

    return (
        <GlassCard>
            <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
                        <p className="text-2xl sm:text-3xl font-bold mt-1 truncate">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className={`p-2 sm:p-3 rounded-xl ${colorClasses[color]}`}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                </div>
            </div>
        </GlassCard>
    )
}

// Format file sizes — File.size is stored in MB in the database
function formatBytes(mb: number | null | undefined): string {
    if (mb === null || mb === undefined || isNaN(mb) || mb <= 0) return '0 B'
    const bytes = mb * 1024 * 1024
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
    if (i < 0 || !isFinite(i)) return '0 B'
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Format large numbers
function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-lg">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold">{payload[0].value}</p>
        </div>
    )
}

// Gated overlay for premium features
function GatedOverlay({ required }: { required: string }) {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <div className="relative text-center space-y-3">
                <Badge variant="secondary" className="text-xs">
                    {required} Feature
                </Badge>
                <p className="text-sm text-muted-foreground">Upgrade to unlock this feature</p>
                <Button asChild size="sm">
                    <a href="/pricing">
                        <Zap className="h-4 w-4 mr-2" />
                        Upgrade Now
                    </a>
                </Button>
            </div>
        </div>
    )
}

const CHART_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B']

export default function AnalyticsOverview() {
    const [data, setData] = useState<any | null>(null)
    const [storageData, setStorageData] = useState<any | null>(null)
    const [activityData, setActivityData] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const { toast } = useToast()

    const loadData = async () => {
        try {
            const [overviewRes, storageRes, activityRes] = await Promise.all([
                fetch('/api/analytics/overview'),
                fetch('/api/analytics/storage'),
                fetch('/api/analytics/metrics/activity'),
            ])

            if (overviewRes.ok) {
                const overview = await overviewRes.json()
                setData(overview)
            }

            if (storageRes.ok) {
                const storage = await storageRes.json()
                setStorageData(storage)
            }

            if (activityRes.ok) {
                const activity = await activityRes.json()
                setActivityData(activity)
            }
        } catch (e) {
            console.error('Failed to load analytics', e)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleRefresh = () => {
        setRefreshing(true)
        loadData()
    }

    const handleExport = async () => {
        try {
            const res = await fetch('/api/analytics/export')
            if (res.status === 403) {
                toast({ title: 'Upgrade required', description: 'CSV export is available for Pro users', variant: 'destructive' })
                return
            }
            if (!res.ok) throw new Error('Export failed')
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast({ title: 'Export ready', description: 'CSV downloaded successfully' })
        } catch (e) {
            toast({ title: 'Export failed', description: 'Could not export analytics', variant: 'destructive' })
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <GlassCard>
                    <div className="p-6 sm:p-8">
                        <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
                        <div className="h-4 w-72 bg-muted/30 rounded mt-2 animate-pulse" />
                    </div>
                </GlassCard>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[...Array(4)].map((_, i) => (
                        <GlassCard key={i}>
                            <div className="p-4 sm:p-6">
                                <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
                                <div className="h-8 w-16 bg-muted/30 rounded mt-2 animate-pulse" />
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <GlassCard>
                <div className="p-8 text-center">
                    <p className="text-muted-foreground">Could not load analytics data.</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </GlassCard>
        )
    }

    const basic = data.basic || {}
    const uploadsPerDay = data.uploadsPerDay || []
    const storageBreakdown = storageData?.breakdown || []
    const storageTotalBytes = storageData?.totalBytes ?? basic.storageUsed ?? 0
    const quotaInfo = data.quotaInfo
    const planInfo = data.planInfo

    // Merge upload count + daily MB into a combined chart dataset
    const storageDaily = storageData?.daily || []
    const combinedDailyData = uploadsPerDay.map((d: any) => {
        const storageDay = storageDaily.find((s: any) => s.date === d.date)
        return { ...d, mb: Number((storageDay?.bytes ?? 0).toFixed(2)) }
    })

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
                {data.allowed?.exportCSV ? (
                    <Button size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                ) : (
                    <Button size="sm" variant="secondary" asChild>
                        <a href="/pricing">
                            <Zap className="h-4 w-4 mr-2" />
                            Upgrade
                        </a>
                    </Button>
                )}
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    icon={File}
                    label="Total Files"
                    value={formatNumber(basic.totalFiles ?? 0)}
                    subtitle={`${formatBytes(storageTotalBytes)} used`}
                    color="primary"
                />
                <StatCard
                    icon={Eye}
                    label="Total Views"
                    value={formatNumber(basic.totalViews ?? 0)}
                    subtitle="All time file views"
                    color="blue"
                />
                <StatCard
                    icon={Download}
                    label="Downloads"
                    value={formatNumber(basic.totalDownloads ?? 0)}
                    subtitle="All time downloads"
                    color="green"
                />
                <StatCard
                    icon={Link2}
                    label="Short URLs"
                    value={formatNumber(basic.totalUrls ?? 0)}
                    subtitle={`${formatNumber(basic.totalUrlClicks ?? 0)} clicks`}
                    color="purple"
                />
            </div>

            {/* Plan & Quota */}
            {(quotaInfo || planInfo) && (
                <GlassCard>
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold">Plan &amp; Usage</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    {planInfo?.planName ?? 'Spark (Free)'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary">{planInfo?.planName ?? 'Spark'}</Badge>
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Shield className="h-4 w-4 text-primary" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            {/* Storage bar */}
                            {quotaInfo && (
                                <div className="sm:col-span-2 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Storage</span>
                                        <span className="font-medium">
                                            {formatBytes(quotaInfo.usedMB)}{' '}
                                            <span className="text-muted-foreground font-normal">
                                                / {planInfo?.storageQuotaGB === null ? '∞' : formatBytes((planInfo?.storageQuotaGB ?? 10) * 1024)}
                                            </span>
                                        </span>
                                    </div>
                                    <Progress
                                        value={Math.min(quotaInfo.percentageUsed, 100)}
                                        className={`h-2 ${quotaInfo.percentageUsed > 90 ? '[&>div]:bg-red-500' : quotaInfo.percentageUsed > 75 ? '[&>div]:bg-orange-500' : ''}`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {quotaInfo.percentageUsed.toFixed(1)}% used
                                        {quotaInfo.percentageUsed > 90 && (
                                            <span className="text-red-500 ml-2">⚠ Storage critically low</span>
                                        )}
                                    </p>
                                </div>
                            )}
                            {/* Limits summary */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Upload cap</span>
                                    <span className="font-medium">
                                        {planInfo?.uploadSizeCapMB === null ? '∞ Unlimited' : `${planInfo?.uploadSizeCapMB ?? 500} MB`}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Custom domains</span>
                                    <span className="font-medium">
                                        {basic.domainsCount ?? 0}
                                        {' / '}
                                        {planInfo?.customDomainsLimit === null ? '∞' : (planInfo?.customDomainsLimit ?? 3)}
                                    </span>
                                </div>
                                {!data.allowed?.exportCSV && (
                                    <Button asChild size="sm" variant="outline" className="w-full mt-2">
                                        <a href="/pricing"><Zap className="h-3 w-3 mr-1" />Upgrade Plan</a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Uploads Chart - 2 cols */}
                <GlassCard className="lg:col-span-2">
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold">Upload Activity</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">Files &amp; volume uploaded per day (last 14 days)</p>
                            </div>
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Upload className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                        <div className="h-[200px] sm:h-[250px]">
                            {combinedDailyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={combinedDailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis yAxisId="count" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="mb" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}MB`} />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (!active || !payload?.length) return null
                                                return (
                                                    <div className="bg-background/95 border border-border rounded-lg p-3 shadow-lg text-sm space-y-1">
                                                        <p className="font-medium">{new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                                        {payload.map((p: any) => (
                                                            <p key={p.dataKey} style={{ color: p.color }}>
                                                                {p.dataKey === 'count' ? `${p.value} file${p.value !== 1 ? 's' : ''}` : `${Number(p.value).toFixed(2)} MB`}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )
                                            }}
                                        />
                                        <Line
                                            yAxisId="count"
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#F97316"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 4, fill: '#F97316' }}
                                            name="Files"
                                        />
                                        <Line
                                            yAxisId="mb"
                                            type="monotone"
                                            dataKey="mb"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 4, fill: '#3B82F6' }}
                                            name="MB"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    No upload data available
                                </div>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* Storage Breakdown */}
                <GlassCard>
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold">Storage</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">Usage breakdown</p>
                            </div>
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <HardDrive className="h-4 w-4 text-blue-500" />
                            </div>
                        </div>
                        <div className="text-center mb-4">
                            <p className="text-3xl sm:text-4xl font-bold">{formatBytes(storageTotalBytes)}</p>
                            <p className="text-xs text-muted-foreground">Total storage used</p>
                        </div>
                        <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-none">
                            {storageBreakdown.length > 0 ? (
                                storageBreakdown.slice(0, 6).map((item: any, i: number) => (
                                    <div key={item.mimeType} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                                            />
                                            <span className="truncate text-xs">{item.mimeType}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                            {formatBytes(item.bytes)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4">No files uploaded yet</p>
                            )}
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Top Items Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Files */}
                <GlassCard className="relative">
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold">Top Files</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">Most viewed files</p>
                            </div>
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <BarChart3 className="h-4 w-4 text-green-500" />
                            </div>
                        </div>
                        {!data.allowed?.topFiles ? (
                            <div className="h-[200px] relative">
                                <GatedOverlay required="Starter" />
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[200px] overflow-y-auto scrollbar-none">
                                {(data.topFiles || []).length > 0 ? (
                                    data.topFiles.slice(0, 5).map((file: any, i: number) => (
                                        <div key={file.id} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <span className="text-sm truncate">{file.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    {file.views ?? 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Download className="h-3 w-3" />
                                                    {file.downloads ?? 0}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">No files yet</p>
                                )}
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Top URLs */}
                <GlassCard className="relative">
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold">Top Links</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">Most clicked short URLs</p>
                            </div>
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <Link2 className="h-4 w-4 text-purple-500" />
                            </div>
                        </div>
                        {!data.allowed?.topUrls ? (
                            <div className="h-[200px] relative">
                                <GatedOverlay required="Starter" />
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[200px] overflow-y-auto scrollbar-none">
                                {(data.topUrls || []).length > 0 ? (
                                    data.topUrls.slice(0, 5).map((url: any, i: number) => (
                                        <div key={url.id} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                                                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <span className="text-sm font-mono truncate">{url.shortCode}</span>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                {url.clicks ?? 0} clicks
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">No short URLs yet</p>
                                )}
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Recent Uploads & Domains */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recent Uploads */}
                <GlassCard>
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold">Recent Uploads</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">Latest files</p>
                            </div>
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <Clock className="h-4 w-4 text-orange-500" />
                            </div>
                        </div>
                        <div className="space-y-3 max-h-[200px] overflow-y-auto scrollbar-none">
                            {(data.recentUploads || []).length > 0 ? (
                                data.recentUploads.slice(0, 5).map((file: any) => (
                                    <div key={file.id} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <span className="text-sm truncate">{file.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 text-xs text-muted-foreground">
                                            <span>{formatBytes(file.size)}</span>
                                            <span className="hidden sm:inline">•</span>
                                            <span className="hidden sm:inline">
                                                {new Date(file.uploadedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No recent uploads</p>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* Domains Card */}
                <GlassCard>
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold">Custom Domains</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">Connected domains</p>
                            </div>
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Globe className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                        <div className="flex items-center justify-center py-6">
                            <div className="text-center">
                                <p className="text-4xl sm:text-5xl font-bold">{basic.domainsCount ?? 0}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {basic.verifiedDomains ?? 0} verified
                                </p>
                                <Button variant="outline" size="sm" className="mt-4" asChild>
                                    <a href="/dashboard/domains">Manage Domains</a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Largest Files */}
            {(data.topStorageFiles || []).length > 0 && (
                <GlassCard>
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold">Largest Files</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">Files using the most storage</p>
                            </div>
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <HardDrive className="h-4 w-4 text-red-500" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {data.topStorageFiles.slice(0, 6).map((file: any, i: number) => (
                                <div key={file.id} className="flex items-center gap-2 p-2 glass-subtle">
                                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm truncate flex-1">{file.name}</span>
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                        {formatBytes(file.size)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Advanced Analytics Row: URL Creation Trend + File Engagement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* URL Creation Trend (≥glow) */}
                <GlassCard className="relative">
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold">URL Creation Trend</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">Short URLs created per day (last 30 days)</p>
                            </div>
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <TrendingUp className="h-4 w-4 text-purple-500" />
                            </div>
                        </div>
                        {!data.allowed?.topUrls ? (
                            <div className="h-[200px] relative">
                                <GatedOverlay required="Glow" />
                            </div>
                        ) : (
                            <div className="h-[200px]">
                                {(activityData?.dailyUrlCreations || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={activityData.dailyUrlCreations} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                interval={6}
                                            />
                                            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (!active || !payload?.length) return null
                                                    return (
                                                        <div className="bg-background/95 border border-border rounded-lg p-3 shadow-lg text-sm">
                                                            <p className="font-medium">{new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                                            <p style={{ color: '#8B5CF6' }}>{payload[0].value} URL{Number(payload[0].value) !== 1 ? 's' : ''} created</p>
                                                        </div>
                                                    )
                                                }}
                                            />
                                            <Bar dataKey="count" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                        No URL data available
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* File Engagement (≥flare) */}
                <GlassCard className="relative">
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold">File Engagement</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">Top files by views &amp; downloads</p>
                            </div>
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <BarChart3 className="h-4 w-4 text-green-500" />
                            </div>
                        </div>
                        {!data.allowed?.exportCSV ? (
                            <div className="h-[200px] relative">
                                <GatedOverlay required="Flare" />
                            </div>
                        ) : (
                            <div className="h-[200px]">
                                {(data.topFiles || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={[...data.topFiles].sort((a: any, b: any) => (b.downloads ?? 0) - (a.downloads ?? 0)).slice(0, 5).map((f: any) => ({ name: f.name.length > 12 ? f.name.slice(0, 12) + '…' : f.name, views: f.views ?? 0, downloads: f.downloads ?? 0 }))}
                                            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                                            layout="vertical"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (!active || !payload?.length) return null
                                                    return (
                                                        <div className="bg-background/95 border border-border rounded-lg p-3 shadow-lg text-sm space-y-1">
                                                            <p className="font-medium truncate max-w-[180px]">{label}</p>
                                                            {payload.map((p: any) => (
                                                                <p key={p.dataKey} style={{ color: p.fill }}>
                                                                    {p.dataKey === 'views' ? `${p.value} views` : `${p.value} downloads`}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )
                                                }}
                                            />
                                            <Bar dataKey="views" fill="#3B82F6" radius={[0, 3, 3, 0]} name="Views" />
                                            <Bar dataKey="downloads" fill="#10B981" radius={[0, 3, 3, 0]} name="Downloads" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                        No file engagement data yet
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
