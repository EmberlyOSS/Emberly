"use client"

import { useCallback, useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'

import pkg from '@/package.json'
import { ScrollIndicator } from '@/packages/components/ui/scroll-indicator'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import CodeMirror from '@uiw/react-codemirror'
import DOMPurify from 'dompurify'
import { deepEqual } from 'fast-equals'
import {
	AlertCircle,
	CheckCircle2,
	Circle,
	Cloud,
	Code,
	Copy,
	CreditCard,
	Database,
	ExternalLink,
	Eye,
	EyeOff,
	FileCode,
	Github,
	Globe,
	HardDrive,
	Heart,
	Image,
	InfoIcon,
	Key,
	Loader2,
	Lock,
	Palette,
	RefreshCw,
	RotateCcw,
	Save,
	Settings,
	Settings2,
	Shield,
	Sliders,
	Sparkles,
	Upload,
	Users,
	XCircle,
	Zap,
} from 'lucide-react'

import { Icons } from '@/components/shared/icons'
import { AppearancePanel } from '@/components/appearance/appearance-panel'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import type { EmberlyConfig } from '@/lib/config'

import { StorageBucketManager } from '@/packages/components/admin/settings/storage-bucket-manager'
import { useToast } from '@/hooks/use-toast'

// Reusable GlassCard component for consistent styling
function GlassCard({ 
	children, 
	className = '',
	gradient = true 
}: { 
	children: React.ReactNode
	className?: string
	gradient?: boolean
}) {
	return (
		<div className={cn(
			"glass-card overflow-hidden",
			className
		)}>
			{children}
		</div>
	)
}

// Settings section card with icon and better styling
function SettingsSection({ 
	icon: Icon, 
	title, 
	description, 
	children,
	badge,
	className = ''
}: { 
	icon: React.ElementType
	title: string
	description: string
	children: React.ReactNode
	badge?: React.ReactNode
	className?: string
}) {
	return (
		<GlassCard className={className}>
			<div className="p-6 space-y-6">
				<div className="flex items-start gap-4">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
						<Icon className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="text-lg font-semibold">{title}</h3>
							{badge}
						</div>
						<p className="text-sm text-muted-foreground mt-0.5">{description}</p>
					</div>
				</div>
				<div className="space-y-5">
					{children}
				</div>
			</div>
		</GlassCard>
	)
}

// Setting row component for consistent layout
function SettingRow({ 
	label, 
	description, 
	children,
	changed = false 
}: { 
	label: string
	description?: string
	children: React.ReactNode
	changed?: boolean
}) {
	return (
		<div className="flex items-center justify-between gap-4 py-1">
			<div className="space-y-0.5 flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<Label className="text-sm font-medium">{label}</Label>
					{changed && (
						<span className="flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
							<span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
						</span>
					)}
				</div>
				{description && (
					<p className="text-xs text-muted-foreground">{description}</p>
				)}
			</div>
			<div className="flex items-center gap-2 shrink-0">
				{children}
			</div>
		</div>
	)
}

interface ColorConfig {
	background: string
	foreground: string
	card: string
	cardForeground: string
	popover: string
	popoverForeground: string
	primary: string
	primaryForeground: string
	secondary: string
	secondaryForeground: string
	muted: string
	mutedForeground: string
	accent: string
	accentForeground: string
	destructive: string
	destructiveForeground: string
	border: string
	input: string
	ring: string
}

type SettingValue<T extends keyof EmberlyConfig['settings']> = Partial<
	EmberlyConfig['settings'][T]
>

function SettingsSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header skeleton */}
			<div className="glass-card p-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-12 w-12 rounded-xl" />
					<div className="space-y-2">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-72" />
					</div>
				</div>
			</div>

			{/* Tabs skeleton */}
			<div className="flex gap-2 p-1 bg-background/80 rounded-xl border border-border/50 w-fit">
				<Skeleton className="h-10 w-32 rounded-lg" />
				<Skeleton className="h-10 w-32 rounded-lg" />
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>

			{/* Cards skeleton */}
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<div key={i} className="rounded-2xl border border-border/50 bg-background/80 p-6 space-y-6">
						<div className="flex items-start gap-4">
							<Skeleton className="h-11 w-11 rounded-xl shrink-0" />
							<div className="space-y-2 flex-1">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-4 w-64" />
							</div>
						</div>
						<div className="space-y-5">
							<div className="flex items-center justify-between py-1">
								<div className="space-y-1.5">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-48" />
								</div>
								<Skeleton className="h-6 w-12 rounded-full" />
							</div>
							<div className="flex items-center justify-between py-1">
								<div className="space-y-1.5">
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-3 w-40" />
								</div>
								<Skeleton className="h-6 w-12 rounded-full" />
							</div>
							<div className="flex items-center justify-between py-1">
								<div className="space-y-1.5">
									<Skeleton className="h-4 w-36" />
									<Skeleton className="h-3 w-52" />
								</div>
								<Skeleton className="h-10 w-24 rounded-lg" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

const isSafeUrl = (url: string | null): url is string => {
	if (!url) return false
	return url.startsWith('blob:') && /^blob:https?:\/\//.test(url)
}

function SystemApiKeySection() {
	const { toast } = useToast()
	const [exists, setExists] = useState(false)
	const [prefix, setPrefix] = useState<string | null>(null)
	const [createdAt, setCreatedAt] = useState<string | null>(null)
	const [newKey, setNewKey] = useState<string | null>(null)
	const [showKey, setShowKey] = useState(false)
	const [loading, setLoading] = useState(true)
	const [generating, setGenerating] = useState(false)
	const [revoking, setRevoking] = useState(false)

	const fetchMeta = useCallback(async () => {
		try {
			const res = await fetch('/api/admin/system-key')
			if (!res.ok) throw new Error('Failed to fetch')
			const data = await res.json()
			setExists(data.exists)
			setPrefix(data.prefix ?? null)
			setCreatedAt(data.createdAt ?? null)
		} catch {
			toast({ title: 'Error', description: 'Failed to load system key info', variant: 'destructive' })
		} finally {
			setLoading(false)
		}
	}, [toast])

	useEffect(() => { fetchMeta() }, [fetchMeta])

	const handleGenerate = async () => {
		if (exists && !confirm('This will revoke the current key and generate a new one. Continue?')) return
		setGenerating(true)
		setNewKey(null)
		try {
			const res = await fetch('/api/admin/system-key', { method: 'POST' })
			if (!res.ok) throw new Error('Failed to generate')
			const data = await res.json()
			setNewKey(data.key)
			setShowKey(true)
			setExists(true)
			setPrefix(data.prefix)
			setCreatedAt(new Date().toISOString())
			toast({ title: 'Key generated', description: 'Copy it now — it won\'t be shown again.' })
		} catch {
			toast({ title: 'Error', description: 'Failed to generate key', variant: 'destructive' })
		} finally {
			setGenerating(false)
		}
	}

	const handleRevoke = async () => {
		if (!confirm('Revoke the system API key? Any integrations using it will stop working.')) return
		setRevoking(true)
		try {
			const res = await fetch('/api/admin/system-key', { method: 'DELETE' })
			if (!res.ok) throw new Error('Failed to revoke')
			setExists(false)
			setPrefix(null)
			setCreatedAt(null)
			setNewKey(null)
			toast({ title: 'Key revoked' })
		} catch {
			toast({ title: 'Error', description: 'Failed to revoke key', variant: 'destructive' })
		} finally {
			setRevoking(false)
		}
	}

	const copyKey = () => {
		if (!newKey) return
		navigator.clipboard.writeText(newKey)
		toast({ title: 'Copied to clipboard' })
	}

	if (loading) {
		return (
			<SettingsSection icon={Key} title="System API Key" description="Manage the system-level API key for external integrations.">
				<div className="space-y-3">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-40" />
				</div>
			</SettingsSection>
		)
	}

	return (
		<SettingsSection icon={Key} title="System API Key" description="A single key for external integrations like Discord bots. Grants system-level access — treat it like a password.">
			{newKey && (
				<GlassCard>
					<div className="p-4 space-y-2">
						<p className="text-sm font-medium text-primary">New key generated — copy it now, it won&apos;t be shown again.</p>
						<div className="flex items-center gap-2">
							<code className="flex-1 text-xs bg-muted/50 rounded-lg px-3 py-2 font-mono break-all select-all">
								{showKey ? newKey : '•'.repeat(newKey.length)}
							</code>
							<Button variant="ghost" size="icon" className="shrink-0" onClick={() => setShowKey(!showKey)}>
								{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</Button>
							<Button variant="ghost" size="icon" className="shrink-0" onClick={copyKey}>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</GlassCard>
			)}

			{exists && (
				<SettingRow label="Current Key" description={createdAt ? `Created ${new Date(createdAt).toLocaleDateString()}` : undefined}>
					<code className="text-xs text-muted-foreground font-mono">{prefix}••••••••</code>
				</SettingRow>
			)}

			<div className="flex items-center gap-2 pt-2">
				<Button onClick={handleGenerate} disabled={generating || revoking} size="sm">
					{generating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
					{exists ? 'Regenerate Key' : 'Generate Key'}
				</Button>
				{exists && (
					<Button onClick={handleRevoke} disabled={revoking || generating} variant="destructive" size="sm">
						{revoking ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
						Revoke
					</Button>
				)}
			</div>

			{!exists && !newKey && (
				<p className="text-xs text-muted-foreground">No key exists yet. Generate one to use with external integrations.</p>
			)}
		</SettingsSection>
	)
}

export function SettingsManager() {
	const { toast } = useToast()
	const { data: session } = useSession()
	const isSuperAdmin = session?.user?.role === 'SUPERADMIN'

	const [savedConfig, setSavedConfig] = useState<EmberlyConfig | null>(null)
	const [workingConfig, setWorkingConfig] = useState<EmberlyConfig | null>(null)
	const [pendingFaviconFile, setPendingFaviconFile] = useState<File | null>(null)
	const [faviconPreviewUrl, setFaviconPreviewUrl] = useState<string | null>(null)

	const [cssEditorOpen, setCssEditorOpen] = useState(false)
	const [htmlEditorOpen, setHtmlEditorOpen] = useState(false)
	const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
	const [updateInfo, setUpdateInfo] = useState<{
		hasUpdate: boolean
		latestVersion?: string
		releaseUrl?: string
	} | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [intTestStates, setIntTestStates] = useState<Record<string, { loading: boolean; ok?: boolean; message?: string }>>({})
	const [s3TestState, setS3TestState] = useState<{ loading: boolean; ok?: boolean; message?: string } | null>(null)

	const handleIntegrationTest = async (integration: string, credentials: Record<string, string>) => {
		setIntTestStates((s) => ({ ...s, [integration]: { loading: true } }))
		try {
			const res = await fetch('/api/admin/integrations/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ integration, credentials }),
			})
			const data = await res.json()
			setIntTestStates((s) => ({ ...s, [integration]: { loading: false, ok: data?.data?.ok, message: data?.data?.message } }))
		} catch {
			setIntTestStates((s) => ({ ...s, [integration]: { loading: false, ok: false, message: 'Request failed' } }))
		}
	}

	const handleS3Test = async () => {
		if (!workingConfig) return
		setS3TestState({ loading: true })
		const s3 = workingConfig.settings.general.storage.s3
		try {
			const res = await fetch('/api/admin/storage/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bucket: s3?.bucket,
					region: s3?.region,
					accessKeyId: s3?.accessKeyId,
					secretAccessKey: s3?.secretAccessKey,
					endpoint: s3?.endpoint,
					forcePathStyle: s3?.forcePathStyle,
				}),
			})
			const data = await res.json()
			setS3TestState({ loading: false, ok: data?.data?.ok, message: data?.data?.message })
		} catch {
			setS3TestState({ loading: false, ok: false, message: 'Request failed' })
		}
	}

	const hasChanges =
		!deepEqual(savedConfig, workingConfig) || pendingFaviconFile !== null

	const saveChanges = async () => {
		if (!workingConfig) return

		try {
			setIsSaving(true)

			if (pendingFaviconFile) {
				const formData = new FormData()
				formData.append('file', pendingFaviconFile)

				const response = await fetch('/api/settings/favicon', {
					method: 'POST',
					body: formData,
				})

				if (!response.ok) {
					throw new Error('Failed to upload favicon')
				}

				const newConfig = { ...workingConfig }
				newConfig.settings.appearance.favicon = '/api/favicon'
				setWorkingConfig(newConfig)

				const link = document.querySelector(
					"link[rel*='icon']"
				) as HTMLLinkElement
				if (link) {
					link.href = '/api/favicon'
					link.type = 'image/png'
				}

				setPendingFaviconFile(null)
				if (faviconPreviewUrl) {
					URL.revokeObjectURL(faviconPreviewUrl)
					setFaviconPreviewUrl(null)
				}
			}

			const response = await fetch('/api/settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(workingConfig),
			})

			if (!response.ok) throw new Error()

			setSavedConfig(JSON.parse(JSON.stringify(workingConfig)))

			toast({
				title: 'Settings updated',
				description: 'Your changes have been saved successfully',
			})
		} catch (error) {
			console.error('Failed to update settings:', error)
			toast({
				title: 'Failed to update settings',
				description: 'Please try again',
				variant: 'destructive',
			})
		} finally {
			setIsSaving(false)
		}
	}

	const discardChanges = () => {
		if (!savedConfig) return

		if (faviconPreviewUrl) {
			URL.revokeObjectURL(faviconPreviewUrl)
			setFaviconPreviewUrl(null)
		}

		setPendingFaviconFile(null)

		setWorkingConfig(JSON.parse(JSON.stringify(savedConfig)))

		toast({
			title: 'Changes discarded',
			description: 'All changes have been reverted to the saved state',
		})
	}

	const handleSettingChange = useCallback(
		<T extends keyof EmberlyConfig['settings']>(
			section: T,
			value: SettingValue<T>
		) => {
			if (!workingConfig) return

			const newConfig = { ...workingConfig }
			newConfig.settings[section] = {
				...newConfig.settings[section],
				...(value as EmberlyConfig['settings'][T]),
			}
			setWorkingConfig(newConfig)
		},
		[workingConfig]
	)

	const isFieldChanged = useCallback(
		<T extends keyof EmberlyConfig['settings']>(
			section: T,
			fieldPath: string[]
		): boolean => {
			if (!savedConfig || !workingConfig) return false

			let savedValue: unknown = savedConfig.settings[section]
			let workingValue: unknown = workingConfig.settings[section]

			for (const field of fieldPath) {
				if (
					typeof savedValue !== 'object' ||
					savedValue === null ||
					typeof workingValue !== 'object' ||
					workingValue === null
				) {
					return false
				}

				savedValue = (savedValue as Record<string, unknown>)[field]
				workingValue = (workingValue as Record<string, unknown>)[field]
			}

			return !deepEqual(savedValue, workingValue)
		},
		[savedConfig, workingConfig]
	)

	const countChangedSettings = useCallback((): number => {
		if (!savedConfig || !workingConfig) return 0

		let count = 0

		const { storage: _cs1, ...savedGen } = savedConfig.settings.general
		const { storage: _cs2, ...workingGen } = workingConfig.settings.general
		if (!deepEqual(savedGen, workingGen)) {
			count++
		}

		if (!deepEqual(_cs1, _cs2)) {
			count++
		}

		if (
			!deepEqual(savedConfig.settings.appearance, workingConfig.settings.appearance)
		) {
			count++
		}

		if (!deepEqual(savedConfig.settings.advanced, workingConfig.settings.advanced)) {
			count++
		}

		if (!deepEqual(savedConfig.settings.integrations, workingConfig.settings.integrations)) {
			count++
		}

		return count
	}, [savedConfig, workingConfig])

	const getChangedSettingsGroups = useCallback((): string[] => {
		if (!savedConfig || !workingConfig) return []

		const changedGroups: string[] = []

		const { storage: _cg1, ...savedGen } = savedConfig.settings.general
		const { storage: _cg2, ...workingGen } = workingConfig.settings.general
		if (!deepEqual(savedGen, workingGen)) {
			changedGroups.push('General')
		}

		if (!deepEqual(_cg1, _cg2)) {
			changedGroups.push('Storage')
		}

		if (
			!deepEqual(savedConfig.settings.appearance, workingConfig.settings.appearance)
		) {
			changedGroups.push('Appearance')
		}

		if (!deepEqual(savedConfig.settings.advanced, workingConfig.settings.advanced)) {
			changedGroups.push('Advanced')
		}

		if (!deepEqual(savedConfig.settings.integrations, workingConfig.settings.integrations)) {
			changedGroups.push('Integrations')
		}

		return changedGroups
	}, [savedConfig, workingConfig])

	useEffect(() => {
		const loadConfig = async () => {
			try {
				const response = await fetch('/api/settings')
				const responseJson = await response.json()
				if (responseJson?.data) {
					const actualConfigData = responseJson.data
					setSavedConfig(actualConfigData)
					setWorkingConfig(JSON.parse(JSON.stringify(actualConfigData)))
				} else {
					console.error(
						'Failed to load config: Invalid data structure received',
						responseJson
					)
				}
			} catch (error) {
				console.error('Failed to load config:', error)
			}
		}
		loadConfig()
	}, [])

	const handleStorageQuotaChange = (value: string) => {
		if (!workingConfig?.settings?.general?.storage) return
		const numValue = Number.parseInt(value)
		if (Number.isNaN(numValue) || numValue < 0) return

		handleSettingChange('general', {
			storage: {
				...workingConfig.settings.general.storage,
				quotas: {
					...workingConfig.settings.general.storage.quotas,
					default: {
						...workingConfig.settings.general.storage.quotas.default,
						value: numValue,
					},
				},
			},
		})
	}

	const handleMaxUploadSizeChange = (value: string) => {
		if (!workingConfig?.settings?.general?.storage) return
		const numValue = Number.parseInt(value)
		if (Number.isNaN(numValue) || numValue < 1) return

		handleSettingChange('general', {
			storage: {
				...workingConfig.settings.general.storage,
				maxUploadSize: {
					...workingConfig.settings.general.storage.maxUploadSize,
					value: numValue,
				},
			},
		})
	}

	const handleCustomColorsChange = (colors: Partial<ColorConfig>) => {
		handleSettingChange('appearance', {
			customColors: colors,
		})
	}

	const handleThemePresetChange = (themeId: string, backgroundEffect: string, animationSpeed: string) => {
		handleSettingChange('appearance', {
			theme: themeId,
			backgroundEffect,
			animationSpeed,
		})
	}

	/**
	 * Save system/admin appearance directly to /api/settings (PATCH).
	 * Used as the onSave override for AppearancePanel in admin context so it
	 * does NOT call PUT /api/profile like the user-facing flow.
	 */
	const handleAdminSaveAppearance = async (themeId: string, colors: Record<string, string>): Promise<boolean> => {
		try {
			const response = await fetch('/api/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					section: 'appearance',
					data: {
						theme: themeId,
						customColors: colors,
					},
				}),
			})
			if (!response.ok) throw new Error('Failed to save appearance')
			const updatedConfig: EmberlyConfig = await response.json()
			setSavedConfig(JSON.parse(JSON.stringify(updatedConfig)))
			setWorkingConfig(JSON.parse(JSON.stringify(updatedConfig)))
			return true
		} catch (error) {
			console.error('[SettingsManager] Failed to save appearance', error)
			return false
		}
	}

	/**
	 * Track admin theme selections so the "Modified" badge reflects appearance changes
	 * while the admin is previewing (before saving).
	 */
	const handleAdminThemeChange = useCallback((
		themeId: string,
		colors: Record<string, string>,
		meta?: { backgroundEffect?: string; animationSpeed?: string }
	) => {
		handleSettingChange('appearance', {
			theme: themeId,
			backgroundEffect: meta?.backgroundEffect || 'none',
			animationSpeed: meta?.animationSpeed || 'medium',
			customColors: colors,
		})
	}, [handleSettingChange])

	const checkForUpdates = async () => {
		try {
			setIsCheckingUpdate(true)
			const response = await fetch('/api/updates/check')
			if (!response.ok) throw new Error()
			const data = await response.json()
			setUpdateInfo(data)

			toast({
				title: data.hasUpdate ? 'Update Available' : 'No Updates Available',
				description: data.message,
				variant: 'default',
			})
		} catch {
			toast({
				title: 'Failed to check for updates',
				description: 'Please try again later',
				variant: 'destructive',
			})
		} finally {
			setIsCheckingUpdate(false)
		}
	}

	const hasFaviconChanged = useCallback(() => {
		return pendingFaviconFile !== null
	}, [pendingFaviconFile])

	if (
		!workingConfig ||
		!savedConfig ||
		!workingConfig.settings ||
		!savedConfig.settings ||
		!workingConfig.settings.general ||
		!savedConfig.settings.general ||
		!workingConfig.settings.general.storage ||
		!savedConfig.settings.general.storage ||
		!workingConfig.settings.appearance ||
		!savedConfig.settings.appearance ||
		!workingConfig.settings.advanced ||
		!savedConfig.settings.advanced
	) {
		return <SettingsSkeleton />
	}

	const getFieldClasses = (
		section: keyof EmberlyConfig['settings'],
		fieldPath: string[]
	) => {
		const isChanged = isFieldChanged(section, fieldPath)
		return isChanged ? 'border-primary/50 ring-1 ring-primary/30 bg-primary/5 transition-all' : 'transition-all'
	}

	const ChangeIndicator = () => (
		<span className="flex h-2 w-2">
			<span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
			<span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
		</span>
	)

	const generalHasChanges = (() => {
		if (!savedConfig || !workingConfig) return false
		const { storage: _sg1, ...savedGen } = savedConfig.settings.general
		const { storage: _sg2, ...workingGen } = workingConfig.settings.general
		return !deepEqual(savedGen, workingGen)
	})()
	const storageHasChanges = !deepEqual(savedConfig?.settings.general?.storage, workingConfig?.settings.general?.storage)
	const appearanceHasChanges = !deepEqual(savedConfig?.settings.appearance, workingConfig?.settings.appearance)
	const advancedHasChanges = !deepEqual(savedConfig?.settings.advanced, workingConfig?.settings.advanced)
	const integrationsHasChanges = !deepEqual(savedConfig?.settings.integrations, workingConfig?.settings.integrations)

	return (
		<div className="space-y-6 pb-32">
			{/* Page Header - Removed as it's now in the parent page */}

			{/* Admin read-only notice */}
			{!isSuperAdmin && (
				<div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-700 dark:text-amber-400">
					<Lock className="mt-0.5 h-4 w-4 shrink-0" />
					<span>
						<strong>Read-only mode.</strong> You can view and test settings, but saving changes and viewing secret keys requires <strong>Super Administrator</strong> access.
					</span>
				</div>
			)}

			{/* Main Content */}
			<Tabs defaultValue="general" className="space-y-6">
				{/* Improved Tab Navigation */}
				<ScrollIndicator className="-mx-2 px-2">
					<TabsList className="inline-flex h-12 items-center justify-start gap-1 glass-subtle p-1.5 shadow-sm">
						<TabsTrigger 
							value="general" 
							className="relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-border/50"
						>
							<Sliders className="h-4 w-4" />
							<span>General</span>
							{generalHasChanges && (
								<span className="absolute -top-1 -right-1 flex h-3 w-3">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
									<span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger 
							value="storage" 
							className="relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-border/50"
						>
							<HardDrive className="h-4 w-4" />
							<span>Storage</span>
							{storageHasChanges && (
								<span className="absolute -top-1 -right-1 flex h-3 w-3">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
									<span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger 
							value="integrations" 
							className="relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-border/50"
						>
							<Key className="h-4 w-4" />
							<span>Integrations</span>
							{integrationsHasChanges && (
								<span className="absolute -top-1 -right-1 flex h-3 w-3">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
									<span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger 
							value="appearance" 
							className="relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-border/50"
						>
							<Palette className="h-4 w-4" />
							<span>Appearance</span>
							{appearanceHasChanges && (
								<span className="absolute -top-1 -right-1 flex h-3 w-3">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
									<span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger 
							value="advanced" 
							className="relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-border/50"
						>
							<Code className="h-4 w-4" />
							<span>Advanced</span>
							{advancedHasChanges && (
								<span className="absolute -top-1 -right-1 flex h-3 w-3">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
									<span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
								</span>
							)}
						</TabsTrigger>
					</TabsList>
				</ScrollIndicator>

				{/* General Settings Tab */}
				<TabsContent value="general" className="space-y-5 mt-0">
					{/* Instance Information */}
					<SettingsSection
						icon={InfoIcon}
						title="Instance Information"
						description="View and manage your Emberly instance details"
						badge={
							updateInfo?.hasUpdate && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
									<Sparkles className="h-3 w-3" />
									Update available
								</span>
							)
						}
					>
						<SettingRow
							label="Current Version"
							description={`Emberly v${pkg.version}${updateInfo ? (updateInfo.hasUpdate ? ` → ${updateInfo.latestVersion}` : ' (Latest)') : ''}`}
						>
							<div className="flex items-center gap-2">
								{updateInfo?.hasUpdate && (
									<Button variant="outline" size="sm" asChild>
										<a
											href={updateInfo.releaseUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2"
										>
											<ExternalLink className="h-4 w-4" />
											View Release
										</a>
									</Button>
								)}
								<Button 
									onClick={checkForUpdates} 
									disabled={isCheckingUpdate}
									variant={updateInfo?.hasUpdate ? "default" : "outline"}
									size="sm"
								>
									{isCheckingUpdate ? (
										<>
											<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
											Checking...
										</>
									) : (
										<>
											<RefreshCw className="mr-2 h-4 w-4" />
											Check Updates
										</>
									)}
								</Button>
							</div>
						</SettingRow>

						<div className="flex items-center gap-2 pt-2">
							<Button variant="outline" size="sm" asChild className="h-9">
								<a
									href="https://github.com/EmberlyOSS/Emberly"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Github className="mr-2 h-4 w-4" />
									GitHub
								</a>
							</Button>
							<Button variant="outline" size="sm" asChild className="h-9">
								<a
									href="https://ko-fi.com/codemeapixel"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Heart className="mr-2 h-4 w-4 text-red-500" />
									Sponsor
								</a>
							</Button>
						</div>
					</SettingsSection>

					{/* User Management */}
					<SettingsSection
						icon={Users}
						title="User Management"
						description="Configure user registration and quota settings"
					>
						<SettingRow
							label="Allow Registrations"
							description="Enable or disable new user registrations"
							changed={isFieldChanged('general', ['registrations', 'enabled'])}
						>
							<Switch
								checked={workingConfig.settings.general.registrations.enabled}
								onCheckedChange={(checked) =>
									handleSettingChange('general', {
										registrations: {
											...workingConfig.settings.general.registrations,
											enabled: checked,
										},
									})
								}
								className={getFieldClasses('general', ['registrations', 'enabled'])}
							/>
						</SettingRow>

						{!workingConfig.settings.general.registrations.enabled && (
							<div className="space-y-2 pl-0.5">
								<Label className="text-sm font-medium">Disabled Message</Label>
								<Input
									placeholder="Registrations are currently disabled"
									value={workingConfig.settings.general.registrations.disabledMessage || ''}
									onChange={(e) =>
										handleSettingChange('general', {
											registrations: {
												...workingConfig.settings.general.registrations,
												disabledMessage: e.target.value,
											},
										})
									}
									className={cn("max-w-md", getFieldClasses('general', ['registrations', 'disabledMessage']))}
								/>
								<p className="text-xs text-muted-foreground">
									Shown to users when registrations are disabled
								</p>
							</div>
						)}

					</SettingsSection>

					{/* Credits */}
					<SettingsSection
						icon={Heart}
						title="Credits & Attribution"
						description="Manage footer credits visibility"
					>
						<SettingRow
							label="Show Credits Footer"
							description="Display Emberly credits in the footer"
							changed={isFieldChanged('general', ['credits', 'showFooter'])}
						>
							<Switch
								checked={workingConfig.settings.general.credits.showFooter}
								onCheckedChange={(checked) =>
									handleSettingChange('general', {
										credits: { showFooter: checked },
									})
								}
								className={getFieldClasses('general', ['credits', 'showFooter'])}
							/>
						</SettingRow>

						{!workingConfig.settings.general.credits.showFooter && (
							<Alert className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400">
								<Heart className="h-4 w-4" />
								<AlertDescription>
									If you disable credits, please consider{' '}
									<a 
										href="https://ko-fi.com/codemeapixel" 
										target="_blank" 
										rel="noopener noreferrer"
										className="underline font-medium hover:no-underline"
									>
										sponsoring the project
									</a>{' '}
									to support its development.
								</AlertDescription>
							</Alert>
						)}
					</SettingsSection>
				</TabsContent>

				{/* Storage Tab */}
			<TabsContent value="storage" className="space-y-5 mt-0">
				{/* User Quotas */}
				<SettingsSection
					icon={Users}
					title="User Quotas"
					description="Configure storage limits per user"
				>
					<SettingRow
						label="User Quotas"
						description="Enable storage limits per user"
						changed={isFieldChanged('general', ['storage', 'quotas', 'enabled'])}
					>
						<Switch
							checked={workingConfig.settings.general.storage.quotas.enabled}
							onCheckedChange={(checked) =>
								handleSettingChange('general', {
									storage: {
										...workingConfig.settings.general.storage,
										quotas: {
											...workingConfig.settings.general.storage.quotas,
											enabled: checked,
										},
									},
								})
							}
							className={getFieldClasses('general', ['storage', 'quotas', 'enabled'])}
						/>
					</SettingRow>

					<div className="space-y-2 pl-0.5">
						<div className="flex items-center gap-2">
							<Label className="text-sm font-medium">Default Storage Quota</Label>
							{isFieldChanged('general', ['storage', 'quotas', 'default', 'value']) && <ChangeIndicator />}
						</div>
						<div className="flex items-center gap-2 max-w-xs">
							<Input
								type="number"
								min="0"
								step="1"
								value={workingConfig.settings.general.storage.quotas.default.value}
								onChange={(e) => handleStorageQuotaChange(e.target.value)}
								placeholder="500"
								className={cn("flex-1", getFieldClasses('general', ['storage', 'quotas', 'default', 'value']))}
							/>
							<Select
								value={workingConfig.settings.general.storage.quotas.default.unit}
								onValueChange={(value) =>
									handleSettingChange('general', {
										storage: {
											...workingConfig.settings.general.storage,
											quotas: {
												...workingConfig.settings.general.storage.quotas,
												default: {
													...workingConfig.settings.general.storage.quotas.default,
													unit: value as 'MB' | 'GB',
												},
											},
										},
									})
								}
							>
								<SelectTrigger className={cn("w-20", getFieldClasses('general', ['storage', 'quotas', 'default', 'unit']))}>
									<SelectValue placeholder="Unit" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="MB">MB</SelectItem>
									<SelectItem value="GB">GB</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</SettingsSection>

				{/* Storage Provider */}
				<SettingsSection
					icon={HardDrive}
					title="Storage Settings"
					description="Configure storage provider and file upload limits"
				>
					<SettingRow
						label="Background OCR Processing"
						description="Enable OCR to search text in uploaded images"
						changed={isFieldChanged('general', ['ocr', 'enabled'])}
					>
						<Switch
							checked={workingConfig.settings.general.ocr.enabled}
							onCheckedChange={(checked) =>
								handleSettingChange('general', {
									ocr: { enabled: checked },
								})
							}
							className={getFieldClasses('general', ['ocr', 'enabled'])}
						/>
					</SettingRow>

					<div className="space-y-2 pl-0.5">
						<div className="flex items-center gap-2">
							<Label className="text-sm font-medium">Storage Provider</Label>
							{isFieldChanged('general', ['storage', 'provider']) && <ChangeIndicator />}
						</div>
						<Select
							value={workingConfig.settings.general.storage.provider}
							onValueChange={(value) =>
								handleSettingChange('general', {
									storage: {
										...workingConfig.settings.general.storage,
										provider: value as 'local' | 's3',
									},
								})
							}
						>
							<SelectTrigger className={cn("max-w-xs", getFieldClasses('general', ['storage', 'provider']))}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="local">
									<div className="flex items-center gap-2">
										<HardDrive className="h-4 w-4" />
										Local Storage
									</div>
								</SelectItem>
								<SelectItem value="s3">
									<div className="flex items-center gap-2">
										<Cloud className="h-4 w-4" />
										S3 Storage
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{workingConfig.settings.general.storage.provider === 's3' && (
						<GlassCard className="mt-4" gradient={false}>
							<div className="p-4 space-y-4">
								<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
									<Cloud className="h-4 w-4" />
									S3 Configuration
								</div>

								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<Label className="text-sm">Bucket Name</Label>
										<Input
											value={workingConfig.settings.general.storage.s3.bucket}
											onChange={(e) =>
												handleSettingChange('general', {
													storage: {
														...workingConfig.settings.general.storage,
														s3: {
															...workingConfig.settings.general.storage.s3,
															bucket: e.target.value,
														},
													},
												})
											}
											placeholder="my-bucket"
											className={getFieldClasses('general', ['storage', 's3', 'bucket'])}
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-sm">Region</Label>
										<Input
											value={workingConfig.settings.general.storage.s3.region}
											onChange={(e) =>
												handleSettingChange('general', {
													storage: {
														...workingConfig.settings.general.storage,
														s3: {
															...workingConfig.settings.general.storage.s3,
															region: e.target.value,
														},
													},
												})
											}
											placeholder="us-east-1"
											className={getFieldClasses('general', ['storage', 's3', 'region'])}
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-sm">Access Key ID</Label>
										<Input
											type="password"
											value={workingConfig.settings.general.storage.s3.accessKeyId}
											onChange={(e) =>
												handleSettingChange('general', {
													storage: {
														...workingConfig.settings.general.storage,
														s3: {
															...workingConfig.settings.general.storage.s3,
															accessKeyId: e.target.value,
														},
													},
												})
											}
											placeholder="AKIAXXXXXXXXXXXXXXXX"
											className={getFieldClasses('general', ['storage', 's3', 'accessKeyId'])}
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-sm">Secret Access Key</Label>
										<Input
											type="password"
											value={workingConfig.settings.general.storage.s3.secretAccessKey}
											onChange={(e) =>
												handleSettingChange('general', {
													storage: {
														...workingConfig.settings.general.storage,
														s3: {
															...workingConfig.settings.general.storage.s3,
															secretAccessKey: e.target.value,
														},
													},
												})
											}
											placeholder="••••••••••••••••••••"
											className={getFieldClasses('general', ['storage', 's3', 'secretAccessKey'])}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-sm">Custom Endpoint (Optional)</Label>
									<Input
										value={workingConfig.settings.general.storage.s3.endpoint || ''}
										onChange={(e) =>
											handleSettingChange('general', {
												storage: {
													...workingConfig.settings.general.storage,
													s3: {
														...workingConfig.settings.general.storage.s3,
														endpoint: e.target.value,
													},
												},
											})
										}
										placeholder="https://s3.custom-domain.com"
										className={getFieldClasses('general', ['storage', 's3', 'endpoint'])}
									/>
									<p className="text-xs text-muted-foreground">
										For S3-compatible services like MinIO or DigitalOcean Spaces
									</p>
								</div>

								<SettingRow
									label="Force Path Style"
									description="Enable for S3-compatible services requiring path-style URLs"
									changed={isFieldChanged('general', ['storage', 's3', 'forcePathStyle'])}
								>
									<Switch
										checked={workingConfig.settings.general.storage.s3.forcePathStyle}
										onCheckedChange={(checked) =>
											handleSettingChange('general', {
												storage: {
													...workingConfig.settings.general.storage,
													s3: {
														...workingConfig.settings.general.storage.s3,
														forcePathStyle: checked,
													},
												},
											})
										}
										className={getFieldClasses('general', ['storage', 's3', 'forcePathStyle'])}
									/>
								</SettingRow>

								<div className="pt-3 border-t border-border/30 flex items-center justify-between gap-3">
									<div>
										{s3TestState && !s3TestState.loading && (
											<span className={`text-xs flex items-center gap-1.5 ${s3TestState.ok ? 'text-green-500' : 'text-destructive'}`}>
												{s3TestState.ok
													? <CheckCircle2 className="h-3.5 w-3.5" />
													: <AlertCircle className="h-3.5 w-3.5" />}
												{s3TestState.message}
											</span>
										)}
									</div>
									<Button
										variant="outline"
										size="sm"
										className="h-8 gap-1.5 shrink-0"
										disabled={s3TestState?.loading}
										onClick={handleS3Test}
									>
										{s3TestState?.loading
											? <Loader2 className="h-3.5 w-3.5 animate-spin" />
											: <RefreshCw className="h-3.5 w-3.5" />}
										Test Connection
									</Button>
								</div>
							</div>
						</GlassCard>
					)}

					<div className="space-y-2 pl-0.5">
						<div className="flex items-center gap-2">
							<Label className="text-sm font-medium">Maximum Upload Size</Label>
							{isFieldChanged('general', ['storage', 'maxUploadSize', 'value']) && <ChangeIndicator />}
						</div>
						<div className="flex items-center gap-2 max-w-xs">
							<Input
								type="number"
								min="1"
								step="1"
								value={workingConfig.settings.general.storage.maxUploadSize.value}
								onChange={(e) => handleMaxUploadSizeChange(e.target.value)}
								placeholder="10"
								className={cn("flex-1", getFieldClasses('general', ['storage', 'maxUploadSize', 'value']))}
							/>
							<Select
								value={workingConfig.settings.general.storage.maxUploadSize.unit}
								onValueChange={(value) =>
									handleSettingChange('general', {
										storage: {
											...workingConfig.settings.general.storage,
											maxUploadSize: {
												...workingConfig.settings.general.storage.maxUploadSize,
												unit: value as 'MB' | 'GB',
											},
										},
									})
								}
							>
								<SelectTrigger className={cn("w-20", getFieldClasses('general', ['storage', 'maxUploadSize', 'unit']))}>
									<SelectValue placeholder="Unit" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="MB">MB</SelectItem>
									<SelectItem value="GB">GB</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</SettingsSection>

				{/* Additional Storage Buckets */}
				<SettingsSection
					icon={Database}
					title="Additional Storage Buckets"
					description="Create named S3 buckets that can be assigned to specific users or squads, overriding the default storage."
				>
					<StorageBucketManager />
				</SettingsSection>
			</TabsContent>

			{/* Appearance Tab */}
				<TabsContent value="appearance" className="space-y-5 mt-0">
					{/* Theme Colors */}
					<SettingsSection
						icon={Palette}
						title="Theme & Colors"
						description="Customize the visual appearance of your Emberly instance"
						badge={
							appearanceHasChanges && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
									Modified
								</span>
							)
						}
					>
						<AppearancePanel
							onSave={handleAdminSaveAppearance}
							onThemeChange={handleAdminThemeChange}
						/>
					</SettingsSection>

					{/* Favicon */}
					<SettingsSection
						icon={Image}
						title="Favicon"
						description="Upload a custom favicon for your instance"
						badge={
							hasFaviconChanged() && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
									Unsaved
								</span>
							)
						}
					>
						<div className="flex items-center justify-center w-full">
							<label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:bg-muted/30 hover:border-primary/30 transition-all group">
								{(workingConfig?.settings.appearance.favicon || faviconPreviewUrl) && (
									<div className="absolute top-3 left-3">
										<div className="flex items-center gap-2 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg border border-border/50">
											<img
												src={
													isSafeUrl(faviconPreviewUrl)
														? DOMPurify.sanitize(faviconPreviewUrl)
														: '/api/favicon'
												}
												alt="Favicon"
												className="w-5 h-5"
											/>
											<span className="text-xs text-muted-foreground">
												{faviconPreviewUrl ? 'Preview (unsaved)' : 'Current'}
											</span>
										</div>
									</div>
								)}
								<div className="flex flex-col items-center justify-center pt-5 pb-6">
									<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors mb-3">
										<Upload className="h-5 w-5 text-primary" />
									</div>
									<p className="text-sm font-medium">Click to upload favicon</p>
									<p className="text-xs text-muted-foreground mt-1">PNG up to 1MB</p>
								</div>
								<input
									type="file"
									className="hidden"
									accept="image/png"
									onChange={async (e) => {
										const file = e.target.files?.[0]
										if (!file) return

										if (file.size > 1024 * 1024) {
											toast({
												title: 'File too large',
												description: 'Please upload a file smaller than 1MB',
												variant: 'destructive',
											})
											return
										}

										if (file.type !== 'image/png') {
											toast({
												title: 'Invalid file type',
												description: 'Please upload a PNG image file',
												variant: 'destructive',
											})
											return
										}

										try {
											if (faviconPreviewUrl) {
												URL.revokeObjectURL(faviconPreviewUrl)
											}

											const previewUrl = URL.createObjectURL(file)
											setFaviconPreviewUrl(previewUrl)
											setPendingFaviconFile(file)

											toast({
												title: 'Favicon changed',
												description: 'Save your changes to apply the new favicon',
											})
										} catch (error) {
											console.error('Failed to handle favicon:', error)
											toast({
												title: 'Failed to update favicon',
												description: 'Please try again',
												variant: 'destructive',
											})
										}
									}}
								/>
							</label>
						</div>
					</SettingsSection>
				</TabsContent>

				{/* Advanced Tab */}
				<TabsContent value="advanced" className="space-y-5 mt-0">
					{/* Custom CSS */}
					<SettingsSection
						icon={Code}
						title="Custom CSS"
						description="Add custom CSS styles to your instance"
						badge={
							isFieldChanged('advanced', ['customCSS']) && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
									Modified
								</span>
							)
						}
					>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<p className="text-sm text-muted-foreground">
									Custom CSS will be injected into every page
								</p>
								<Button
									variant={cssEditorOpen ? "default" : "outline"}
									size="sm"
									onClick={() => setCssEditorOpen(!cssEditorOpen)}
								>
									<Code className="mr-2 h-4 w-4" />
									{cssEditorOpen ? 'Close' : 'Open Editor'}
								</Button>
							</div>
							{cssEditorOpen && (
								<GlassCard gradient={false} className="overflow-hidden">
									<div className="p-1">
										<CodeMirror
											value={workingConfig.settings.advanced.customCSS}
											height="250px"
											extensions={[css()]}
											onChange={(value) => {
												handleSettingChange('advanced', {
													customCSS: value,
												})
											}}
											theme="dark"
											className="rounded-lg overflow-hidden text-sm"
										/>
									</div>
								</GlassCard>
							)}
						</div>
					</SettingsSection>

					{/* Custom HTML */}
					<SettingsSection
						icon={FileCode}
						title="HTML Head Content"
						description="Add custom HTML to the head section of every page"
						badge={
							isFieldChanged('advanced', ['customHead']) && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
									Modified
								</span>
							)
						}
					>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<p className="text-sm text-muted-foreground">
									Add scripts, meta tags, or other HTML elements
								</p>
								<Button
									variant={htmlEditorOpen ? "default" : "outline"}
									size="sm"
									onClick={() => setHtmlEditorOpen(!htmlEditorOpen)}
								>
									<FileCode className="mr-2 h-4 w-4" />
									{htmlEditorOpen ? 'Close' : 'Open Editor'}
								</Button>
							</div>
							{htmlEditorOpen && (
								<GlassCard gradient={false} className="overflow-hidden">
									<div className="p-1">
										<CodeMirror
											value={workingConfig.settings.advanced.customHead}
											height="250px"
											extensions={[html()]}
											onChange={(value) => {
												handleSettingChange('advanced', {
													customHead: value,
												})
											}}
											theme="dark"
											className="rounded-lg overflow-hidden text-sm"
										/>
									</div>
								</GlassCard>
							)}
						</div>
					</SettingsSection>
				</TabsContent>

				{/* Integrations Tab */}
				<TabsContent value="integrations" className="space-y-5 mt-0">
					<SystemApiKeySection />

					{/* Stripe */}
					<SettingsSection
						icon={CreditCard}
						title="Stripe"
						description="Payment processing. Overrides STRIPE_SECRET and STRIPE_WEBHOOK env vars."
						badge={
							isFieldChanged('integrations', ['stripe']) && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
									Modified
								</span>
							)
						}
					>
						<SettingRow label="Secret Key" description="Stripe secret key (sk_live_... or sk_test_...)">
							<Input
								type="password"
								placeholder="sk_live_..."
								className="w-80 font-mono text-sm"
								value={workingConfig?.settings.integrations?.stripe?.secretKey ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									stripe: {
										...workingConfig?.settings.integrations?.stripe,
										secretKey: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<SettingRow label="Webhook Secret" description="Signing secret for Stripe webhook events">
							<Input
								type="password"
								placeholder="whsec_..."
								className="w-80 font-mono text-sm"
								value={workingConfig?.settings.integrations?.stripe?.webhookSecret ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									stripe: {
										...workingConfig?.settings.integrations?.stripe,
										webhookSecret: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<div className="pt-3 border-t border-border/30 flex items-center justify-between gap-3">
							<div>
								{intTestStates['stripe'] && !intTestStates['stripe'].loading && (
									<span className={`text-xs flex items-center gap-1.5 ${intTestStates['stripe'].ok ? 'text-green-500' : 'text-destructive'}`}>
										{intTestStates['stripe'].ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
										{intTestStates['stripe'].message}
									</span>
								)}
							</div>
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 shrink-0"
								disabled={intTestStates['stripe']?.loading}
								onClick={() => handleIntegrationTest('stripe', {
									secretKey: workingConfig?.settings.integrations?.stripe?.secretKey ?? '',
								})}
							>
								{intTestStates['stripe']?.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
								Test Connection
							</Button>
						</div>
					</SettingsSection>

					{/* Resend */}
					<SettingsSection
						icon={Zap}
						title="Resend"
						description="Transactional email delivery. Overrides RESEND_API_KEY and EMAIL_FROM env vars."
						badge={
							isFieldChanged('integrations', ['resend']) && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
									Modified
								</span>
							)
						}
					>
						<SettingRow label="API Key" description="Resend API key">
							<Input
								type="password"
								placeholder="re_..."
								className="w-80 font-mono text-sm"
								value={workingConfig?.settings.integrations?.resend?.apiKey ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									resend: {
										...workingConfig?.settings.integrations?.resend,
										apiKey: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<SettingRow label="From Address" description="Sender address for outgoing emails">
							<Input
								placeholder="Emberly <noreply@embrly.ca>"
								className="w-80 text-sm"
								value={workingConfig?.settings.integrations?.resend?.emailFrom ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									resend: {
										...workingConfig?.settings.integrations?.resend,
										emailFrom: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<div className="pt-3 border-t border-border/30 flex items-center justify-between gap-3">
							<div>
								{intTestStates['resend'] && !intTestStates['resend'].loading && (
									<span className={`text-xs flex items-center gap-1.5 ${intTestStates['resend'].ok ? 'text-green-500' : 'text-destructive'}`}>
										{intTestStates['resend'].ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
										{intTestStates['resend'].message}
									</span>
								)}
							</div>
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 shrink-0"
								disabled={intTestStates['resend']?.loading}
								onClick={() => handleIntegrationTest('resend', {
									apiKey: workingConfig?.settings.integrations?.resend?.apiKey ?? '',
								})}
							>
								{intTestStates['resend']?.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
								Test Connection
							</Button>
						</div>
					</SettingsSection>

					{/* Cloudflare */}
					<SettingsSection
						icon={Cloud}
						title="Cloudflare"
						description="CDN, DNS, and storage. Overrides CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_ZONE_ID env vars."
						badge={
							isFieldChanged('integrations', ['cloudflare']) && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
									Modified
								</span>
							)
						}
					>
						<SettingRow label="API Token" description="Cloudflare API token with required permissions">
							<Input
								type="password"
								placeholder="API token"
								className="w-80 font-mono text-sm"
								value={workingConfig?.settings.integrations?.cloudflare?.apiToken ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									cloudflare: {
										...workingConfig?.settings.integrations?.cloudflare,
										apiToken: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<SettingRow label="Account ID" description="Your Cloudflare account ID">
							<Input
								placeholder="Account ID"
								className="w-80 font-mono text-sm"
								value={workingConfig?.settings.integrations?.cloudflare?.accountId ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									cloudflare: {
										...workingConfig?.settings.integrations?.cloudflare,
										accountId: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<SettingRow label="Zone ID" description="Cloudflare zone ID for your domain">
							<Input
								placeholder="Zone ID"
								className="w-80 font-mono text-sm"
								value={workingConfig?.settings.integrations?.cloudflare?.zoneId ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									cloudflare: {
										...workingConfig?.settings.integrations?.cloudflare,
										zoneId: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<div className="pt-3 border-t border-border/30 flex items-center justify-between gap-3">
							<div>
								{intTestStates['cloudflare'] && !intTestStates['cloudflare'].loading && (
									<span className={`text-xs flex items-center gap-1.5 ${intTestStates['cloudflare'].ok ? 'text-green-500' : 'text-destructive'}`}>
										{intTestStates['cloudflare'].ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
										{intTestStates['cloudflare'].message}
									</span>
								)}
							</div>
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 shrink-0"
								disabled={intTestStates['cloudflare']?.loading}
								onClick={() => handleIntegrationTest('cloudflare', {
									apiToken: workingConfig?.settings.integrations?.cloudflare?.apiToken ?? '',
									accountId: workingConfig?.settings.integrations?.cloudflare?.accountId ?? '',
								})}
							>
								{intTestStates['cloudflare']?.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
								Test Connection
							</Button>
						</div>
					</SettingsSection>

					{/* Discord */}
					<SettingsSection
						icon={Shield}
						title="Discord"
						description="Alerts, webhooks, and supporter perks. Overrides DISCORD_WEBHOOK_URL, DISCORD_BOT_TOKEN, DISCORD_SERVER_ID, and DISCORD_SUPPORTER_ROLE env vars."
						badge={
							isFieldChanged('integrations', ['discord']) && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
									Modified
								</span>
							)
						}
					>
						<SettingRow label="Admin Webhook URL" description="Webhook for admin alerts and notifications">
							<Input
								type="password"
								placeholder="https://discord.com/api/webhooks/..."
								className="w-80 font-mono text-sm"
								value={workingConfig?.settings.integrations?.discord?.webhookUrl ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									discord: {
										...workingConfig?.settings.integrations?.discord,
										webhookUrl: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<SettingRow label="Bot Token" description="Token for your Discord bot">
							<Input
								type="password"
								placeholder="Bot token"
								className="w-80 font-mono text-sm"
								value={workingConfig?.settings.integrations?.discord?.botToken ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									discord: {
										...workingConfig?.settings.integrations?.discord,
										botToken: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<SettingRow label="Server ID" description="Discord server (guild) ID">
							<Input
								placeholder="Server ID"
								className="w-80 font-mono text-sm"
								value={workingConfig?.settings.integrations?.discord?.serverId ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									discord: {
										...workingConfig?.settings.integrations?.discord,
										serverId: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<SettingRow label="Supporter Role ID" description="Role ID granted to active supporters">
							<Input
								placeholder="Role ID"
								className="w-80 font-mono text-sm"
								value={workingConfig?.settings.integrations?.discord?.supporterRole ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									discord: {
										...workingConfig?.settings.integrations?.discord,
										supporterRole: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<div className="pt-3 border-t border-border/30 flex items-center justify-between gap-3">
							<div>
								{intTestStates['discord'] && !intTestStates['discord'].loading && (
									<span className={`text-xs flex items-center gap-1.5 ${intTestStates['discord'].ok ? 'text-green-500' : 'text-destructive'}`}>
										{intTestStates['discord'].ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
										{intTestStates['discord'].message}
									</span>
								)}
							</div>
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 shrink-0"
								disabled={intTestStates['discord']?.loading}
								onClick={() => handleIntegrationTest('discord', {
									webhookUrl: workingConfig?.settings.integrations?.discord?.webhookUrl ?? '',
									botToken: workingConfig?.settings.integrations?.discord?.botToken ?? '',
									serverId: workingConfig?.settings.integrations?.discord?.serverId ?? '',
								})}
							>
								{intTestStates['discord']?.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
								Test Connection
							</Button>
						</div>
					</SettingsSection>

					{/* GitHub */}
					<SettingsSection
						icon={Github}
						title="GitHub"
						description="Organization data for contributors and changelogs. Overrides GITHUB_ORG and GITHUB_PAT env vars."
						badge={
							isFieldChanged('integrations', ['github']) && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
									Modified
								</span>
							)
						}
					>
						<SettingRow label="Organization" description="GitHub organization name">
							<Input
								placeholder="EmberlyOSS"
								className="w-80 font-mono text-sm"
								value={workingConfig?.settings.integrations?.github?.org ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									github: {
										...workingConfig?.settings.integrations?.github,
										org: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<SettingRow label="Personal Access Token" description="PAT for authenticated API requests">
							<Input
								type="password"
								placeholder="ghp_..."
								className="w-80 font-mono text-sm"
								value={workingConfig?.settings.integrations?.github?.pat ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									github: {
										...workingConfig?.settings.integrations?.github,
										pat: e.target.value,
									},
								})}
							/>
						</SettingRow>
						<div className="pt-3 border-t border-border/30 flex items-center justify-between gap-3">
							<div>
								{intTestStates['github'] && !intTestStates['github'].loading && (
									<span className={`text-xs flex items-center gap-1.5 ${intTestStates['github'].ok ? 'text-green-500' : 'text-destructive'}`}>
										{intTestStates['github'].ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
										{intTestStates['github'].message}
									</span>
								)}
							</div>
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 shrink-0"
								disabled={intTestStates['github']?.loading}
								onClick={() => handleIntegrationTest('github', {
									pat: workingConfig?.settings.integrations?.github?.pat ?? '',
									org: workingConfig?.settings.integrations?.github?.org ?? '',
								})}
							>
								{intTestStates['github']?.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
								Test Connection
							</Button>
						</div>
					</SettingsSection>

					{/* Kener */}
					<SettingsSection
						icon={Globe}
						title="Kener"
						description="Self-hosted status page (emberlystat.us). Overrides KENER_API_KEY and KENER_BASE_URL env vars."
						badge={
							isFieldChanged('integrations', ['kener']) && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
									Modified
								</span>
							)
						}
					>
						<SettingRow label="API Key" description="Kener bearer token (from your Kener instance settings)">
							<Input
								type="password"
								placeholder="Bearer token"
								className="w-80 font-mono text-sm"
								value={(workingConfig?.settings.integrations as any)?.kener?.apiKey ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									kener: {
										...(workingConfig?.settings.integrations as any)?.kener,
										apiKey: e.target.value,
									},
								} as any)}
							/>
						</SettingRow>
						<SettingRow label="Base URL" description="Public URL of your Kener instance">
							<Input
								placeholder="https://emberlystat.us"
								className="w-80 text-sm"
								value={(workingConfig?.settings.integrations as any)?.kener?.baseUrl ?? ''}
								onChange={(e) => handleSettingChange('integrations', {
									kener: {
										...(workingConfig?.settings.integrations as any)?.kener,
										baseUrl: e.target.value,
									},
								} as any)}
							/>
						</SettingRow>
						<div className="pt-3 border-t border-border/30 flex items-center justify-between gap-3">
							<div>
								{intTestStates['kener'] && !intTestStates['kener'].loading && (
									<span className={`text-xs flex items-center gap-1.5 ${intTestStates['kener'].ok ? 'text-green-500' : 'text-destructive'}`}>
										{intTestStates['kener'].ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
										{intTestStates['kener'].message}
									</span>
								)}
							</div>
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 shrink-0"
								disabled={intTestStates['kener']?.loading}
								onClick={() => handleIntegrationTest('kener', {
									apiKey: (workingConfig?.settings.integrations as any)?.kener?.apiKey ?? '',
									baseUrl: (workingConfig?.settings.integrations as any)?.kener?.baseUrl ?? 'https://emberlystat.us',
								})}
							>
								{intTestStates['kener']?.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
								Test Connection
							</Button>
						</div>
					</SettingsSection>
				</TabsContent>
			</Tabs>

			{/* Floating Save Bar */}
			{hasChanges && isSuperAdmin && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
					<div className="flex items-center gap-3 px-5 py-3 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/20">
						<div className="flex items-center gap-3 pr-3 border-r border-border/50">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
								<span className="flex h-2.5 w-2.5">
									<span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary opacity-75" />
									<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
								</span>
							</div>
							<div className="text-sm">
								<span className="font-semibold">{countChangedSettings()}</span>
								<span className="text-muted-foreground ml-1">
									{countChangedSettings() === 1 ? 'section' : 'sections'} modified
								</span>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								onClick={discardChanges}
								className="h-9 px-4 rounded-xl hover:bg-destructive/10 hover:text-destructive"
								size="sm"
							>
								<RotateCcw className="mr-2 h-4 w-4" />
								Discard
							</Button>
							<Button
								onClick={saveChanges}
								disabled={isSaving}
								className="h-9 px-5 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
								size="sm"
							>
								{isSaving ? (
									<>
										<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<CheckCircle2 className="mr-2 h-4 w-4" />
										Save Changes
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
