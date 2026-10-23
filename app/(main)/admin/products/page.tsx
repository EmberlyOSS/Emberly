import { redirect } from 'next/navigation'

import AdminProductManager from '@/packages/components/admin/products/ProductManager'
import { AdminShell } from '@/packages/components/admin/admin-shell'
import { isCloudEnabled } from '@/packages/lib/config/env'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Products',
  description: 'Create and manage plan products and pricing.',
})

export default async function AdminProductsPage() {
  if (!isCloudEnabled()) redirect('/admin')

  return (
    <AdminShell
      title="Products"
      description="Manage plan products, pricing, and promo codes."
    >
      <AdminProductManager />
    </AdminShell>
  )
}
