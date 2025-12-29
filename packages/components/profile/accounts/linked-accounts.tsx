'use client'

import { useEffect, useState } from 'react'
import { Github, Trash2, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/packages/components/ui/button'
import { useToast } from '@/packages/hooks/use-toast'

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
  const { toast } = useToast()

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

  const handleUnlinkAccount = async (provider: string) => {
    try {
      setIsUnlinking(provider)
      const response = await fetch(`/api/profile/linked-accounts?provider=${provider}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to unlink account')
      }

      setLinkedAccounts(linkedAccounts.filter((acc) => acc.provider !== provider))
      toast({
        title: 'Success',
        description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked`,
      })
    } catch (error) {
      console.error('Error unlinking account:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unlink account',
        variant: 'destructive',
      })
    } finally {
      setIsUnlinking(null)
    }
  }

  const isGithubLinked = linkedAccounts.some((acc) => acc.provider === 'github')
  const isDiscordLinked = linkedAccounts.some((acc) => acc.provider === 'discord')

  const githubAccount = linkedAccounts.find((acc) => acc.provider === 'github')
  const discordAccount = linkedAccounts.find((acc) => acc.provider === 'discord')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5 animate-pulse h-24" />
        <div className="p-4 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5 animate-pulse h-24" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* GitHub Account */}
      <div className="p-4 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5 hover:bg-white/10 dark:hover:bg-black/10 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-foreground/10">
              <Github className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">GitHub</h3>
              {isGithubLinked && githubAccount ? (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Linked as <span className="font-medium">@{githubAccount.providerUsername}</span>
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Connected {new Date(githubAccount.linkedAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Connect your GitHub account to unlock contributor perks and showcase your contributions
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isGithubLinked ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleUnlinkAccount('github')}
                disabled={isUnlinking === 'github'}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Unlink
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleLinkAccount('github')}
                className="gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                Link Account
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Discord Account */}
      <div className="p-4 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5 hover:bg-white/10 dark:hover:bg-black/10 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#5865F2]/10">
              <svg
                className="h-5 w-5 text-[#5865F2]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.975 14.975 0 0 0 1.293-2.1a.07.07 0 0 0-.038-.098a13.11 13.11 0 0 1-1.872-.892a.072.072 0 0 1-.007-.12a10.149 10.149 0 0 0 .372-.294a.074.074 0 0 1 .076-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .076.01c.12.098.246.198.373.294a.072.072 0 0 1-.006.12a12.296 12.296 0 0 1-1.873.892a.077.077 0 0 0-.037.099c.36.687.772 1.341 1.293 2.1a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-4.467.151-8.343-.434-12.033a.05.05 0 0 0-.02-.028zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156c0-1.193.974-2.157 2.157-2.157c1.193 0 2.156.964 2.157 2.157c0 1.19-.964 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156c0-1.193.974-2.157 2.157-2.157c1.193 0 2.156.964 2.157 2.157c0 1.19-.964 2.156-2.157 2.156z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">Discord</h3>
              {isDiscordLinked && discordAccount ? (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Linked as <span className="font-medium">{discordAccount.providerUsername}</span>
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Connected {new Date(discordAccount.linkedAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Connect your Discord account to unlock server perks and get community recognition
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDiscordLinked ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleUnlinkAccount('discord')}
                disabled={isUnlinking === 'discord'}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Unlink
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleLinkAccount('discord')}
                className="gap-2 bg-[#5865F2] hover:bg-[#4752C4]"
              >
                <LinkIcon className="h-4 w-4" />
                Link Account
              </Button>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        By linking your accounts, you allow Emberly to verify your status and unlock exclusive perks and features.
        You can unlink your accounts at any time.
      </p>
    </div>
  )
}
