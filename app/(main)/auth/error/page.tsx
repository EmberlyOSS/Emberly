import { DynamicBackground } from '@/packages/components/layout/dynamic-background'
import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import Link from 'next/link'

export const metadata = buildPageMetadata({
  title: 'Authentication Error',
  description: 'An error occurred during authentication. Please try again.',
})

interface AuthErrorPageProps {
  searchParams: Promise<{
    error?: string
  }>
}

const errorMessages: Record<string, { title: string; description: string }> = {
  default: {
    title: 'Authentication Failed',
    description: 'An error occurred while processing your request. Please try again.',
  },
  Callback: {
    title: 'Callback Error',
    description: 'There was an issue processing the authentication callback. Please try signing in again.',
  },
  OAuthSignin: {
    title: 'OAuth Sign-in Error',
    description: 'There was an issue connecting to the OAuth provider. Please try again.',
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description: 'There was an issue with the OAuth provider\'s response. Please try again.',
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    description: 'Could not create an account with the OAuth provider. Please try again.',
  },
  EmailCreateAccount: {
    title: 'Account Creation Error',
    description: 'Could not create an account with your email. Please try again.',
  },
  Signin: {
    title: 'Sign-in Error',
    description: 'There was an issue signing you in. Please check your credentials and try again.',
  },
  CredentialsSignin: {
    title: 'Invalid Credentials',
    description: 'The email or password you entered is incorrect. Please try again.',
  },
  SessionCallback: {
    title: 'Session Error',
    description: 'There was an issue creating your session. Please sign in again.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to access this resource.',
  },
  Verification: {
    title: 'Verification Failed',
    description: 'The verification link is invalid or has expired. Please try signing in again.',
  },
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams
  const error = params.error || 'default'
  const errorInfo = errorMessages[error] || errorMessages.default

  return (
    <main className="relative min-h-[calc(100vh-57px)] overflow-hidden">
      <DynamicBackground />

      <div className="relative z-10 flex min-h-[calc(100vh-57px)] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
              <div className="relative flex items-center justify-center space-x-3 px-6 py-4">
                <Icons.logo className="h-8 w-8 text-primary" />
                <span className="emberly-text text-2xl text-primary">
                  Emberly
                </span>
              </div>
            </div>
          </div>

          {/* Error Card */}
          <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
            <div className="relative p-8">
              <div className="space-y-6 text-center">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="rounded-full bg-destructive/10 p-3">
                    <Icons.alertCircle className="h-8 w-8 text-destructive" />
                  </div>
                </div>

                {/* Error Message */}
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {errorInfo.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {errorInfo.description}
                  </p>
                </div>

                {/* Error Code */}
                {error !== 'default' && (
                  <div className="text-xs text-muted-foreground bg-background/50 rounded-md p-2 font-mono">
                    Error: {error}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-4">
                  <Button asChild className="w-full h-11">
                    <Link href="/auth/login">
                      Try Signing In Again
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    asChild
                  >
                    <Link href="/">
                      Return to Home
                    </Link>
                  </Button>
                </div>

                {/* Help Text */}
                <p className="text-xs text-muted-foreground pt-4">
                  If you continue to experience issues, please{' '}
                  <Link href="/contact" className="text-primary hover:underline">
                    contact support
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
