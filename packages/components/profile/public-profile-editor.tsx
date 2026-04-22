'use client'

import { useState } from 'react'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Textarea } from '@/packages/components/ui/textarea'
import { Badge } from '@/packages/components/ui/badge'
import { useToast } from '@/packages/hooks/use-toast'
import {
  Github,
  Twitter,
  Globe,
  Copy,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { SiDiscord } from 'react-icons/si'
import Link from 'next/link'

interface PublicProfileEditorProps {
  user: {
    id: string
    name: string | null
    fullName: string | null
    image: string | null
    bio: string | null
    website: string | null
    twitter: string | null
    github: string | null
    discord: string | null
    isProfilePublic: boolean
    showLinkedAccounts: boolean
    profileVisibility: string
    urlId: string
    vanityId: string | null
  }
  onSave?: () => void
}

export function PublicProfileEditor({ user, onSave }: PublicProfileEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    bio: user.bio || '',
    website: user.website || '',
    twitter: user.twitter || '',
    github: user.github || '',
    discord: user.discord || '',
    isProfilePublic: user.isProfilePublic,
    showLinkedAccounts: user.showLinkedAccounts,
  })

  const { toast } = useToast()
  const profileUrl = user.name
  const fullProfileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${profileUrl}`

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleTogglePublic = () => {
    setFormData((prev) => ({
      ...prev,
      isProfilePublic: !prev.isProfilePublic,
    }))
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      toast({
        title: 'Success',
        description: 'Your public profile has been updated',
      })

      onSave?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullProfileUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast({
        title: 'Copied',
        description: 'Profile URL copied to clipboard',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy URL',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile URL Section */}
      <div className="glass-subtle p-6">
        <h3 className="font-semibold mb-4">Your Public Profile</h3>
        <div className="flex items-center gap-2">
          <Input
            value={fullProfileUrl}
            readOnly
            className="bg-muted/30 text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            className="flex-shrink-0"
          >
            {isCopied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Share this link to show others your profile and perks
        </p>
      </div>

      {/* Full Name */}
      <div className="glass-subtle p-6">
        <Label htmlFor="fullName" className="font-semibold mb-2 block">
          Full Name
        </Label>
        <Input
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Your full name (optional)"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Displayed on your public profile alongside your username
        </p>
      </div>

      {/* Bio */}
      <div className="glass-subtle p-6">
        <Label htmlFor="bio" className="font-semibold mb-2 block">
          Bio
        </Label>
        <Textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Tell others about yourself..."
          className="resize-none h-24"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-2">
          {formData.bio.length}/500 characters
        </p>
      </div>

      {/* Social Links */}
      <div className="glass-subtle p-6">
        <h3 className="font-semibold mb-4">Social Links</h3>
        <div className="space-y-4">
          {/* Website */}
          <div>
            <Label htmlFor="website" className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4" />
              Website
            </Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
              type="url"
            />
          </div>

          {/* Twitter */}
          <div>
            <Label htmlFor="twitter" className="flex items-center gap-2 mb-2">
              <Twitter className="w-4 h-4" />
              Twitter
            </Label>
            <Input
              id="twitter"
              name="twitter"
              value={formData.twitter}
              onChange={handleChange}
              placeholder="@username"
            />
          </div>

          {/* GitHub */}
          <div>
            <Label htmlFor="github" className="flex items-center gap-2 mb-2">
              <Github className="w-4 h-4" />
              GitHub
            </Label>
            <Input
              id="github"
              name="github"
              value={formData.github}
              onChange={handleChange}
              placeholder="username"
            />
          </div>

          {/* Discord */}
          <div>
            <Label htmlFor="discord" className="flex items-center gap-2 mb-2">
              <SiDiscord className="w-4 h-4" style={{ color: '#5865F2' }} />
              Discord
            </Label>
            <Input
              id="discord"
              name="discord"
              value={formData.discord}
              onChange={handleChange}
              placeholder="username"
            />
          </div>
        </div>
      </div>

      {/* Visibility Settings */}
      <div className="glass-subtle p-6">
        <h3 className="font-semibold mb-4">Profile Visibility</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">
                {formData.isProfilePublic ? 'Public Profile' : 'Private Profile'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formData.isProfilePublic
                  ? 'Your profile is visible to everyone'
                  : 'Your profile is hidden from public view'}
              </p>
            </div>
            <Button
              variant={formData.isProfilePublic ? 'default' : 'outline'}
              onClick={handleTogglePublic}
              size="sm"
            >
              {formData.isProfilePublic ? 'Public' : 'Private'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Show Connected Accounts</p>
              <p className="text-xs text-muted-foreground">
                Display your linked Discord and GitHub accounts on your public profile
              </p>
            </div>
            <Button
              variant={formData.showLinkedAccounts ? 'default' : 'outline'}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  showLinkedAccounts: !prev.showLinkedAccounts,
                }))
              }
              size="sm"
            >
              {formData.showLinkedAccounts ? 'Visible' : 'Hidden'}
            </Button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-2 sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 -mx-4 rounded-t-lg border-t border-primary/10">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  )
}
