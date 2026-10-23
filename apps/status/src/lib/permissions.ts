export type UserRole = 'BASE_USER' | 'ADMINISTRATOR' | 'SUPER_ADMIN';

export interface PermissionCheck {
    canEditUserRoles: boolean;
    canDeleteUsers: boolean;
    canManageReviews: boolean;
    canSendEmails: boolean;
    canManageBlog: boolean;
    canManagePositions: boolean;
    canViewAnalytics: boolean;
    canManageNewsletter: boolean;
    canAccessAdmin: boolean;
}

export function getPermissions(role?: string): PermissionCheck {
    const userRole = role as UserRole;

    if (userRole === 'SUPER_ADMIN') {
        return {
            canEditUserRoles: true,
            canDeleteUsers: true,
            canManageReviews: true,
            canSendEmails: true,
            canManageBlog: true,
            canManagePositions: true,
            canViewAnalytics: true,
            canManageNewsletter: true,
            canAccessAdmin: true,
        };
    }

    if (userRole === 'ADMINISTRATOR') {
        return {
            canEditUserRoles: false,
            canDeleteUsers: false,
            canManageReviews: true,
            canSendEmails: true,
            canManageBlog: true,
            canManagePositions: true,
            canViewAnalytics: true,
            canManageNewsletter: true,
            canAccessAdmin: true,
        };
    }

    return {
        canEditUserRoles: false,
        canDeleteUsers: false,
        canManageReviews: false,
        canSendEmails: false,
        canManageBlog: false,
        canManagePositions: false,
        canViewAnalytics: false,
        canManageNewsletter: false,
        canAccessAdmin: false,
    };
}

export function hasPermission(role: string | undefined, permission: keyof PermissionCheck): boolean {
    const permissions = getPermissions(role);
    return permissions[permission];
}

export function isAdmin(role?: string): boolean {
    return role === 'SUPER_ADMIN' || role === 'ADMINISTRATOR';
}

export function isSuperAdmin(role?: string): boolean {
    return role === 'SUPER_ADMIN';
}
