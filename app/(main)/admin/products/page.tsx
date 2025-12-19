import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/packages/lib/auth'
import PageShell from '@/packages/components/layout/PageShell'
import AdminProductManager from '@/packages/components/admin/products/ProductManager'

export default async function AdminProductsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
        redirect('/login')
    }

    return (
        <PageShell title="Products" subtitle="Create and manage plan products" bodyVariant="plain">
            <section className="mx-auto px-4 py-10">
                <AdminProductManager />
            </section>
        </PageShell>
    )
}
