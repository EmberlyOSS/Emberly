"use client"

import { useCallback, useEffect, useState } from 'react'

import pkg from '@/package.json'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import CodeMirror from '@uiw/react-codemirror'
import DOMPurify from 'dompurify'
import { deepEqual } from 'fast-equals'
import {
	CheckCircle2,
	Circle,
	Cloud,
	Code,
	CreditCard,
	Database,
	ExternalLink,
	FileCode,
	Github,
	Globe,
	HardDrive,
	Heart,
	Image,
	InfoIcon,
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
			"relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden",
			className
		)}>
			{gradient && (
				<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
			)}
			<div className="relative">{children}</div>
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
			<div className="relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 p-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-12 w-12 rounded-xl" />
					<div className="space-y-2">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-72" />
					</div>
				</div>
			</div>

			{/* Tabs skeleton */}
			<div className="flex gap-2 p-1 bg-background/30 rounded-xl border border-border/30 w-fit">
				<Skeleton className="h-10 w-32 rounded-lg" />
				<Skeleton className="h-10 w-32 rounded-lg" />
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>

			{/* Cards skeleton */}
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<div key={i} className="rounded-2xl border border-border/50 bg-background/60 p-6 space-y-6">
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

export function SettingsManager() {
	const { toast } = useToast()
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

		if (!deepEqual(savedConfig.settings.general, workingConfig.settings.general)) {
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

		return count
	}, [savedConfig, workingConfig])

	const getChangedSettingsGroups = useCallback((): string[] => {
		if (!savedConfig || !workingConfig) return []

		const changedGroups: string[] = []

		if (!deepEqual(savedConfig.settings.general, workingConfig.settings.general)) {
			changedGroups.push('General')
		}

		if (
			!deepEqual(savedConfig.settings.appearance, workingConfig.settings.appearance)
		) {
			changedGroups.push('Appearance')
		}

		if (!deepEqual(savedConfig.settings.advanced, workingConfig.settings.advanced)) {
			changedGroups.push('Advanced')
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

	const generalHasChanges = !deepEqual(savedConfig?.settings.general, workingConfig?.settings.general)
	const appearanceHasChanges = !deepEqual(savedConfig?.settings.appearance, workingConfig?.settings.appearance)
	const advancedHasChanges = !deepEqual(savedConfig?.settings.advanced, workingConfig?.settings.advanced)

	return (
		<div className="space-y-6 pb-32">
			{/* Page Header - Removed as it's now in the parent page */}

			{/* Main Content */}
			<Tabs defaultValue="general" className="space-y-6">
				{/* Improved Tab Navigation */}
				<div className="overflow-x-auto -mx-2 px-2">
					<TabsList className="inline-flex h-12 items-center justify-start gap-1 rounded-xl bg-background/50 backdrop-blur-sm p-1.5 border border-border/50 shadow-sm">
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
				</div>

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
									href="https://github.com/EmberlyOSS/Website"
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

					{/* Storage Settings */}
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
							onSaveAsSystemTheme={async (themeId, colors) => {
								const res = await fetch('/api/admin/themes/save', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ themeId, colors }),
								})
								if (res.ok) {
									const data = await res.json()
									toast({ title: 'Success', description: data.message })
									return true
								} else {
									toast({ title: 'Error', description: 'Failed to save system theme', variant: 'destructive' })
									return false
								}
							}}
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
			</Tabs>

			{/* Floating Save Bar */}
			{hasChanges && (
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
