'use client'

import { useState } from 'react'

import { CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Textarea } from '@/packages/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/packages/components/ui/select'

type ApplicationType = 'staff' | 'partner' | 'verification' | 'ban-appeal'

const TYPE_ENUM_MAP: Record<ApplicationType, string> = {
    staff: 'STAFF',
    partner: 'PARTNER',
    verification: 'VERIFICATION',
    'ban-appeal': 'BAN_APPEAL',
}

interface ApplicationFormProps {
    type: ApplicationType
}

export function ApplicationForm({ type }: ApplicationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitted, setSubmitted] = useState(false)

    // Staff fields
    const [staffRole, setStaffRole] = useState('')
    const [staffWhy, setStaffWhy] = useState('')
    const [staffExperience, setStaffExperience] = useState('')
    const [staffAvailability, setStaffAvailability] = useState('')

    // Partner fields
    const [partnerWebsite, setPartnerWebsite] = useState('')
    const [partnerDescription, setPartnerDescription] = useState('')
    const [partnerAudience, setPartnerAudience] = useState('')
    const [partnerCollaboration, setPartnerCollaboration] = useState('')

    // Verification fields
    const [verificationReason, setVerificationReason] = useState('')
    const [verificationSocialLinks, setVerificationSocialLinks] = useState('')

    // Ban appeal fields
    const [appealReason, setAppealReason] = useState('')
    const [appealEvidence, setAppealEvidence] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitError(null)
        setIsSubmitting(true)

        let answers: Record<string, unknown> = {}

        if (type === 'staff') {
            answers = {
                role: staffRole,
                why: staffWhy,
                experience: staffExperience,
                availability: Number(staffAvailability),
            }
        } else if (type === 'partner') {
            answers = {
                website: partnerWebsite,
                description: partnerDescription,
                audience: partnerAudience,
                collaboration: partnerCollaboration,
            }
        } else if (type === 'verification') {
            answers = {
                reason: verificationReason,
                socialLinks: verificationSocialLinks
                    ? verificationSocialLinks.split('\n').map((l) => l.trim()).filter(Boolean)
                    : [],
            }
        } else if (type === 'ban-appeal') {
            answers = {
                reason: appealReason,
                evidence: appealEvidence,
            }
        }

        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: TYPE_ENUM_MAP[type], answers }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data?.error ?? `Request failed with status ${res.status}`)
            }

            setSubmitted(true)
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div className="glass-card overflow-hidden p-10 flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Application submitted!</h2>
                    <p className="mt-2 text-muted-foreground">
                        Your application has been submitted. We&apos;ll be in touch.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="glass-card overflow-hidden p-6 space-y-6">
            {type === 'staff' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="staff-role">Role <span className="text-destructive">*</span></Label>
                        <Select value={staffRole} onValueChange={setStaffRole} required>
                            <SelectTrigger id="staff-role">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="developer">Developer</SelectItem>
                                <SelectItem value="designer">Designer</SelectItem>
                                <SelectItem value="support">Support</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="staff-availability">
                            Hours per week available <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="staff-availability"
                            type="number"
                            min={1}
                            placeholder="e.g. 10"
                            value={staffAvailability}
                            onChange={(e) => setStaffAvailability(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="staff-why">
                            Why do you want to join? <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="staff-why"
                            placeholder="Tell us why you want to be part of the Emberly team..."
                            rows={5}
                            minLength={200}
                            maxLength={2000}
                            value={staffWhy}
                            onChange={(e) => setStaffWhy(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground text-right">{staffWhy.length} / 2000</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="staff-experience">
                            Relevant experience <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="staff-experience"
                            placeholder="Describe your relevant experience..."
                            rows={5}
                            minLength={100}
                            maxLength={2000}
                            value={staffExperience}
                            onChange={(e) => setStaffExperience(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground text-right">{staffExperience.length} / 2000</p>
                    </div>
                </>
            )}

            {type === 'partner' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="partner-website">
                            Your website / project URL <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="partner-website"
                            type="url"
                            placeholder="https://yourproject.com"
                            value={partnerWebsite}
                            onChange={(e) => setPartnerWebsite(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="partner-audience">
                            Estimated audience size <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="partner-audience"
                            placeholder="e.g. 5,000 monthly users"
                            value={partnerAudience}
                            onChange={(e) => setPartnerAudience(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="partner-description">
                            Describe your project <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="partner-description"
                            placeholder="Tell us about your project..."
                            rows={5}
                            minLength={100}
                            maxLength={2000}
                            value={partnerDescription}
                            onChange={(e) => setPartnerDescription(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground text-right">{partnerDescription.length} / 2000</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="partner-collaboration">
                            How would you collaborate? <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="partner-collaboration"
                            placeholder="Describe how a partnership would work..."
                            rows={4}
                            minLength={50}
                            maxLength={1000}
                            value={partnerCollaboration}
                            onChange={(e) => setPartnerCollaboration(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground text-right">{partnerCollaboration.length} / 1000</p>
                    </div>
                </>
            )}

            {type === 'verification' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="verification-reason">
                            Why are you requesting verification? <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="verification-reason"
                            placeholder="Explain why your profile should be verified..."
                            rows={5}
                            minLength={50}
                            maxLength={500}
                            value={verificationReason}
                            onChange={(e) => setVerificationReason(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground text-right">{verificationReason.length} / 500</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="verification-social">
                            Relevant social links{' '}
                            <span className="text-muted-foreground text-xs">(optional — one per line)</span>
                        </Label>
                        <Textarea
                            id="verification-social"
                            placeholder={"https://twitter.com/yourhandle\nhttps://youtube.com/@yourchannel"}
                            rows={4}
                            value={verificationSocialLinks}
                            onChange={(e) => setVerificationSocialLinks(e.target.value)}
                        />
                    </div>
                </>
            )}

            {type === 'ban-appeal' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="appeal-reason">
                            Why was the ban incorrect? <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="appeal-reason"
                            placeholder="Explain why the ban was applied incorrectly..."
                            rows={6}
                            minLength={50}
                            maxLength={2000}
                            value={appealReason}
                            onChange={(e) => setAppealReason(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground text-right">{appealReason.length} / 2000</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="appeal-evidence">
                            Supporting evidence{' '}
                            <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <Textarea
                            id="appeal-evidence"
                            placeholder="Any additional context or evidence..."
                            rows={4}
                            value={appealEvidence}
                            onChange={(e) => setAppealEvidence(e.target.value)}
                        />
                    </div>
                </>
            )}

            {submitError && (
                <p className="text-sm text-destructive rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                    {submitError}
                </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting…
                    </>
                ) : (
                    'Submit application'
                )}
            </Button>
        </form>
    )
}
