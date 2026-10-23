'use client';

import type { ReactNode } from 'react';
import AuthGuard from '@/components/layouts/auth/AuthGuard';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return <AuthGuard>{children}</AuthGuard>;
}
