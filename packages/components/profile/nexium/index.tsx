'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/packages/components/ui/badge'
import { useToast } from '@/packages/hooks/use-toast'
import { ScrollIndicator } from '@/packages/components/ui/scroll-indicator'
import { Zap, Loader2, Star } from 'lucide-react'
import { NEXIUM_AVAILABILITY_LABELS } from '@/packages/lib/nexium/constants'

import { NexiumSetup } from './setup'
import { ProfileEditor } from './panels/profile-editor'
import { SkillsPanel } from './panels/skills-panel'
import { SignalsPanel } from './panels/signals-panel'
import { OpportunitiesPanel } from './panels/opportunities-panel'
import { ApplicationsPanel } from './panels/applications-panel'
import { TALENT_SECTIONS } from './constants'
import type { NexiumProfile, NexiumSection } from './types'

export type { NexiumSection } from './types'
export { TALENT_SECTIONS } from './constants'

export function NexiumDashboard({
  activeSection: controlledSection,
  onSectionChange,
}: {
  activeSection?: NexiumSection
  onSectionChange?: (section: NexiumSection) => void
} = {}) {
  const [profile, setProfile] = useState<NexiumProfile | null | 'loading'>('loading')
  const [internalSection, setInternalSection] = useState<NexiumSection>('profile')
  const { toast } = useToast()

  const controlled = controlledSection !== undefined
  const activeSection = controlled ? controlledSection : internalSection
  const setActiveSection = (s: NexiumSection) => {
    if (controlled) onSectionChange?.(s)
    else setInternalSection(s)
  }

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/discovery/profile')
      if (res.status === 404) {
        setProfile(null)
        return
      }
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setProfile(json.data)
    } catch {
      toast({ title: 'Error', description: 'Failed to load Discovery profile', variant: 'destructive' })
      setProfile(null)
    }
  }, [toast])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  if (profile === 'loading') {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading Discovery profile…
      </div>
    )
  }

  if (!profile) {
    return <NexiumSetup onCreated={(p) => setProfile(p as any)} />
  }

  const sections = [
    { id: 'profile', label: 'Profile' },
    { id: 'skills', label: `Skills (${profile.skills.length})` },
    { id: 'signals', label: `Signals (${profile.signals.length})` },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'applications', label: 'Applications' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-medium">@{profile.user.name}</p>
          {profile.headline && (
            <p className="text-xs text-muted-foreground">{profile.headline}</p>
          )}
        </div>
        <Badge
          variant="outline"
          className={`ml-auto text-xs ${
            profile.availability === 'OPEN'
              ? 'text-green-600 border-green-500/30 bg-green-500/10'
              : profile.availability === 'LIMITED'
              ? 'text-yellow-600 border-yellow-500/30 bg-yellow-500/10'
              : 'text-muted-foreground'
          }`}
        >
          <Star className="w-3 h-3 mr-1" />
          {NEXIUM_AVAILABILITY_LABELS[profile.availability as keyof typeof NEXIUM_AVAILABILITY_LABELS]}
        </Badge>
      </div>

      {/* Section nav — hidden when sidebar controls the section externally */}
      {!controlled && (
        <ScrollIndicator className="glass-subtle rounded-lg p-1">
          <div className="flex gap-1 w-max">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id as NexiumSection)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeSection === s.id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </ScrollIndicator>
      )}

      {/* Section content */}
      {activeSection === 'profile' && (
        <ProfileEditor
          profile={profile}
          onUpdate={(updated) => setProfile((prev) => prev && prev !== 'loading' ? { ...prev, ...updated } : prev)}
        />
      )}
      {activeSection === 'skills' && <SkillsPanel profile={profile} />}
      {activeSection === 'signals' && <SignalsPanel profile={profile} />}
      {activeSection === 'opportunities' && <OpportunitiesPanel />}
      {activeSection === 'applications' && <ApplicationsPanel />}
    </div>
  )
}
