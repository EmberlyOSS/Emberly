'use client'

import { useCallback, useState } from 'react'

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
        required: false,
        recommended: true,
        colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10',
        glowClass: 'bg-blue-500/10',
    },
    {
        key: 'account' as const,
        label: 'Account Updates',
        description: 'Email verification, profile changes, data exports, and account deletion notices',
        icon: User,
        required: false,
        recommended: true,
        colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
        glowClass: 'bg-emerald-500/10',
    },
    {
        key: 'billing' as const,
        label: 'Billing & Payments',
        description: 'Payment confirmations, subscription updates, invoice receipts, and refund notifications',
        icon: CreditCard,
        required: false,
        recommended: true,
        colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/10',
        glowClass: 'bg-purple-500/10',
    },
    {
        key: 'productUpdates' as const,
        label: 'Product Updates',
        description: 'New features, improvements, changelogs, and important platform announcements',
        icon: Sparkles,
        required: false,
        recommended: false,
        colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10',
        glowClass: 'bg-amber-500/10',
    },
    {
        key: 'marketing' as const,
        label: 'Marketing & Promotions',
        description: 'Special offers, newsletters, tips & tricks, and promotional content',
        icon: Megaphone,
        required: false,
        recommended: false,
        colorClass: 'text-pink-500 bg-pink-500/10 border-pink-500/20 shadow-pink-500/10',
        glowClass: 'bg-pink-500/10',
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

    const handlePreferenceChange = useCallback(async (key: keyof EmailPreferences, value: boolean) => {
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
    }, [preferences, router, onUpdate, toast])

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
                        <p className="text-sm text-muted-foreground" id="notifications-master-desc">
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
                    aria-label="Toggle all email notifications"
                    aria-describedby="notifications-master-desc"
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
                            className={`flex items-start justify-between rounded-2xl border p-5 transition-all duration-300 group ${!notificationsEnabled ? 'opacity-40 grayscale-[0.5]' : 'hover:bg-accent/5 hover:border-accent/20'
                                } ${isEnabled
                                    ? 'bg-accent/5 border-accent/20 shadow-lg shadow-accent/5'
                                    : 'bg-muted/10 border-transparent hover:border-muted-foreground/20'
                                }`}
                        >
                            <div className="flex gap-5">
                                <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all duration-500 ${isEnabled
                                    ? `backdrop-blur-xl ${config.colorClass}`
                                    : 'bg-muted/20 border-border/50 text-muted-foreground'
                                    }`}>
                                    {isEnabled && (
                                        <div className={`absolute inset-0 rounded-2xl ${config.glowClass} blur-xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                                    )}
                                    <Icon className={`relative h-6 w-6 transition-transform duration-500 ${isEnabled ? 'scale-110' : 'scale-100'}`} />
                                </div>
                                <div className="space-y-1.5 pt-0.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Label
                                            htmlFor={`pref-${config.key}`}
                                            className="text-base font-semibold cursor-pointer group-hover:text-primary transition-colors"
                                        >
                                            {config.label}
                                        </Label>
                                        {config.recommended && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed max-w-sm" id={`pref-${config.key}-desc`}>
                                        {config.description}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center self-center pl-4">
                                <Switch
                                    id={`pref-${config.key}`}
                                    checked={isEnabled}
                                    onCheckedChange={(value) => handlePreferenceChange(config.key, value)}
                                    disabled={isLoading || !notificationsEnabled}
                                    className="data-[state=checked]:bg-primary"
                                    aria-label={`Toggle ${config.label}`}
                                    aria-describedby={`pref-${config.key}-desc`}
                                />
                            </div>
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
