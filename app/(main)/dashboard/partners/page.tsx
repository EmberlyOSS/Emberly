import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import PartnerList from '@/components/dashboard/partners/partner-list'
import { authOptions } from '@/lib/auth'

export default async function PartnersPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
        redirect('/dashboard')
    }

    return (
        <div className="container space-y-6">
            <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                <div className="relative p-8">
                    <h1 className="text-3xl font-bold">Partner Management</h1>
                    <p className="text-muted-foreground mt-2">Manage partner entries shown on the site.</p>
                </div>
            </div>

            <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                <div className="relative p-8">
                    {/* @ts-expect-error Server -> Client component */}
                    <PartnerList />
                </div>
            </div>
        </div>
    )
}
