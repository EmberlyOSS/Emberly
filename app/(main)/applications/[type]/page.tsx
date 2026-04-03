import { notFound, redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { ApplicationForm } from '@/packages/components/applications/application-form'
import HomeShell from '@/packages/components/layout/home-shell'

type ApplicationType = 'staff' | 'partner' | 'verification' | 'ban-appeal'

const VALID_TYPES: ApplicationType[] = ['staff', 'partner', 'verification', 'ban-appeal']

const TYPE_META: Record<ApplicationType, { title: string; description: string }> = {
    staff: {
        title: 'Staff Application',
        description: 'Apply to join the Emberly team.',
    },
    partner: {
        title: 'Partner Application',
        description: 'Apply to become an Emberly partner.',
    },
    verification: {
        title: 'Verification Request',
        description: 'Request profile verification on Emberly.',
    },
    'ban-appeal': {
        title: 'Ban Appeal',
        description: 'Submit an appeal to have your account suspension reviewed.',
    },
}

interface PageProps {
    params: Promise<{ type: string }>
}

export async function generateMetadata({ params }: PageProps) {
    const { type } = await params
    if (!VALID_TYPES.includes(type as ApplicationType)) return {}
    const meta = TYPE_META[type as ApplicationType]
    return buildPageMetadata({ title: meta.title, description: meta.description })
}

export default async function ApplicationTypePage({ params }: PageProps) {
    const { type } = await params

    if (!VALID_TYPES.includes(type as ApplicationType)) {
        notFound()
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
        redirect('/auth/login')
    }

    const applicationType = type as ApplicationType
    const meta = TYPE_META[applicationType]

    return (
        <HomeShell>
            <div className="container space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">{meta.title}</h1>
                    <p className="mt-2 text-muted-foreground">{meta.description}</p>
                </div>
                <ApplicationForm type={applicationType} />
            </div>
        </HomeShell>
    )
}
