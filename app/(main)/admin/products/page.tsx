import AdminProductManager from '@/packages/components/admin/products/ProductManager'
import { AdminShell } from '@/packages/components/admin/admin-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Products',
  description: 'Create and manage plan products and pricing.',
})

export default async function AdminProductsPage() {
  return (
    <AdminShell header={
      <div className="glass-card">
        <div className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-2">Manage plan products, pricing, and promo codes.</p>
        </div>
      </div>
    }>
      <AdminProductManager />
    </AdminShell>
  )
}

