import { ResetForm } from '@/packages/components/auth/reset-form'
import { DynamicBackground } from '@/packages/components/layout/dynamic-background'
import { Icons } from '@/packages/components/shared/icons'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'Reset Password',
    description: 'Set a new password for your Emberly account.',
})

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
    return (
        <main className="relative min-h-[calc(100vh-57px)] overflow-hidden">
            <DynamicBackground />
            <div className="relative z-10 flex min-h-[calc(100vh-57px)] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-[400px] space-y-8">
                    <div className="flex flex-col items-center justify-center">
                        <div className="glass-card">
                            <div className="flex items-center justify-center space-x-3 px-6 py-4">
                                <Icons.logo className="h-8 w-8 text-primary" />
                                <span className="emberly-text text-2xl text-primary">Emberly</span>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card">
                        <div className="p-8">
                            <ResetForm />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
