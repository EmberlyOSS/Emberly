'use client'

import { useState } from 'react'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Loader2, Zap } from 'lucide-react'
import { useToast } from '@/packages/hooks/use-toast'
import type { NexiumProfile } from './types'

export function NexiumSetup({ onCreated }: { onCreated: (profile: NexiumProfile) => void }) {
  const [headline, setHeadline] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/discovery/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: headline.trim() || undefined,
          title: title.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create profile')
      toast({ title: 'Discovery profile created!', description: 'Your talent profile is now live.' })
      onCreated(json.data)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <Zap className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="font-medium text-sm">Activate your Discovery profile</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get discovered on Discovery, the talent discovery layer of Emberly. Your Emberly username will be used as your public identity.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nexium-title">Title</Label>
          <Input
            id="nexium-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Backend Engineer, UX Designer"
            maxLength={120}
          />
          <p className="text-xs text-muted-foreground">Your job title or role</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nexium-headline">Headline</Label>
          <Input
            id="nexium-headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Building open-source dev tools & scaling distributed systems"
            maxLength={120}
          />
          <p className="text-xs text-muted-foreground">A short tagline about what you do or what you're working on</p>
        </div>

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Activate Discovery Profile
        </Button>
      </form>
    </div>
  )
}
