import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'

import AdminProductManager from '@/packages/components/admin/products/ProductManager'
import { authOptions } from '@/packages/lib/auth'

export default async function AdminProductsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
        redirect('/dashboard')
    }

    return (
        <div className="container space-y-6">
            <div className="relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
                <div className="relative p-8">
                    <h1 className="text-3xl font-bold">Products</h1>
                    <p className="text-muted-foreground mt-2">Create and manage plan products and pricing.</p>
                </div>
            </div>

            <div className="relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
                <div className="relative p-8">
                    <AdminProductManager />
                </div>
            </div>
        </div>
    )
}
