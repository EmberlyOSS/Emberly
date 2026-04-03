'use client'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import {
  Zap,
  ExternalLink,
  CheckCircle,
  Star,
  MapPin,
  Globe,
  Clock,
} from 'lucide-react'
import {
  NEXIUM_AVAILABILITY_LABELS,
  NEXIUM_SKILL_LEVEL_LABELS,
  NEXIUM_SIGNAL_TYPE_LABELS,
} from '@/packages/lib/nexium/constants'

type NexiumSkill = {
  id: string
  name: string
  level: string
  category: string | null
  yearsExperience: number | null
}

type NexiumSignal = {
  id: string
  type: string
  title: string
  url: string | null
  description: string | null
  verified: boolean
}

export type NexiumPublicProfileData = {
  title: string | null
  headline: string | null
  availability: string
  lookingFor: string[]
  location: string | null
  timezone: string | null
  activeHours: string | null
  skills: NexiumSkill[]
  signals: NexiumSignal[]
  user: {
    name: string | null
    fullName: string | null
    urlId: string
    vanityId: string | null
  }
}

const availabilityStyle: Record<string, string> = {
  OPEN: 'text-green-600 border-green-500/30 bg-green-500/10',
  LIMITED: 'text-yellow-600 border-yellow-500/30 bg-yellow-500/10',
  CLOSED: 'text-muted-foreground',
}

const skillLevelStyle: Record<string, string> = {
  BEGINNER: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
  INTERMEDIATE: 'text-green-500 border-green-500/30 bg-green-500/10',
  ADVANCED: 'text-orange-500 border-orange-500/30 bg-orange-500/10',
  EXPERT: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
}

interface NexiumPublicSectionProps {
  nexiumProfile: NexiumPublicProfileData
}

export function NexiumPublicSection({ nexiumProfile }: NexiumPublicSectionProps) {
  const { title, headline, availability, lookingFor, location, timezone, activeHours, skills, signals, user } = nexiumProfile
  const username = user.name

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-mono text-primary">@{username}</span>
        </div>
        <Badge
          variant="outline"
          className={`text-xs gap-1 ${availabilityStyle[availability] ?? ''}`}
        >
          <Star className="w-3 h-3" />
          {NEXIUM_AVAILABILITY_LABELS[availability as keyof typeof NEXIUM_AVAILABILITY_LABELS]}
        </Badge>
        {lookingFor.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {lookingFor.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {title && (
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      )}
      {headline && (
        <p className="text-sm text-muted-foreground">{headline}</p>
      )}

      {(location || timezone || activeHours) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {location && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {location}
            </span>
          )}
          {timezone && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              {timezone}
            </span>
          )}
          {activeHours && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {activeHours}
            </span>
          )}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-sm"
              >
                <span className="font-medium">{skill.name}</span>
                <Badge
                  variant="outline"
                  className={`text-xs ${skillLevelStyle[skill.level] ?? ''}`}
                >
                  {NEXIUM_SKILL_LEVEL_LABELS[skill.level as keyof typeof NEXIUM_SKILL_LEVEL_LABELS]}
                </Badge>
                {skill.yearsExperience != null && (
                  <span className="text-xs text-muted-foreground">{skill.yearsExperience}y</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signals */}
      {signals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proof of Skill</p>
          <div className="space-y-2">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-primary/80">
                      {NEXIUM_SIGNAL_TYPE_LABELS[signal.type as keyof typeof NEXIUM_SIGNAL_TYPE_LABELS]}
                    </span>
                    {signal.verified && (
                      <Badge
                        variant="outline"
                        className="text-xs gap-1 text-green-600 border-green-500/30 bg-green-500/10"
                      >
                        <CheckCircle className="w-3 h-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{signal.title}</p>
                  {signal.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{signal.description}</p>
                  )}
                </div>
                {signal.url && (
                  <Button size="sm" variant="ghost" asChild className="flex-shrink-0 h-7 px-2">
                    <a href={signal.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
