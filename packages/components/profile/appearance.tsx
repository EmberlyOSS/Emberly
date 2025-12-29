'use client'

import { useCallback, useState } from 'react'
import { Card } from '@/packages/components/ui/card'
import { PRESET_HUES, THEME_PRESETS } from '@/packages/components/theme/theme-customizer'
import { useProfile } from '@/packages/hooks/use-profile'

export function ProfileAppearance() {
    const { updateProfile } = useProfile()
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null)

    const applyPreset = useCallback((preset: any) => {
        // preset is the preset object with { name, colors, description }
        const colors = preset.colors || preset
        Object.entries(colors).forEach(([key, value]) => {
            const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
            document.documentElement.style.setProperty(`--${cssKey}`, value as string)
        })
        // set attribute for global effects (snowfall)
        try {
            document.documentElement.setAttribute('data-theme', preset.name)
        } catch (e) {
            // noop
        }
        setSelectedTheme(preset.name)
    }, [])

    const applyHue = useCallback((hue: number) => {
        const DEFAULT_COLORS: Record<string, string> = {
            background: '222.2 84% 4.9%',
            foreground: '210 40% 98%',
            card: '222.2 84% 4.9%',
            cardForeground: '210 40% 98%',
            popover: '222.2 84% 4.9%',
            popoverForeground: '210 40% 98%',
            primary: '210 40% 98%',
            primaryForeground: '222.2 47.4% 11.2%',
            secondary: '217.2 32.6% 17.5%',
            secondaryForeground: '210 40% 98%',
            muted: '217.2 32.6% 17.5%',
            mutedForeground: '215 20.2% 65.1%',
            accent: '217.2 32.6% 17.5%',
            accentForeground: '210 40% 98%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '210 40% 98%',
            border: '217.2 32.6% 17.5%',
            input: '217.2 32.6% 17.5%',
            ring: '212.7 26.8% 83.9%',
        }

        Object.entries(DEFAULT_COLORS).forEach(([key, value]) => {
            if (key === 'destructive' || key === 'destructiveForeground') {
                const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
                document.documentElement.style.setProperty(`--${cssKey}`, value)
                return
            }
            const [, s, l] = (value as string).split(' ')
            const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
            document.documentElement.style.setProperty(`--${cssKey}`, `${hue} ${s} ${l}`)
        })

        setSelectedTheme(`hue:${hue}`)
        try {
            document.documentElement.setAttribute('data-theme', `hue:${hue}`)
        } catch (e) { }
    }, [])

    const handleSave = useCallback(async () => {
        if (!selectedTheme) return
        await updateProfile({ theme: selectedTheme })
    }, [selectedTheme, updateProfile])

    return (
        <div className="space-y-4">
            <Card className="p-4 bg-white/5 dark:bg-black/5 backdrop-blur-sm border-white/10 dark:border-white/5">
                <div className="text-sm font-semibold mb-2">Curated themes</div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {THEME_PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => applyPreset(preset)}
                            className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 dark:bg-black/5 p-4 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                        >
                            <div
                                className="absolute inset-0 opacity-60"
                                style={{
                                    background: `linear-gradient(120deg, hsl(${preset.colors.primary}), hsl(${preset.colors.accent}))`,
                                }}
                            />
                            <div className="relative space-y-1">
                                <div className="text-sm font-semibold leading-tight">{preset.name}</div>
                                <p className="text-xs text-muted-foreground leading-snug">{preset.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            <Card className="p-4 bg-white/5 dark:bg-black/5 backdrop-blur-sm border-white/10 dark:border-white/5">
                <div className="text-sm font-semibold mb-2">Quick hues</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {PRESET_HUES.map(({ hue, name, saturation, lightness }) => (
                        <button
                            key={hue}
                            onClick={() => applyHue(hue)}
                            className={`relative h-14 w-full overflow-hidden rounded-xl border border-white/10 transition-all hover:border-white/30 hover:shadow-lg`}
                            style={{ background: `hsl(${hue}, ${saturation}%, ${lightness}%)` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20 pointer-events-none" />
                            <div className="absolute inset-0 flex items-center justify-center font-medium tracking-wide text-[13px] text-white text-shadow-sm">{name}</div>
                        </button>
                    ))}
                </div>
            </Card>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Changes affect only your current browser session until saved.</div>
                <div>
                    <button
                        disabled={!selectedTheme}
                        onClick={handleSave}
                        className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-all ${selectedTheme ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30' : 'opacity-50 cursor-not-allowed bg-white/10'}`}
                    >
                        Save Appearance
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProfileAppearance
