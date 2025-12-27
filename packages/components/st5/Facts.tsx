import React from 'react'
import { Check, Info, Lightbulb, Users } from 'lucide-react'

// Reusable GlassCard component (consistent with home/about pages)
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${className}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  )
}

export default function Facts() {
  const quickInfo = [
    { icon: Info, label: 'Type', value: 'Fan-made hub (non-affiliated)', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Lightbulb, label: 'Theme', value: "80s sci-fi horror synthy atmosphere", color: 'text-chart-3', bg: 'bg-chart-3/10' },
    { icon: Users, label: 'Purpose', value: 'Countdowns, notes, and community content', color: 'text-chart-4', bg: 'bg-chart-4/10' },
  ]

  const tips = [
    'Avoid spoilers in comments — use spoiler tags if discussing plot.',
    'Check official channels for exact release windows in your region.',
    'Consider enabling notifications for trailers or release announcements.',
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Quick Info Cards */}
      {quickInfo.map((item) => (
        <GlassCard key={item.label}>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <p className="font-medium">{item.value}</p>
          </div>
        </GlassCard>
      ))}

      {/* Watch & Release Notes */}
      <GlassCard className="md:col-span-2 lg:col-span-2">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-3">Watch & Release Notes</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Release dates and volumes vary by distributor and region. This hub tracks broadly
            available windows; for exact times check the official streaming platform.
          </p>

          <h4 className="font-medium mb-2">Viewing Tips</h4>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>

      {/* Cast & Crew Notes */}
      <GlassCard className="lg:col-span-1">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-3">Cast & Crew Notes</h3>
          <p className="text-sm text-muted-foreground">
            Core creative leads and principal cast have been consistent across seasons;
            expect familiar collaborations and practical effects/sound design focused on atmosphere.
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
