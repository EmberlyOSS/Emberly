import NextAuth from 'next-auth/next'

import { authOptions } from '@/packages/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
