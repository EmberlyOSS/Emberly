import TestimonialList from '@/components/admin/testimonials/testimonial-list'
import { AdminShell } from '@/components/admin/admin-shell'
import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Testimonials',
  description: 'Manage user-submitted testimonials shown on the site.',
})

export default async function TestimonialsPage() {
  return (
    <AdminShell
      title="Testimonials"
      description="Manage user-submitted testimonials shown on the site."
    >
      <TestimonialList />
    </AdminShell>
  )
}
