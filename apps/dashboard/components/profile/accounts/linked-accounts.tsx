'use client'

import { useEffect, useState } from 'react'
import { Github, Link as LinkIcon, ImageIcon } from 'lucide-react'
import { SiDiscord } from 'react-icons/si'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface LinkedAccount {
  id: string
  provider: string
  providerUsername?: string
  linkedAt: string
}

export function LinkedAccounts() {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null)
  const [isSettingAvatar, setIsSettingAvatar] = useState<string | null>(null)
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false)
  const [providerToUnlink, setProviderToUnlink] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { update: updateSession } = useSession()

  useEffect(() => {
    fetchLinkedAccounts()
  }, [])

  const fetchLinkedAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/profile/linked-accounts')
      if (!response.ok) throw new Error('Failed to fetch linked accounts')
      const data = await response.json()
      setLinkedAccounts(data.linkedAccounts || [])
    } catch (error) {
      console.error('Error fetching linked accounts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load linked accounts',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkAccount = (provider: string) => {
    if (provider === 'github') {
      window.location.href = '/api/auth/link/github'
    } else if (provider === 'discord') {
      window.location.href = '/api/auth/link/discord'
    }
  }

  const handleUseAsAvatar = async (provider: 'github' | 'discord') => {
    setIsSettingAvatar(provider)
    try {
      const res = await fetch('/api/profile/avatar/linked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to set avatar')
      const newImage = json.data?.image ?? json.image
      await updateSession({ user: { image: newImage } })
      router.refresh()
      toast({
        title: `${provider === 'github' ? 'GitHub' : 'Discord'} avatar applied`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSettingAvatar(null)
    }
  }

  const openUnlinkDialog = (provider: string) => {
    setProviderToUnlink(provider)
    setUnlinkDialogOpen(true)
  }

  const confirmUnlinkAccount = async () => {
    if (!providerToUnlink) return

    try {
      setIsUnlinking(providerToUnlink)
      setUnlinkDialogOpen(false)
      const response = await fetch(
        `/api/profile/linked-accounts?provider=${providerToUnlink}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to unlink account')
      }

      setLinkedAccounts(
        linkedAccounts.filter((acc) => acc.provider !== providerToUnlink)
      )
      toast({
        title: 'Success',
        description: `${providerToUnlink.charAt(0).toUpperCase() + providerToUnlink.slice(1)} account unlinked`,
      })
    } catch (error) {
      console.error('Error unlinking account:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to unlink account',
        variant: 'destructive',
      })
    } finally {
      setIsUnlinking(null)
      setProviderToUnlink(null)
    }
  }

  const isGithubLinked = linkedAccounts.some((acc) => acc.provider === 'github')
  const isDiscordLinked = linkedAccounts.some(
    (acc) => acc.provider === 'discord'
  )

  const githubAccount = linkedAccounts.find((acc) => acc.provider === 'github')
  const discordAccount = linkedAccounts.find(
    (acc) => acc.provider === 'discord'
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20 animate-pulse h-24" />
        <div className="p-4 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20 animate-pulse h-24" />
      </div>
    )
  }

  const providers = [
    {
      id: 'github',
      name: 'GitHub',
      icon: <Github className="h-5 w-5" />,
      account: githubAccount,
      linked: isGithubLinked,
      handle: githubAccount ? `@${githubAccount.providerUsername}` : '',
      pitch: 'Unlock contributor perks and show your contributions.',
      loses: 'contributor bonuses (up to 3GB and 5 extra domains)',
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: <SiDiscord className="h-5 w-5 text-[#5865F2]" />,
      account: discordAccount,
      linked: isDiscordLinked,
      handle: discordAccount?.providerUsername ?? '',
      pitch: 'Unlock server booster perks and community roles.',
      loses: 'server booster perks (+5GB and an extra domain)',
    },
  ]

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
        {providers.map((p) => {
          const confirming = unlinkDialogOpen && providerToUnlink === p.id
          return (
            <li key={p.id} className="px-4 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  {p.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {p.linked && p.account
                      ? `${p.handle} · linked ${new Date(p.account.linkedAt).toLocaleDateString()}`
                      : p.pitch}
                  </p>
                </div>
                {p.linked ? (
                  !confirming && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleUseAsAvatar(p.id as 'github' | 'discord')
                        }
                        disabled={isSettingAvatar !== null}
                      >
                        <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                        {isSettingAvatar === p.id
                          ? 'Applying…'
                          : 'Use as avatar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => openUnlinkDialog(p.id)}
                        disabled={isUnlinking === p.id}
                      >
                        Unlink
                      </Button>
                    </div>
                  )
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleLinkAccount(p.id as 'github' | 'discord')
                    }
                  >
                    <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                    Link {p.name}
                  </Button>
                )}
              </div>
              {confirming && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                  <p className="text-sm">
                    Unlinking removes your {p.loses}. You can link it again any
                    time.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUnlinkDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={confirmUnlinkAccount}
                    >
                      Unlink {p.name}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <p className="text-xs text-muted-foreground">
        Linking lets us check your status to unlock perks. Unlink any time.
      </p>
    </div>
  )
}
