'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowUpRight,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    ExternalLink,
    Loader2,
    RefreshCw,
    Server,
    Shield,
    Wrench,
    XCircle,
} from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { cn } from '@/packages/lib/utils'
import {
    StatusType,
    ComponentStatus,
    IncidentStatus,
    MaintenanceStatus,
    StatusSummary,
    StatusComponent,
    Incident,
    Maintenance,
    ActiveIncident,
    ActiveMaintenance,
    STATUS_COLORS,
    STATUS_BG_COLORS,
    STATUS_LABELS,
    INCIDENT_STATUS_LABELS,
    MAINTENANCE_STATUS_LABELS,
} from '@/packages/types/instatus'
import { formatRelativeTime } from '@/packages/lib/instatus'

// ============================================================================
// GlassCard Component (consistent with other pages)
// ============================================================================

function GlassCard({
    children,
    className = '',
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={cn(
                'glass-card overflow-hidden',
                className
            )}
        >
            {children}
        </div>
    )
}

// ============================================================================
// Status Badge Component
// ============================================================================

interface StatusBadgeProps {
    status: StatusType | ComponentStatus
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    pulse?: boolean
}

export function StatusBadge({
    status,
    size = 'md',
    showLabel = true,
    pulse = false,
}: StatusBadgeProps) {
    const colorClass = STATUS_COLORS[status] || 'text-muted-foreground'
    const bgClass = STATUS_BG_COLORS[status] || 'bg-muted/50'
    const label = STATUS_LABELS[status] || status

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
    }

    const dotSizes = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5',
    }

    return (
        <Badge
            variant="secondary"
            className={cn(
                'gap-1.5 font-medium border-0',
                bgClass,
                colorClass,
                sizeClasses[size]
            )}
        >
            <span
                className={cn(
                    'rounded-full',
                    dotSizes[size],
                    status === 'UP' || status === 'OPERATIONAL'
                        ? 'bg-emerald-500'
                        : status === 'DOWN' || status === 'MAJOROUTAGE'
                          ? 'bg-red-500'
                          : status === 'DEGRADED' ||
                              status === 'DEGRADEDPERFORMANCE' ||
                              status === 'PARTIALOUTAGE'
                            ? 'bg-yellow-500'
                            : status === 'UNDERMAINTENANCE'
                              ? 'bg-blue-500'
                              : 'bg-muted-foreground',
                    pulse && 'animate-pulse'
                )}
            />
            {showLabel && label}
        </Badge>
    )
}

// ============================================================================
// Status Icon Component
// ============================================================================

interface StatusIconProps {
    status: StatusType | ComponentStatus
    className?: string
}

export function StatusIcon({ status, className }: StatusIconProps) {
    const Icon =
        status === 'UP' || status === 'OPERATIONAL'
            ? CheckCircle2
            : status === 'DOWN' || status === 'MAJOROUTAGE'
              ? XCircle
              : status === 'DEGRADED' ||
                  status === 'DEGRADEDPERFORMANCE' ||
                  status === 'PARTIALOUTAGE'
                ? AlertTriangle
                : status === 'UNDERMAINTENANCE'
                  ? Wrench
                  : AlertCircle

    const colorClass = STATUS_COLORS[status] || 'text-muted-foreground'

    return <Icon className={cn('h-5 w-5', colorClass, className)} />
}

// ============================================================================
// Overall Status Header
// ============================================================================

interface StatusHeaderProps {
    summary: StatusSummary
    lastUpdated?: string
    onRefresh?: () => void
    isRefreshing?: boolean
}

export function StatusHeader({
    summary,
    lastUpdated,
    onRefresh,
    isRefreshing,
}: StatusHeaderProps) {
    const status = summary?.page?.status ?? 'UNKNOWN'
    const activeIncidents = summary?.activeIncidents ?? []
    const activeMaintenances = summary?.activeMaintenances ?? []
    const hasActiveIssues =
        activeIncidents.length > 0 || activeMaintenances.length > 0

    const statusMessages: Record<StatusType, string> = {
        UP: 'All systems operational',
        DOWN: 'Major outage in progress',
        DEGRADED: 'Some systems experiencing issues',
        UNKNOWN: 'Unable to determine status',
    }

    return (
        <GlassCard>
            <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div
                            className={cn(
                                'p-4 rounded-2xl',
                                STATUS_BG_COLORS[status] || 'bg-muted/50'
                            )}
                        >
                            <StatusIcon
                                status={status}
                                className="h-8 w-8"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">
                                {statusMessages[status] || 'Status Unknown'}
                            </h1>
                            <div className="mt-1 flex items-center gap-3 text-muted-foreground">
                                <StatusBadge status={status} size="sm" />
                                {lastUpdated && (
                                    <span className="text-sm">
                                        Updated{' '}
                                        {formatDistanceToNow(
                                            new Date(lastUpdated),
                                            { addSuffix: true }
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {onRefresh && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                className="bg-background/50"
                            >
                                <RefreshCw
                                    className={cn(
                                        'h-4 w-4 mr-2',
                                        isRefreshing && 'animate-spin'
                                    )}
                                />
                                Refresh
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-background/50"
                            asChild
                        >
                            <Link
                                href="https://status.emberly.site"
                                target="_blank"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Instatus Page
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Active Issues Alert */}
                {hasActiveIssues && (
                    <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-yellow-500">
                                    Active Issues
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {activeIncidents.length > 0 &&
                                        `${activeIncidents.length} incident${activeIncidents.length > 1 ? 's' : ''}`}
                                    {activeIncidents.length > 0 &&
                                        activeMaintenances.length > 0 &&
                                        ' and '}
                                    {activeMaintenances.length > 0 &&
                                        `${activeMaintenances.length} maintenance${activeMaintenances.length > 1 ? 's' : ''}`}
                                    {' in progress'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </GlassCard>
    )
}

// ============================================================================
// Components List
// ============================================================================

interface ComponentsListProps {
    components: StatusComponent[]
}

export function ComponentsList({ components }: ComponentsListProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set()
    )

    // Ensure components is an array
    const componentsList = Array.isArray(components) ? components : []

    // Build a map of parent IDs to their children from group references
    // The Instatus API returns a flat list where children have group.id pointing to parent
    const childrenByParent = new Map<string, StatusComponent[]>()
    const parentIds = new Set<string>()
    
    componentsList.forEach(component => {
        if (component.group?.id) {
            parentIds.add(component.group.id)
            const existing = childrenByParent.get(component.group.id) || []
            existing.push(component)
            childrenByParent.set(component.group.id, existing)
        }
    })

    // Parent components are those that have children referencing them
    // OR those explicitly marked as isParent (for backwards compatibility)
    const parentComponents = componentsList
        .filter(c => c.isParent || parentIds.has(c.id))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    
    // Standalone components have no group and aren't parents
    const standaloneComponents = componentsList
        .filter(c => !c.group && !c.isParent && !parentIds.has(c.id))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    // Helper to get children for a parent
    const getChildrenForParent = (parent: StatusComponent): StatusComponent[] => {
        const nestedChildren = Array.isArray(parent.children) ? parent.children : []
        const groupedChildren = childrenByParent.get(parent.id) || []
        
        // Combine both sources, avoiding duplicates by ID
        const allChildren = [...nestedChildren]
        const existingIds = new Set(nestedChildren.map(c => c.id))
        
        groupedChildren.forEach(child => {
            if (!existingIds.has(child.id)) {
                allChildren.push(child)
            }
        })
        
        // Sort by order if available
        return allChildren.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    return (
        <GlassCard>
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Server className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Components</h2>
                </div>

                <div className="space-y-2">
                    {/* Standalone components */}
                    {standaloneComponents.map(component => (
                        <ComponentRow
                            key={component.id}
                            component={component}
                        />
                    ))}

                    {/* Parent components with children */}
                    {parentComponents.map(parent => {
                        const isExpanded = expandedGroups.has(parent.id)
                        const children = getChildrenForParent(parent)

                        return (
                            <div key={parent.id}>
                                <button
                                    onClick={() => toggleGroup(parent.id)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl bg-background/80 hover:bg-background/90 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {children.length > 0 ? (
                                            isExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            )
                                        ) : (
                                            <div className="w-4" />
                                        )}
                                        <span className="font-medium">
                                            {parent.name}
                                        </span>
                                        {parent.description && (
                                            <span className="text-sm text-muted-foreground">
                                                {parent.description}
                                            </span>
                                        )}
                                    </div>
                                    <StatusBadge
                                        status={parent.status}
                                        size="sm"
                                    />
                                </button>

                                {/* Children */}
                                {isExpanded && children.length > 0 && (
                                    <div className="ml-7 mt-1 space-y-1">
                                        {children.map(child => (
                                            <ComponentRow
                                                key={child.id}
                                                component={child}
                                                isChild
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {componentsList.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No components found</p>
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    )
}

function ComponentRow({
    component,
    isChild,
}: {
    component: StatusComponent
    isChild?: boolean
}) {
    return (
        <div
            className={cn(
                'flex items-center justify-between p-4 rounded-xl',
                isChild
                    ? 'bg-background/60 border border-border/50'
                    : 'bg-background/80'
            )}
        >
            <div className="flex items-center gap-3">
                <StatusIcon status={component.status} className="h-4 w-4" />
                <span className={cn(isChild ? 'text-sm' : 'font-medium')}>
                    {component.name}
                </span>
                {component.description && (
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                        {component.description}
                    </span>
                )}
            </div>
            <StatusBadge status={component.status} size="sm" />
        </div>
    )
}

// ============================================================================
// Active Incidents Panel
// ============================================================================

interface ActiveIncidentsPanelProps {
    incidents: ActiveIncident[]
}

export function ActiveIncidentsPanel({
    incidents,
}: ActiveIncidentsPanelProps) {
    const incidentsList = Array.isArray(incidents) ? incidents : []
    if (incidentsList.length === 0) return null

    return (
        <GlassCard className="border-yellow-500/30">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-lg font-semibold">Active Incidents</h2>
                </div>

                <div className="space-y-3">
                    {incidentsList.map(incident => (
                        <Link
                            key={incident.id}
                            href={incident.url}
                            target="_blank"
                            className="block p-4 rounded-xl bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/20 transition-colors group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium group-hover:text-primary transition-colors">
                                        {incident.name}
                                    </h3>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                        <Badge
                                            variant="secondary"
                                            className="bg-yellow-500/20 text-yellow-500 border-0"
                                        >
                                            {INCIDENT_STATUS_LABELS[
                                                incident.status
                                            ] || incident.status}
                                        </Badge>
                                        <span>
                                            Started{' '}
                                            {formatRelativeTime(
                                                incident.started
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </GlassCard>
    )
}

// ============================================================================
// Active Maintenances Panel
// ============================================================================

interface ActiveMaintenancesPanelProps {
    maintenances: ActiveMaintenance[]
}

export function ActiveMaintenancesPanel({
    maintenances,
}: ActiveMaintenancesPanelProps) {
    const maintenancesList = Array.isArray(maintenances) ? maintenances : []
    if (maintenancesList.length === 0) return null

    return (
        <GlassCard className="border-blue-500/30">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Wrench className="h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold">
                        Scheduled Maintenance
                    </h2>
                </div>

                <div className="space-y-3">
                    {maintenancesList.map(maintenance => (
                        <Link
                            key={maintenance.id}
                            href={maintenance.url}
                            target="_blank"
                            className="block p-4 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 transition-colors group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium group-hover:text-primary transition-colors">
                                        {maintenance.name}
                                    </h3>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                        <Badge
                                            variant="secondary"
                                            className="bg-blue-500/20 text-blue-500 border-0"
                                        >
                                            {MAINTENANCE_STATUS_LABELS[
                                                maintenance.status
                                            ] || maintenance.status}
                                        </Badge>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(
                                                new Date(maintenance.start),
                                                'MMM d, yyyy h:mm a'
                                            )}
                                        </span>
                                        {maintenance.duration && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {maintenance.duration} min
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </GlassCard>
    )
}

// ============================================================================
// Incident History
// ============================================================================

interface IncidentHistoryProps {
    incidents: Incident[]
    limit?: number
}

export function IncidentHistory({
    incidents,
    limit = 10,
}: IncidentHistoryProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const incidentsList = Array.isArray(incidents) ? incidents : []
    const displayIncidents = incidentsList.slice(0, limit)

    const toggleIncident = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    return (
        <GlassCard>
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Incident History</h2>
                </div>

                {displayIncidents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No recent incidents</p>
                        <p className="text-sm mt-1">
                            All systems have been running smoothly
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayIncidents.map(incident => {
                            const isExpanded = expanded.has(incident.id)
                            const isResolved = incident.status === 'RESOLVED'

                            return (
                                <div
                                    key={incident.id}
                                    className={cn(
                                        'rounded-xl border transition-colors',
                                        isResolved
                                            ? 'bg-background/80 border-border/50'
                                            : 'bg-yellow-500/5 border-yellow-500/30'
                                    )}
                                >
                                    <button
                                        onClick={() =>
                                            toggleIncident(incident.id)
                                        }
                                        className="w-full p-4 text-left"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <h3 className="font-medium">
                                                        {incident.name}
                                                    </h3>
                                                </div>
                                                <div className="mt-2 ml-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            'border-0',
                                                            isResolved
                                                                ? 'bg-emerald-500/20 text-emerald-500'
                                                                : 'bg-yellow-500/20 text-yellow-500'
                                                        )}
                                                    >
                                                        {isResolved ? (
                                                            <Check className="h-3 w-3 mr-1" />
                                                        ) : null}
                                                        {INCIDENT_STATUS_LABELS[
                                                            incident.status
                                                        ] || incident.status}
                                                    </Badge>
                                                    <span>
                                                        {format(
                                                            new Date(
                                                                incident.started
                                                            ),
                                                            'MMM d, yyyy'
                                                        )}
                                                    </span>
                                                    {incident.resolved && (
                                                        <span>
                                                            • Resolved{' '}
                                                            {formatRelativeTime(
                                                                incident.resolved
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Updates Timeline */}
                                    {isExpanded &&
                                        incident.updates.length > 0 && (
                                            <div className="px-4 pb-4 ml-6">
                                                <div className="border-l-2 border-border pl-4 space-y-4">
                                                    {incident.updates.map(
                                                        update => (
                                                            <div
                                                                key={update.id}
                                                                className="relative"
                                                            >
                                                                <div className="absolute -left-[1.375rem] top-0 w-3 h-3 rounded-full bg-background border-2 border-border" />
                                                                <div className="text-sm">
                                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            {INCIDENT_STATUS_LABELS[
                                                                                update
                                                                                    .status
                                                                            ] ||
                                                                                update.status}
                                                                        </Badge>
                                                                        <span>
                                                                            {format(
                                                                                new Date(
                                                                                    update.createdAt
                                                                                ),
                                                                                'MMM d, h:mm a'
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div
                                                                        className="text-foreground prose prose-sm dark:prose-invert max-w-none"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html:
                                                                                update.messageHtml ||
                                                                                update.message,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </GlassCard>
    )
}

// ============================================================================
// Maintenance History
// ============================================================================

interface MaintenanceHistoryProps {
    maintenances: Maintenance[]
    limit?: number
}

export function MaintenanceHistory({
    maintenances,
    limit = 10,
}: MaintenanceHistoryProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const maintenancesList = Array.isArray(maintenances) ? maintenances : []
    const displayMaintenances = maintenancesList.slice(0, limit)

    const toggleMaintenance = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    // Format duration from minutes to human readable
    const formatDuration = (minutes: number | null): string => {
        if (!minutes) return 'Unknown duration'
        if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        if (remainingMinutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`
        return `${hours}h ${remainingMinutes}m`
    }

    return (
        <GlassCard>
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Wrench className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Maintenance History</h2>
                </div>

                {displayMaintenances.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No scheduled maintenances</p>
                        <p className="text-sm mt-1">
                            No maintenance windows have been scheduled
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayMaintenances.map(maintenance => {
                            const isExpanded = expanded.has(maintenance.id)
                            const isCompleted = maintenance.status === 'COMPLETED'
                            const isInProgress = maintenance.status === 'INPROGRESS'

                            return (
                                <div
                                    key={maintenance.id}
                                    className={cn(
                                        'rounded-xl border transition-colors',
                                        isCompleted
                                            ? 'bg-background/80 border-border/50'
                                            : isInProgress
                                              ? 'bg-blue-500/5 border-blue-500/30'
                                              : 'bg-background/80 border-border/50'
                                    )}
                                >
                                    <button
                                        onClick={() =>
                                            toggleMaintenance(maintenance.id)
                                        }
                                        className="w-full p-4 text-left"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <h3 className="font-medium">
                                                        {maintenance.name}
                                                    </h3>
                                                </div>
                                                <div className="mt-2 ml-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            'border-0',
                                                            isCompleted
                                                                ? 'bg-emerald-500/20 text-emerald-500'
                                                                : isInProgress
                                                                  ? 'bg-blue-500/20 text-blue-500'
                                                                  : 'bg-muted text-muted-foreground'
                                                        )}
                                                    >
                                                        {isCompleted ? (
                                                            <Check className="h-3 w-3 mr-1" />
                                                        ) : isInProgress ? (
                                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        ) : (
                                                            <Clock className="h-3 w-3 mr-1" />
                                                        )}
                                                        {MAINTENANCE_STATUS_LABELS[
                                                            maintenance.status
                                                        ] || maintenance.status}
                                                    </Badge>
                                                    <span>
                                                        {format(
                                                            new Date(
                                                                maintenance.start
                                                            ),
                                                            'MMM d, yyyy h:mm a'
                                                        )}
                                                    </span>
                                                    <span>
                                                        • {formatDuration(maintenance.duration)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Updates Timeline */}
                                    {isExpanded &&
                                        maintenance.updates &&
                                        maintenance.updates.length > 0 && (
                                            <div className="px-4 pb-4 ml-6">
                                                <div className="border-l-2 border-border pl-4 space-y-4">
                                                    {maintenance.updates.map(
                                                        update => (
                                                            <div
                                                                key={update.id}
                                                                className="relative"
                                                            >
                                                                <div className="absolute -left-[1.375rem] top-0 w-3 h-3 rounded-full bg-background border-2 border-border" />
                                                                <div className="text-sm">
                                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            {MAINTENANCE_STATUS_LABELS[
                                                                                update
                                                                                    .status
                                                                            ] ||
                                                                                update.status}
                                                                        </Badge>
                                                                        <span>
                                                                            {format(
                                                                                new Date(
                                                                                    update.started
                                                                                ),
                                                                                'MMM d, h:mm a'
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div
                                                                        className="text-foreground prose prose-sm dark:prose-invert max-w-none"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html:
                                                                                update.messageHtml ||
                                                                                update.message,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Affected Components */}
                                    {isExpanded &&
                                        maintenance.components &&
                                        maintenance.components.length > 0 && (
                                            <div className="px-4 pb-4 ml-6">
                                                <div className="text-sm text-muted-foreground mb-2">
                                                    Affected components:
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {maintenance.components.map(
                                                        component => (
                                                            <Badge
                                                                key={component.id}
                                                                variant="secondary"
                                                                className="bg-muted/50"
                                                            >
                                                                {component.name}
                                                            </Badge>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </GlassCard>
    )
}

// ============================================================================
// Status Page Loading Skeleton
// ============================================================================

export function StatusPageSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <GlassCard>
                <div className="p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-muted" />
                        <div className="space-y-2">
                            <div className="h-8 w-64 bg-muted rounded" />
                            <div className="h-4 w-40 bg-muted rounded" />
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Components Skeleton */}
            <GlassCard>
                <div className="p-6">
                    <div className="h-6 w-32 bg-muted rounded mb-6" />
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className="h-14 bg-muted/50 rounded-xl"
                            />
                        ))}
                    </div>
                </div>
            </GlassCard>
        </div>
    )
}

// ============================================================================
// Uptime Display
// ============================================================================

interface UptimeDisplayProps {
    uptime: number
    days?: number
}

export function UptimeDisplay({ uptime, days = 90 }: UptimeDisplayProps) {
    return (
        <GlassCard>
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">
                            Uptime ({days} days)
                        </h3>
                    </div>
                    <span
                        className={cn(
                            'text-2xl font-bold',
                            uptime >= 99.9
                                ? 'text-emerald-500'
                                : uptime >= 99
                                  ? 'text-yellow-500'
                                  : 'text-red-500'
                        )}
                    >
                        {uptime.toFixed(2)}%
                    </span>
                </div>

                {/* Visual bar */}
                <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all',
                            uptime >= 99.9
                                ? 'bg-emerald-500'
                                : uptime >= 99
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                        )}
                        style={{ width: `${uptime}%` }}
                    />
                </div>
            </div>
        </GlassCard>
    )
}
