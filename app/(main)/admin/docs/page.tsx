import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Docs Management',
  description: 'Edit, publish, and organize documentation content.',
})

const DocManager = dynamic(() =>
    import('@/packages/components/admin/docs/doc-manager').then((m) => m.DocManager)
)

export default async function DocsDashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
        redirect('/dashboard')
    }

    return (
        <div className="container space-y-6">
            <div className="relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
                <div className="relative p-8">
                    <h1 className="text-3xl font-bold">Docs Management</h1>
                    <p className="text-muted-foreground mt-2">Edit, publish, and organize documentation content.</p>
                </div>
            </div>

            <div className="relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
                <div className="relative p-8">
                    <DocManager />
                </div>
            </div>
        </div>
    )
}
