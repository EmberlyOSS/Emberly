import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from './hashing';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    throw new Error('Email and password are required.');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.hashedPassword) {
                    throw new Error('No account found for this email.');
                }

                if (!user.emailVerified) {
                    throw new Error('Please verify your email before logging in.');
                }

                const valid = await verifyPassword(credentials.password, user.hashedPassword);
                if (!valid) {
                    throw new Error('Incorrect password. Please try again.');
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    emailVerified: user.emailVerified,
                    role: user.role,
                    createdAt: user.createdAt?.toISOString() ?? null,
                };
            },
        }),
    ],
    session: { strategy: 'jwt' },
    debug: process.env.NODE_ENV !== 'production',
    callbacks: {
        async jwt({ token, user, trigger }) {
            if (user) {
                token.role = user.role;
                token.createdAt = (user as any).createdAt ?? null;
                token.image = (user as any).image ?? null;
            }
            // Always hydrate image from DB if missing (covers existing sessions pre-this-change)
            // and on forced update() calls from the client
            if (trigger === 'update' || token.image === undefined) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { image: true, role: true, name: true },
                });
                if (dbUser) {
                    token.image = dbUser.image ?? null;
                    token.role = dbUser.role as any;
                    token.name = dbUser.name;
                }
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                id: token?.sub ?? '',
                name: token?.name ?? session.user?.name ?? null,
                email: token?.email ?? session.user?.email ?? null,
                image: (token?.image as string | null) ?? session.user?.image ?? null,
                role: (token as any)?.role || 'BASE_USER',
                createdAt: (token as any)?.createdAt ?? null,
            };
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
        newUser: '/auth/signup',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
