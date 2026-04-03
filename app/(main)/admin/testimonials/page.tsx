import TestimonialList from '@/packages/components/admin/testimonials/testimonial-list'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Testimonial Management',
  description: 'Manage user-submitted testimonials shown on the site.',
})

export default async function TestimonialsPage() {

    return (
        <div className="container space-y-6">
            <div className="glass-card">
                <div className="p-8">
                    <h1 className="text-3xl font-bold tracking-tight">Testimonial Management</h1>
                    <p className="text-muted-foreground mt-2">Manage user-submitted testimonials shown on the site.</p>
                </div>
            </div>

            <TestimonialList />
        </div>
    )
}
