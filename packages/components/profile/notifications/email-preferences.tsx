'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
    Bell,
    BellOff,
    CreditCard,
    Megaphone,
    Shield,
    Sparkles,
    User,
} from 'lucide-react'

import { Alert, AlertDescription } from '@/packages/components/ui/alert'
import { Button } from '@/packages/components/ui/button'
import { Label } from '@/packages/components/ui/label'
import { Separator } from '@/packages/components/ui/separator'
import { Switch } from '@/packages/components/ui/switch'

import { useToast } from '@/packages/hooks/use-toast'

export interface EmailPreferences {
    security: boolean
    account: boolean
    billing: boolean
    marketing: boolean
    productUpdates: boolean
}

interface EmailPreferencesProps {
    userId: string
    emailNotificationsEnabled: boolean
    emailPreferences: EmailPreferences
    onUpdate: () => void
}

const PREFERENCE_CONFIG = [
    {
        key: 'security' as const,
        label: 'Security Alerts',
        description: 'Login notifications, password changes, two-factor authentication updates, and suspicious activity alerts',
        icon: Shield,
        required: false, // Users can disable but we recommend keeping it on
        recommended: true,
    },
    {
        key: 'account' as const,
        label: 'Account Updates',
        description: 'Email verification, profile changes, data exports, and account deletion notices',
        icon: User,
        required: false,
        recommended: true,
    },
    {
        key: 'billing' as const,
        label: 'Billing & Payments',
        description: 'Payment confirmations, subscription updates, invoice receipts, and refund notifications',
        icon: CreditCard,
        required: false,
        recommended: true,
    },
    {
        key: 'productUpdates' as const,
        label: 'Product Updates',
        description: 'New features, improvements, changelogs, and important platform announcements',
        icon: Sparkles,
        required: false,
        recommended: false,
    },
    {
        key: 'marketing' as const,
        label: 'Marketing & Promotions',
        description: 'Special offers, newsletters, tips & tricks, and promotional content',
        icon: Megaphone,
        required: false,
        recommended: false,
    },
]

export function EmailPreferences({
    userId,
    emailNotificationsEnabled: initialEnabled,
    emailPreferences: initialPreferences,
    onUpdate,
}: EmailPreferencesProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [notificationsEnabled, setNotificationsEnabled] = useState(initialEnabled)
    const [preferences, setPreferences] = useState<EmailPreferences>(initialPreferences)
    const { toast } = useToast()
    const router = useRouter()

    const handleMasterToggle = async (enabled: boolean) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailNotificationsEnabled: enabled }),
            })

            if (!response.ok) {
                throw new Error('Failed to update notification settings')
            }

            setNotificationsEnabled(enabled)
            router.refresh()
            onUpdate()

            toast({
                title: enabled ? 'Notifications enabled' : 'Notifications disabled',
                description: enabled
                    ? 'You will receive email notifications based on your preferences'
                    : 'You will no longer receive any email notifications',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update settings',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handlePreferenceChange = async (key: keyof EmailPreferences, value: boolean) => {
        setIsLoading(true)
        try {
            const newPreferences = { ...preferences, [key]: value }

            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailPreferences: { [key]: value } }),
            })

            if (!response.ok) {
                throw new Error('Failed to update preference')
            }

            setPreferences(newPreferences)
            router.refresh()
            onUpdate()

            const config = PREFERENCE_CONFIG.find(c => c.key === key)
            toast({
                title: 'Preference updated',
                description: `${config?.label} notifications ${value ? 'enabled' : 'disabled'}`,
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update preference',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const enabledCount = Object.values(preferences).filter(Boolean).length

    return (
        <div className="space-y-6">
            {/* Master toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${notificationsEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                        {notificationsEnabled ? (
                            <Bell className="h-5 w-5 text-primary" />
                        ) : (
                            <BellOff className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                    <div className="space-y-0.5">
                        <Label htmlFor="notifications-master" className="text-base font-medium">
                            Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            {notificationsEnabled
                                ? `Receiving ${enabledCount} of ${PREFERENCE_CONFIG.length} notification types`
                                : 'All email notifications are currently disabled'}
                        </p>
                    </div>
                </div>
                <Switch
                    id="notifications-master"
                    checked={notificationsEnabled}
                    onCheckedChange={handleMasterToggle}
                    disabled={isLoading}
                />
            </div>

            {!notificationsEnabled && (
                <Alert>
                    <BellOff className="h-4 w-4" />
                    <AlertDescription>
                        You&apos;ve disabled all email notifications. You may miss important security alerts
                        and account updates. Consider enabling at least security notifications.
                    </AlertDescription>
                </Alert>
            )}

            <Separator />

            {/* Individual preferences */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Notification Categories
                    </h3>
                    {notificationsEnabled && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                // Enable all recommended
                                PREFERENCE_CONFIG.forEach(config => {
                                    if (config.recommended && !preferences[config.key]) {
                                        handlePreferenceChange(config.key, true)
                                    }
                                })
                            }}
                            disabled={isLoading}
                            className="text-xs"
                        >
                            Enable recommended
                        </Button>
                    )}
                </div>

                {PREFERENCE_CONFIG.map((config) => {
                    const Icon = config.icon
                    const isEnabled = preferences[config.key]

                    return (
                        <div
                            key={config.key}
                            className={`flex items-start justify-between rounded-lg border p-4 transition-colors ${!notificationsEnabled ? 'opacity-50' : ''
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                                    <Icon className={`h-4 w-4 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Label
                                            htmlFor={`pref-${config.key}`}
                                            className="text-sm font-medium cursor-pointer"
                                        >
                                            {config.label}
                                        </Label>
                                        {config.recommended && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        {config.description}
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id={`pref-${config.key}`}
                                checked={isEnabled}
                                onCheckedChange={(value) => handlePreferenceChange(config.key, value)}
                                disabled={isLoading || !notificationsEnabled}
                            />
                        </div>
                    )
                })}
            </div>

            <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>
                    Transactional emails like password resets and verification codes will always be sent
                    regardless of your notification preferences.
                </p>
            </div>
        </div>
    )
}
