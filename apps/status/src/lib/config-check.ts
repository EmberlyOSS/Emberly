import { prisma } from './prisma';

export interface ConfigStatus {
    database: {
        connected: boolean;
        error?: string;
    };
    auth: {
        enabled: boolean;
        hasSecret: boolean;
        hasNextAuthUrl: boolean;
        error?: string;
    };
    email: {
        configured: boolean;
        hasSmtpConfig: boolean;
    };
    overall: {
        healthy: boolean;
        authEnabled: boolean;
        errors: string[];
        warnings: string[];
    };
}

let cachedStatus: ConfigStatus | null = null;
let lastCheck: number = 0;
const CACHE_DURATION = 60000;

async function checkDatabase(): Promise<{ connected: boolean; error?: string }> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return { connected: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
        console.error('[Config Check] Database connection failed:', errorMessage);
        return {
            connected: false,
            error: errorMessage,
        };
    }
}

function checkAuthConfig(): { enabled: boolean; hasSecret: boolean; hasNextAuthUrl: boolean; error?: string } {
    const hasSecret = !!process.env.NEXTAUTH_SECRET;
    const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
    const hasDatabaseUrl = !!process.env.DATABASE_URL;

    const errors: string[] = [];

    if (!hasSecret) {
        errors.push('NEXTAUTH_SECRET is missing');
    }
    if (!hasNextAuthUrl) {
        errors.push('NEXTAUTH_URL is not configured');
    }
    if (!hasDatabaseUrl) {
        errors.push('DATABASE_URL is not configured');
    }

    const enabled = hasSecret && hasNextAuthUrl && hasDatabaseUrl;

    return {
        enabled,
        hasSecret,
        hasNextAuthUrl,
        error: errors.length > 0 ? errors.join('; ') : undefined,
    };
}

function checkEmailConfig(): { configured: boolean; hasSmtpConfig: boolean } {
    const hasHost = !!process.env.SMTP_HOST;
    const hasUser = !!process.env.SMTP_USER;
    const hasPass = !!process.env.SMTP_PASS;

    return {
        configured: hasHost && hasUser && hasPass,
        hasSmtpConfig: hasHost && hasUser && hasPass,
    };
}

export async function getConfigStatus(forceRefresh = false): Promise<ConfigStatus> {
    const now = Date.now();

    if (!forceRefresh && cachedStatus && now - lastCheck < CACHE_DURATION) {
        return cachedStatus;
    }

    // Perform all checks
    const database = await checkDatabase();
    const auth = checkAuthConfig();
    const email = checkEmailConfig();

    // Compile overall status
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!database.connected) {
        errors.push(`Database: ${database.error || 'Connection failed'}`);
    }

    if (!auth.enabled) {
        if (auth.error) {
            errors.push(`Auth: ${auth.error}`);
        }
    }

    if (!email.configured) {
        warnings.push(
            'SMTP email (SMTP_HOST, SMTP_USER, SMTP_PASS) not configured. Password reset and verification emails will not work.'
        );
    }

    const authEnabled = database.connected && auth.enabled;

    const status: ConfigStatus = {
        database,
        auth,
        email,
        overall: {
            healthy: database.connected && errors.length === 0,
            authEnabled,
            errors,
            warnings,
        },
    };

    // Update cache
    cachedStatus = status;
    lastCheck = now;

    return status;
}

export function isAuthEnabled(): boolean {
    if (cachedStatus) {
        return cachedStatus.overall.authEnabled;
    }
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasSecret = !!process.env.NEXTAUTH_SECRET;
    const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;

    return hasDatabaseUrl && hasSecret && hasNextAuthUrl;
}

export function clearConfigCache(): void {
    cachedStatus = null;
    lastCheck = 0;
}

export function logConfigStatus(status: ConfigStatus): void {
    const db = status.database.connected ? '✓' : '✗';
    const auth = status.overall.authEnabled ? '✓' : '✗';
    const email = status.email.configured ? '✓' : '○';

    // Single line status summary
    console.log(`\n⚡ Emberly Status | DB: ${db} | Auth: ${auth} | Email: ${email}`);

    if (!status.overall.healthy) {
        const issues: string[] = [];

        if (!status.database.connected) {
            issues.push('Database unreachable');
        }
        if (!status.auth.hasSecret) {
            issues.push('NEXTAUTH_SECRET missing');
        }
        if (!status.auth.hasNextAuthUrl) {
            issues.push('NEXTAUTH_URL missing');
        }

        if (issues.length > 0) {
            console.log(`   ⚠ ${issues.join(' | ')}`);
        }
    }
}
