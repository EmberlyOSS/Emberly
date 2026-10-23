import TestimonialList from '@/packages/components/admin/testimonials/testimonial-list'
import { AdminShell } from '@/packages/components/admin/admin-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Testimonial Management',
  description: 'Manage user-submitted testimonials shown on the site.',
})

export default async function TestimonialsPage() {
  return (
    <AdminShell
      title="Testimonial Management"
      description="Manage user-submitted testimonials shown on the site."
    >
      <TestimonialList />
    </AdminShell>
  )
}
