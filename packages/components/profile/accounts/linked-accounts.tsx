'use client'

import { useEffect, useState } from 'react'
import { Github, Trash2, Link as LinkIcon, ImageIcon } from 'lucide-react'
import { SiDiscord } from 'react-icons/si'
import { Button } from '@/packages/components/ui/button'
import { useToast } from '@/packages/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/packages/components/ui/alert-dialog'

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
      toast({ title: `${provider === 'github' ? 'GitHub' : 'Discord'} avatar applied` })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
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
      const response = await fetch(`/api/profile/linked-accounts?provider=${providerToUnlink}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to unlink account')
      }

      setLinkedAccounts(linkedAccounts.filter((acc) => acc.provider !== providerToUnlink))
      toast({
        title: 'Success',
        description: `${providerToUnlink.charAt(0).toUpperCase() + providerToUnlink.slice(1)} account unlinked`,
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
      setProviderToUnlink(null)
    }
  }

  const isGithubLinked = linkedAccounts.some((acc) => acc.provider === 'github')
  const isDiscordLinked = linkedAccounts.some((acc) => acc.provider === 'discord')

  const githubAccount = linkedAccounts.find((acc) => acc.provider === 'github')
  const discordAccount = linkedAccounts.find((acc) => acc.provider === 'discord')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20 animate-pulse h-24" />
        <div className="p-4 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20 animate-pulse h-24" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* GitHub Account */}
      <div className="p-4 rounded-lg bg-background/80 backdrop-blur-lg border border-border/50 hover:bg-background/90 transition-colors">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-foreground/10">
              <Github className="h-5 w-5" />
            </div>
            <div className="space-y-1 flex-1">
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
          <div className="flex items-center gap-2 flex-wrap">
            {isGithubLinked ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseAsAvatar('github')}
                  disabled={isSettingAvatar !== null}
                  className="gap-2 text-xs"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {isSettingAvatar === 'github' ? 'Applying…' : 'Use as avatar'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openUnlinkDialog('github')}
                  disabled={isUnlinking === 'github'}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Unlink
                </Button>
              </>
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
      <div className="p-4 rounded-lg bg-background/80 backdrop-blur-lg border border-border/50 hover:bg-background/90 transition-colors">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#5865F2]/10">
              <SiDiscord className="h-5 w-5 text-[#5865F2]" />
            </div>
            <div className="space-y-1 flex-1">
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
          <div className="flex items-center gap-2 flex-wrap">
            {isDiscordLinked ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseAsAvatar('discord')}
                  disabled={isSettingAvatar !== null}
                  className="gap-2 text-xs"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {isSettingAvatar === 'discord' ? 'Applying…' : 'Use as avatar'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openUnlinkDialog('discord')}
                  disabled={isUnlinking === 'discord'}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Unlink
                </Button>
              </>
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

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink {providerToUnlink?.charAt(0).toUpperCase()}{providerToUnlink?.slice(1)} Account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to unlink your {providerToUnlink} account? 
              </p>
              
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 p-3">
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  ⚠️ You will lose the following perks:
                </p>
                <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 ml-4 list-disc">
                  {providerToUnlink === 'github' && (
                    <>
                      <li>Contributor bonuses (Bronze: 100MB + 1 domain → Diamond: 3GB + 5 domains)</li>
                      <li>GitHub contribution tracking and recognition</li>
                      <li>Automatic perk updates based on your contributions</li>
                    </>
                  )}
                  {providerToUnlink === 'discord' && (
                    <>
                      <li>Server booster perks (+5GB storage)</li>
                      <li>Additional custom domain slot</li>
                      <li>Discord community recognition</li>
                    </>
                  )}
                </ul>
              </div>

              <p className="text-xs text-muted-foreground">
                You can always re-link your account later to regain these benefits.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnlinkAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unlink Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
