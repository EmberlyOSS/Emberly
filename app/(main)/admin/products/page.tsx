import AdminProductManager from '@/packages/components/admin/products/ProductManager'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Products',
  description: 'Create and manage plan products and pricing.',
})

export default async function AdminProductsPage() {

    return (
        <div className="container space-y-6">
            <div className="glass-card">
                <div className="p-8">
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground mt-2">Create and manage plan products and pricing.</p>
                </div>
            </div>

            <AdminProductManager />
        </div>
    )
}
