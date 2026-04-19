'use client'

import { useRef, useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { ProfileAccountProps } from '@/packages/types/components/profile'
import { useSession } from 'next-auth/react'

import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Textarea } from '@/packages/components/ui/textarea'

import { useToast } from '@/packages/hooks/use-toast'
import { Github, Twitter, Globe, Image as ImageIcon } from 'lucide-react'
import { SiDiscord } from 'react-icons/si'

export function ProfileAccount({ user, onUpdate }: ProfileAccountProps) {
  const { update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isAvatarLoading, setIsAvatarLoading] = useState<string | null>(null)
  const [linkedProviders, setLinkedProviders] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetch('/api/profile/linked-accounts')
      .then((r) => r.json())
      .then((data) => {
        const providers = new Set<string>(
          (data.linkedAccounts ?? []).map((a: { provider: string }) => a.provider.toLowerCase())
        )
        setLinkedProviders(providers)
      })
      .catch(() => {})
  }, [])

  const githubLinked = linkedProviders.has('github')
  const discordLinked = linkedProviders.has('discord')

  const nameRef = useRef<HTMLInputElement>(null)
  const fullNameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const bioRef = useRef<HTMLTextAreaElement>(null)
  const websiteRef = useRef<HTMLInputElement>(null)
  const twitterRef = useRef<HTMLInputElement>(null)
  const githubRef = useRef<HTMLInputElement>(null)
  const discordRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setIsAvatarLoading('upload')
    try {
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload avatar')
      }

      const { url } = await response.json()

      await updateSession({ user: { ...user, image: url } })
      router.refresh()
      onUpdate()
      toast({ title: 'Avatar updated' })
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to update avatar',
        variant: 'destructive',
      })
    } finally {
      setIsAvatarLoading(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUseLinkedAvatar = async (provider: 'github' | 'discord') => {
    setIsAvatarLoading(provider)
    try {
      const res = await fetch('/api/profile/avatar/linked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to set avatar')
      await updateSession({ user: { ...user, image: json.data?.image ?? json.image } })
      router.refresh()
      onUpdate()
      toast({ title: `${provider === 'github' ? 'GitHub' : 'Discord'} avatar applied` })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setIsAvatarLoading(null)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameRef.current?.value,
          fullName: fullNameRef.current?.value || null,
          email: emailRef.current?.value,
          bio: bioRef.current?.value || null,
          website: websiteRef.current?.value || null,
          twitter: twitterRef.current?.value || null,
          github: githubRef.current?.value || null,
          discord: discordRef.current?.value || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const data = await response.json()
      await updateSession({ user: { ...user, name: data.name, email: data.email } })
      router.refresh()
      onUpdate()
      toast({ title: 'Profile updated' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleProfileUpdate} className="space-y-8">
      {/* Avatar */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.image || undefined} alt={user.name || 'User avatar'} className="object-cover" />
            <AvatarFallback>{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <Button type="button" variant="outline" size="sm" onClick={triggerAvatarUpload}
            disabled={isAvatarLoading !== null} className="w-full text-xs gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            {isAvatarLoading === 'upload' ? 'Uploading…' : 'Upload image'}
          </Button>
          <Input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          {githubLinked && (
            <Button type="button" variant="ghost" size="sm" onClick={() => handleUseLinkedAvatar('github')}
              disabled={isAvatarLoading !== null} className="w-full text-xs gap-1.5">
              <Github className="w-3.5 h-3.5" />
              {isAvatarLoading === 'github' ? 'Applying…' : 'Use GitHub avatar'}
            </Button>
          )}
          {discordLinked && (
            <Button type="button" variant="ghost" size="sm" onClick={() => handleUseLinkedAvatar('discord')}
              disabled={isAvatarLoading !== null} className="w-full text-xs gap-1.5 text-[#5865F2]">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-4.177-.838-8.187-3.448-12.012a.049.049 0 0 0-.02-.019zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156 0-1.193.955-2.157 2.157-2.157 1.21 0 2.176.972 2.157 2.157 0 1.19-.955 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156 0-1.193.955-2.157 2.157-2.157 1.21 0 2.176.972 2.157 2.157 0 1.19-.946 2.156-2.157 2.156z" />
              </svg>
              {isAvatarLoading === 'discord' ? 'Applying…' : 'Use Discord avatar'}
            </Button>
          )}
        </div>

        {/* Basic info */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" ref={nameRef} defaultValue={user.name || ''} placeholder="Your username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" ref={fullNameRef} defaultValue={(user as any).fullName || ''}
                placeholder="Your full name (optional)" maxLength={100} />
              <p className="text-xs text-muted-foreground">Shown on your public profile</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" ref={emailRef} defaultValue={user.email || ''} placeholder="you@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" ref={bioRef} defaultValue={(user as any).bio || ''}
              placeholder="Tell people a bit about yourself…" maxLength={500} className="resize-none" rows={3} />
          </div>
        </div>
      </div>

      {/* Social links */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium">Social Links</h4>
          <p className="text-xs text-muted-foreground mt-0.5">These appear on your public profile</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-1.5 text-sm">
              <Globe className="w-3.5 h-3.5" /> Website
            </Label>
            <Input id="website" ref={websiteRef} type="url"
              defaultValue={(user as any).website || ''} placeholder="https://yoursite.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitter" className="flex items-center gap-1.5 text-sm">
              <Twitter className="w-3.5 h-3.5" /> X / Twitter
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input id="twitter" ref={twitterRef}
                defaultValue={(user as any).twitter?.replace(/^@/, '') || ''} placeholder="username" className="pl-7" />
            </div>
          </div>
          {githubLinked && (
            <div className="space-y-2">
              <Label htmlFor="github" className="flex items-center gap-1.5 text-sm">
                <Github className="w-3.5 h-3.5" /> GitHub
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input id="github" ref={githubRef}
                  defaultValue={(user as any).github?.replace(/^@/, '') || ''} placeholder="username" className="pl-7" />
              </div>
            </div>
          )}
          {discordLinked && (
            <div className="space-y-2">
              <Label htmlFor="discord" className="flex items-center gap-1.5 text-sm">
                <SiDiscord className="w-3.5 h-3.5" style={{ color: '#5865F2' }} /> Discord
              </Label>
              <Input id="discord" ref={discordRef}
                defaultValue={(user as any).discord || ''} placeholder="username or handle" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
