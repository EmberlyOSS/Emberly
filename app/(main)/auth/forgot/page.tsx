import { ForgotForm } from '@/packages/components/auth/forgot-form'
import { DynamicBackground } from '@/packages/components/layout/dynamic-background'
import { Icons } from '@/packages/components/shared/icons'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'Forgot Password',
    description: 'Reset your Emberly account password.',
})

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
    return (
        <main className="relative min-h-[calc(100vh-57px)] overflow-hidden">
            <DynamicBackground />
            <div className="relative z-10 flex min-h-[calc(100vh-57px)] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-[400px] space-y-8">
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                            <div className="relative flex items-center justify-center space-x-3 px-6 py-4">
                                <Icons.logo className="h-8 w-8 text-primary" />
                                <span className="emberly-text text-2xl text-primary">Emberly</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                        <div className="relative p-8">
                            <ForgotForm />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
