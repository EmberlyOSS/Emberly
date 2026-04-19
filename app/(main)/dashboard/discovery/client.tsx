'use client'

import { NexiumDashboard } from '@/packages/components/profile/nexium'

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-card transition-all duration-300 ${className}`}>{children}</div>
}

function GlassCardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
}

function GlassCardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`font-semibold leading-none tracking-tight text-lg ${className}`}>{children}</h3>
}

function GlassCardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>
}

export function NexiumDashboardClient() {
  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Talent Profile</GlassCardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your talent profile to get discovered for opportunities, collaborations, and squads
        </p>
      </GlassCardHeader>
      <GlassCardContent>
        <NexiumDashboard />
      </GlassCardContent>
    </GlassCard>
  )
}
