/**
 * Instatus API Types
 * Based on https://instatus.com/help/api and https://status.emberly.site/public-api
 */

// ============================================================================
// Common Types
// ============================================================================

// Overall page-level status values returned by Instatus public API
export type StatusType = 'UP' | 'HASISSUES' | 'UNDERMAINTENANCE' | 'DOWN' | 'DEGRADED' | 'UNKNOWN'

export type ComponentStatus =
    | 'OPERATIONAL'
    | 'UNDERMAINTENANCE'
    | 'DEGRADEDPERFORMANCE'
    | 'PARTIALOUTAGE'
    | 'MAJOROUTAGE'

export type IncidentStatus =
    | 'INVESTIGATING'
    | 'IDENTIFIED'
    | 'MONITORING'
    | 'RESOLVED'

export type MaintenanceStatus =
    | 'NOTSTARTEDYET'
    | 'INPROGRESS'
    | 'COMPLETED'

export type ImpactType =
    | 'NONE'
    | 'MINOR'
    | 'MAJOR'
    | 'MAJOROUTAGE'
    | 'UNDERMAINTENANCE'

// ============================================================================
// Summary API (Public)
// ============================================================================

export interface StatusSummary {
    page: {
        name: string
        url: string
        status: StatusType
    }
    activeIncidents: ActiveIncident[]
    activeMaintenances: ActiveMaintenance[]
}

export interface ActiveIncident {
    id: string
    name: string
    started: string
    status: IncidentStatus
    impact: ImpactType
    url: string
    updatedAt: string
}

export interface ActiveMaintenance {
    id: string
    name: string
    start: string
    status: MaintenanceStatus
    duration: string
    url: string
    updatedAt: string
}

// ============================================================================
// Components API (Public)
// ============================================================================

export interface StatusComponent {
    id: string
    name: string
    status: ComponentStatus
    description: string
    /** Email for automation updates */
    uniqueEmail?: string
    /** Whether uptime is shown for this component */
    showUptime?: boolean
    /** Display order */
    order?: number
    /** Group info if component belongs to a parent group */
    group?: {
        id: string
        name: string
    } | null
    /** 
     * Whether this is a parent/group component (computed client-side)
     * Not returned by API - we determine this by checking if other components reference this one
     */
    isParent?: boolean
    /**
     * Child components (computed client-side)
     * Not returned by API - we build this from the flat list using group references
     */
    children?: StatusComponent[]
}

// ============================================================================
// Incidents API
// ============================================================================

export interface Incident {
    id: string
    name: string
    status: IncidentStatus
    started: string
    resolved: string | null
    updates: IncidentUpdate[]
    components: IncidentComponent[]
    impact?: ImpactType
}

export interface IncidentUpdate {
    id: string
    message: string
    messageHtml: string
    status: IncidentStatus
    notify: boolean
    started: string
    ended: string | null
    duration: number | null
    createdAt: string
}

export interface IncidentComponent {
    id: string
    name: string
    status: ComponentStatus
    showUptime: boolean
    site?: {
        id: string
        name: string
        subdomain: string
        color: string | null
        logoUrl: string | null
        publicEmail: string | null
    }
}

// ============================================================================
// Maintenances API
// ============================================================================

export interface Maintenance {
    id: string
    name: string
    status: MaintenanceStatus
    start: string
    end?: string
    duration: number | null
    notifyStart?: boolean
    notifyEnd?: boolean
    notifyEarly?: boolean
    notifyMinutes?: number
    autoStart?: boolean
    autoEnd?: boolean
    updates: MaintenanceUpdate[]
    components: IncidentComponent[]
}

export interface MaintenanceUpdate {
    id: string
    message: string
    messageHtml: string
    status: MaintenanceStatus
    notify: boolean
    started: string
    ended: string | null
    duration: number | null
    createdAt: string
}

// ============================================================================
// Metrics API
// ============================================================================

export interface Metric {
    id: string
    name: string
    active: boolean
    order: number
    suffix: string
    lastDataAt?: number
    data: MetricDataPoint[]
}

export interface MetricDataPoint {
    timestamp: number
    value: number
}

// ============================================================================
// Monitor API
// ============================================================================

export type MonitorStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN'

export interface Monitor {
    id: string
    pageId: string
    name: string
    url: string
    type: 'HTTP' | 'KEYWORD' | 'PING' | 'PORT' | 'DNS'
    httpMethod?: string
    status: MonitorStatus
    checksInterval: number
    locations: string
    createdAt?: string
    updatedAt?: string
}

export interface MonitorLog {
    id: string
    status: MonitorStatus
    responseTime: number
    httpStatusCode?: string
    location: string
    createdAt: string
    isSuccessful: boolean
}

// ============================================================================
// Aggregated Status Response (for our custom API)
// ============================================================================

export interface EmberlyStatusResponse {
    status: StatusType
    summary: StatusSummary
    components: StatusComponent[]
    incidents: Incident[]
    maintenances: Maintenance[]
    lastUpdated: string
}

// ============================================================================
// Helper type guards and utilities
// ============================================================================

export const STATUS_COLORS: Record<StatusType | ComponentStatus, string> = {
    // Overall status
    UP: 'text-emerald-500',
    HASISSUES: 'text-yellow-500',
    DOWN: 'text-red-500',
    DEGRADED: 'text-yellow-500',
    UNKNOWN: 'text-muted-foreground',
    // Component status
    OPERATIONAL: 'text-emerald-500',
    UNDERMAINTENANCE: 'text-blue-500',
    DEGRADEDPERFORMANCE: 'text-yellow-500',
    PARTIALOUTAGE: 'text-orange-500',
    MAJOROUTAGE: 'text-red-500',
}

export const STATUS_BG_COLORS: Record<StatusType | ComponentStatus, string> = {
    UP: 'bg-emerald-500/10',
    HASISSUES: 'bg-yellow-500/10',
    DOWN: 'bg-red-500/10',
    DEGRADED: 'bg-yellow-500/10',
    UNKNOWN: 'bg-muted/50',
    OPERATIONAL: 'bg-emerald-500/10',
    UNDERMAINTENANCE: 'bg-blue-500/10',
    DEGRADEDPERFORMANCE: 'bg-yellow-500/10',
    PARTIALOUTAGE: 'bg-orange-500/10',
    MAJOROUTAGE: 'bg-red-500/10',
}

export const STATUS_LABELS: Record<StatusType | ComponentStatus, string> = {
    UP: 'All systems operational',
    HASISSUES: 'Some systems affected',
    DOWN: 'Major outage',
    DEGRADED: 'Degraded performance',
    UNKNOWN: 'Status unknown',
    OPERATIONAL: 'Operational',
    UNDERMAINTENANCE: 'Under Maintenance',
    DEGRADEDPERFORMANCE: 'Degraded Performance',
    PARTIALOUTAGE: 'Partial Outage',
    MAJOROUTAGE: 'Major Outage',
}

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
    INVESTIGATING: 'Investigating',
    IDENTIFIED: 'Identified',
    MONITORING: 'Monitoring',
    RESOLVED: 'Resolved',
}

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
    NOTSTARTEDYET: 'Scheduled',
    INPROGRESS: 'In Progress',
    COMPLETED: 'Completed',
}

export function isOperational(status: StatusType | ComponentStatus): boolean {
    return status === 'UP' || status === 'OPERATIONAL'
}

export function getOverallStatus(components: StatusComponent[]): StatusType {
    if (components.length === 0) return 'UNKNOWN'

    const hasDown = components.some(
        c => c.status === 'MAJOROUTAGE' || c.status === 'PARTIALOUTAGE'
    )
    if (hasDown) return 'DOWN'

    const hasDegraded = components.some(
        c => c.status === 'DEGRADEDPERFORMANCE' || c.status === 'UNDERMAINTENANCE'
    )
    if (hasDegraded) return 'DEGRADED'

    const allOperational = components.every(c => c.status === 'OPERATIONAL')
    if (allOperational) return 'UP'

    return 'UNKNOWN'
}
