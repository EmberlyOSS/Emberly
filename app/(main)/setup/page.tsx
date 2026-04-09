'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  Database,
  HardDrive,
  Info,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Server,
  Settings2,
  Shield,
  User,
  Users,
} from 'lucide-react'
import { signIn } from 'next-auth/react'

import { DynamicBackground } from '@/packages/components/layout/dynamic-background'
import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { useToast } from '@/packages/hooks/use-toast'

interface SetupData {
  admin: { name: string; email: string; password: string }
  storage: {
    provider: 'local' | 's3'
    s3: {
      bucket: string
      region: string
      accessKeyId: string
      secretAccessKey: string
      endpoint: string
      forcePathStyle: boolean
    }
  }
  registrations: { enabled: boolean; disabledMessage: string }
}

const defaultSetupData: SetupData = {
  admin: { name: '', email: '', password: '' },
  storage: {
    provider: 'local',
    s3: { bucket: '', region: '', accessKeyId: '', secretAccessKey: '', endpoint: '', forcePathStyle: false },
  },
  registrations: { enabled: true, disabledMessage: '' },
}

const STEPS = [
  { id: 1, label: 'Admin Account', icon: User },
  { id: 2, label: 'Storage',       icon: HardDrive },
  { id: 3, label: 'Registrations', icon: Users },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, idx) => {
        const Icon = s.icon
        const done = current > s.id
        const active = current === s.id
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${done ? 'border-primary bg-primary text-primary-foreground' : active ? 'border-primary bg-primary/15 text-primary' : 'border-border/50 bg-muted/30 text-muted-foreground'}`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-[11px] font-medium whitespace-nowrap ${active ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-5 transition-colors ${current > s.id ? 'bg-primary/50' : 'bg-border/40'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function FieldRow({ icon: Icon, label, hint, children }: { icon: React.ElementType; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{children}</span>
    </div>
  )
}

function WarnBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<SetupData>(defaultSetupData)
  const { toast } = useToast()
  const router = useRouter()

  const setAdmin = (patch: Partial<SetupData['admin']>) =>
    setData((d) => ({ ...d, admin: { ...d.admin, ...patch } }))
  const setStorage = (patch: Partial<SetupData['storage']>) =>
    setData((d) => ({ ...d, storage: { ...d.storage, ...patch } }))
  const setS3 = (patch: Partial<SetupData['storage']['s3']>) =>
    setData((d) => ({ ...d, storage: { ...d.storage, s3: { ...d.storage.s3, ...patch } } }))
  const setReg = (patch: Partial<SetupData['registrations']>) =>
    setData((d) => ({ ...d, registrations: { ...d.registrations, ...patch } }))

  const step1Valid = !!data.admin.name && !!data.admin.email && !!data.admin.password
  const step2Valid =
    data.storage.provider === 'local' ||
    (!!data.storage.s3.bucket && !!data.storage.s3.region &&
      !!data.storage.s3.accessKeyId && !!data.storage.s3.secretAccessKey)

  const handleSubmit = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to complete setup')
      }
      const result = await signIn('credentials', {
        emailOrUsername: data.admin.email,
        password: data.admin.password,
        redirect: false,
      })
      if (result?.error) throw new Error('Failed to sign in after setup')
      toast({ title: 'Setup complete', description: 'Your Emberly instance is ready.' })
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Setup failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <DynamicBackground />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-[480px] space-y-6">

          {/* Logo + title */}
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="glass-card">
              <div className="flex items-center gap-3 px-6 py-3.5">
                <Icons.logo className="h-7 w-7 text-primary" />
                <span className="emberly-text text-xl text-primary">Emberly</span>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">Initial Setup</h1>
              <p className="text-sm text-muted-foreground mt-1">Configure your Emberly instance</p>
            </div>
          </div>

          {/* Main card */}
          <div className="glass-card">
            <div className="p-7">
              <StepIndicator current={step} />

              {/* ── Step 1: Admin account ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="mb-5">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="p-2 rounded-lg bg-primary/15">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <h2 className="font-semibold">Create your admin account</h2>
                    </div>
                    <p className="text-sm text-muted-foreground pl-[2.75rem]">
                      This will be the superadmin for your instance.
                    </p>
                  </div>
                  <FieldRow icon={User} label="Username">
                    <Input
                      placeholder="Choose a username"
                      value={data.admin.name}
                      onChange={(e) => setAdmin({ name: e.target.value })}
                      className="h-10 bg-background/50"
                      autoFocus
                    />
                  </FieldRow>
                  <FieldRow icon={Mail} label="Email address">
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      value={data.admin.email}
                      onChange={(e) => setAdmin({ email: e.target.value })}
                      className="h-10 bg-background/50"
                    />
                  </FieldRow>
                  <FieldRow icon={Lock} label="Password">
                    <Input
                      type="password"
                      placeholder="Create a strong password"
                      value={data.admin.password}
                      onChange={(e) => setAdmin({ password: e.target.value })}
                      className="h-10 bg-background/50"
                    />
                  </FieldRow>
                </div>
              )}

              {/* ── Step 2: Storage ── */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="mb-5">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="p-2 rounded-lg bg-primary/15">
                        <Database className="h-4 w-4 text-primary" />
                      </div>
                      <h2 className="font-semibold">Configure storage</h2>
                    </div>
                    <p className="text-sm text-muted-foreground pl-[2.75rem]">
                      Where uploaded files will be stored.
                    </p>
                  </div>
                  <FieldRow icon={Server} label="Storage provider">
                    <Select
                      value={data.storage.provider}
                      onValueChange={(v: 'local' | 's3') => setStorage({ provider: v })}
                    >
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local filesystem</SelectItem>
                        <SelectItem value="s3">S3-compatible</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  {data.storage.provider === 'local' && (
                    <InfoBanner>
                      Files will be stored on the local filesystem. Ensure you have enough disk space and regular backups.
                    </InfoBanner>
                  )}
                  {data.storage.provider === 's3' && (
                    <>
                      <InfoBanner>
                        Files will be stored in an S3-compatible service — AWS S3, MinIO, DigitalOcean Spaces, etc.
                      </InfoBanner>
                      <div className="grid grid-cols-2 gap-3">
                        <FieldRow icon={Database} label="Bucket name">
                          <Input
                            placeholder="my-bucket"
                            value={data.storage.s3.bucket}
                            onChange={(e) => setS3({ bucket: e.target.value })}
                            className="h-10 bg-background/50"
                          />
                        </FieldRow>
                        <FieldRow icon={Settings2} label="Region">
                          <Input
                            placeholder="us-east-1"
                            value={data.storage.s3.region}
                            onChange={(e) => setS3({ region: e.target.value })}
                            className="h-10 bg-background/50"
                          />
                        </FieldRow>
                      </div>
                      <FieldRow icon={KeyRound} label="Access key ID">
                        <Input
                          type="password"
                          placeholder="AKIA…"
                          value={data.storage.s3.accessKeyId}
                          onChange={(e) => setS3({ accessKeyId: e.target.value })}
                          className="h-10 bg-background/50"
                        />
                      </FieldRow>
                      <FieldRow icon={Lock} label="Secret access key">
                        <Input
                          type="password"
                          placeholder="Secret key"
                          value={data.storage.s3.secretAccessKey}
                          onChange={(e) => setS3({ secretAccessKey: e.target.value })}
                          className="h-10 bg-background/50"
                        />
                      </FieldRow>
                      <FieldRow icon={Server} label="Custom endpoint" hint="Leave blank for AWS S3">
                        <Input
                          placeholder="https://s3.example.com"
                          value={data.storage.s3.endpoint}
                          onChange={(e) => setS3({ endpoint: e.target.value })}
                          className="h-10 bg-background/50"
                        />
                      </FieldRow>
                    </>
                  )}
                </div>
              )}

              {/* ── Step 3: Registrations ── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="mb-5">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="p-2 rounded-lg bg-primary/15">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <h2 className="font-semibold">User registrations</h2>
                    </div>
                    <p className="text-sm text-muted-foreground pl-[2.75rem]">
                      Control who can sign up. You can change this anytime in Settings.
                    </p>
                  </div>
                  <InfoBanner>
                    More registration options are available in admin settings after setup.
                  </InfoBanner>
                  <FieldRow icon={Users} label="Allow new registrations">
                    <Select
                      value={data.registrations.enabled ? 'true' : 'false'}
                      onValueChange={(v) => setReg({ enabled: v === 'true' })}
                    >
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Enabled — anyone can register</SelectItem>
                        <SelectItem value="false">Disabled — invite only</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  {!data.registrations.enabled && (
                    <>
                      <WarnBanner>
                        Registrations are disabled. New users won't be able to sign up until you re-enable this.
                      </WarnBanner>
                      <FieldRow icon={Settings2} label="Disabled message" hint="Shown on the login page">
                        <Input
                          placeholder="Registrations are currently closed."
                          value={data.registrations.disabledMessage}
                          onChange={(e) => setReg({ disabledMessage: e.target.value })}
                          className="h-10 bg-background/50"
                        />
                      </FieldRow>
                    </>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-2 mt-8 pt-6 border-t border-border/50">
                {step > 1 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)} className="h-10">
                    Back
                  </Button>
                )}
                {step < 3 && (
                  <Button
                    className="flex-1 h-10"
                    onClick={() => setStep(step + 1)}
                    disabled={step === 1 ? !step1Valid : !step2Valid}
                  >
                    Continue
                  </Button>
                )}
                {step === 3 && (
                  <Button className="flex-1 h-10" onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up…
                      </>
                    ) : (
                      'Complete Setup'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Need help?{' '}
            <a
              href="https://github.com/EmberlyOSS/Emberly/blob/dev/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Read the setup docs
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
