'use client'

import { useState, useCallback } from 'react'

import { Activity, Server, Wrench } from 'lucide-react'

import {
    StatusHeader,
    ComponentsList,
    ActiveIncidentsPanel,
    ActiveMaintenancesPanel,
    IncidentHistory,
    MaintenanceHistory,
    UptimeDisplay,
} from '@/packages/components/status'
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '@/packages/components/ui/tabs'
import { EmberlyStatusResponse } from '@/packages/types/instatus'

interface StatusPageClientProps {
    initialData: EmberlyStatusResponse
}

export default function StatusPageClient({
    initialData,
}: StatusPageClientProps) {
    const [data, setData] = useState(initialData)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch('/api/status?full=true')
            if (res.ok) {
                const json = await res.json()
                if (json.success && json.data) {
                    setData(json.data)
                }
            }
        } catch (error) {
            console.error('Failed to refresh status:', error)
        } finally {
            setIsRefreshing(false)
        }
    }, [])

    // Count incidents and maintenances for badges
    const incidentCount = data.incidents?.length ?? 0
    const maintenanceCount = data.maintenances?.length ?? 0

    return (
        <div className="space-y-6">
            {/* Overall Status Header */}
            <StatusHeader
                summary={data.summary}
                lastUpdated={data.lastUpdated}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />

            {/* Active Issues */}
            <ActiveIncidentsPanel incidents={data.summary?.activeIncidents ?? []} />
            <ActiveMaintenancesPanel
                maintenances={data.summary?.activeMaintenances ?? []}
            />

            {/* Uptime Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UptimeDisplay uptime={99.95} days={90} />
                <UptimeDisplay uptime={99.98} days={30} />
                <UptimeDisplay uptime={100} days={7} />
            </div>

            {/* Tabbed Content: Components, Incidents, Maintenances */}
            <Tabs defaultValue="components" className="w-full">
                <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex h-auto md:h-10 gap-1 glass-subtle p-1 rounded-xl">
                    <TabsTrigger
                        value="components"
                        className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2"
                    >
                        <Server className="h-4 w-4" />
                        <span className="hidden sm:inline">Components</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="incidents"
                        className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2"
                    >
                        <Activity className="h-4 w-4" />
                        <span className="hidden sm:inline">Incidents</span>
                        {incidentCount > 0 && (
                            <span className="ml-1 text-xs bg-muted/80 data-[state=active]:bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">
                                {incidentCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="maintenances"
                        className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2"
                    >
                        <Wrench className="h-4 w-4" />
                        <span className="hidden sm:inline">Maintenances</span>
                        {maintenanceCount > 0 && (
                            <span className="ml-1 text-xs bg-muted/80 data-[state=active]:bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">
                                {maintenanceCount}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="components" className="mt-4">
                    <ComponentsList components={data.components ?? []} />
                </TabsContent>

                <TabsContent value="incidents" className="mt-4">
                    <IncidentHistory incidents={data.incidents ?? []} limit={20} />
                </TabsContent>

                <TabsContent value="maintenances" className="mt-4">
                    <MaintenanceHistory maintenances={data.maintenances ?? []} limit={20} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
