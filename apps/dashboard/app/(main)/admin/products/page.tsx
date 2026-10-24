import { redirect } from 'next/navigation'

import AdminProductManager from '@/components/admin/products/ProductManager'
import { AdminShell } from '@/components/admin/admin-shell'
import { isBillingEnabled } from '@/lib/features'
import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Products',
  description: 'Create and manage plan products and pricing.',
})

export default async function AdminProductsPage() {
  if (!(await isBillingEnabled())) redirect('/admin')

  return (
    <AdminShell
      title="Products"
      description="Manage plan products, pricing, and promo codes."
    >
      <AdminProductManager />
    </AdminShell>
  )
}
