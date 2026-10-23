import type { ReactNode } from 'react';

interface AuthGuardProps {
    children: ReactNode;
    fallbackMessage?: string;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    return <>{children}</>;
}
