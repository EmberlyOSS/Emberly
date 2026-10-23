/**
 * Global Permissions System
 * 
 * Provides centralized, maintainable permission checks for roles.
 * Supports role hierarchy: SUPERADMIN > ADMIN > USER
 * Easily extendable with new permissions and features.
 */

/**
 * User role enum (matches Prisma schema)
 * Kept locally to avoid importing Prisma client in client components
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN',
}

/**
 * Nexium Squad role enum (matches Prisma schema)
 * Represents a user's role within a squad
 */
export enum NexiumSquadRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
  OBSERVER = 'OBSERVER',
}

/**
 * Define what each permission key means
 * Add new permissions here as features grow
 */
export enum Permission {
  // Admin panel access
  ACCESS_ADMIN_PANEL = 'access_admin_panel',

  // User management
  VIEW_USERS = 'view_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  CHANGE_USER_ROLE = 'change_user_role',

  // Settings — split into view (admin) and manage (superadmin only)
  /** Read-only view of settings without secrets — ADMIN and SUPERADMIN */
  VIEW_SETTINGS = 'view_settings',
  /** Save / modify settings — SUPERADMIN only */
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_APPEARANCE = 'manage_appearance',
  MANAGE_SECURITY = 'manage_security',

  // Integrations — admins can view & test; only superadmin can save secrets
  /** View integration configs (secrets masked) — ADMIN and SUPERADMIN */
  VIEW_INTEGRATIONS = 'view_integrations',
  /** Save integration credentials with secrets — SUPERADMIN only */
  MANAGE_INTEGRATIONS = 'manage_integrations',
  /** See raw API keys and secret values in the UI — SUPERADMIN only */
  VIEW_SECRET_KEYS = 'view_secret_keys',

  // Storage bucket management — SUPERADMIN only
  MANAGE_STORAGE_BUCKETS = 'manage_storage_buckets',

  // Billing
  /** View billing / subscription info — ADMIN and SUPERADMIN */
  VIEW_BILLING = 'view_billing',
  /** Modify billing settings, plans, etc. — SUPERADMIN only */
  MANAGE_BILLING = 'manage_billing',

  // Content moderation
  MODERATE_CONTENT = 'moderate_content',
  VIEW_AUDIT_LOGS = 'view_audit_logs',

  // Grants (role badges awarded via applications)
  /** View user grant badges — ADMIN and SUPERADMIN */
  VIEW_GRANTS = 'view_grants',
  /** Award or revoke grant badges — SUPERADMIN only */
  MANAGE_GRANTS = 'manage_grants',

  // System administration
  MANAGE_SYSTEM = 'manage_system',
  MANAGE_ROLES = 'manage_roles',
  PERFORM_SUPERADMIN_ACTIONS = 'perform_superadmin_actions',
}

/**
 * Squad-specific permissions
 * Defines what actions squad members can perform within a squad
 */
export enum SquadPermission {
  // Visibility & access
  VIEW_SQUAD = 'view_squad',
  
  // Uploads
  UPLOAD_FILES = 'upload_files',
  MANAGE_FILES = 'manage_files', // Delete, modify visibility, set expiry, etc.
  
  // Member management
  INVITE_MEMBERS = 'invite_members',
  MANAGE_MEMBERS = 'manage_members', // Change roles, remove members
  VIEW_MEMBERS = 'view_members',
  
  // Squad settings
  EDIT_SQUAD_INFO = 'edit_squad_info', // Name, description, public/private, etc.
  MANAGE_SQUAD_SETTINGS = 'manage_squad_settings', // Billing, integrations, etc.
  
  // Squad deletion & dissolution
  DELETE_SQUAD = 'delete_squad',
  
  // Opportunities & applications (Nexium)
  CREATE_OPPORTUNITY = 'create_opportunity',
  MANAGE_OPPORTUNITIES = 'manage_opportunities',
  VIEW_APPLICATIONS = 'view_applications',
}

/**
 * Role permission mapping
 * Defines which permissions each role has
 * Higher roles inherit lower role permissions + their own
 */
const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
  [UserRole.USER]: new Set([
    // Users have no special permissions
  ]),
  [UserRole.ADMIN]: new Set([
    // Admin can access the admin panel and see (not modify) settings
    Permission.ACCESS_ADMIN_PANEL,
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    // Settings: view only — cannot save
    Permission.VIEW_SETTINGS,
    Permission.VIEW_INTEGRATIONS,
    Permission.VIEW_BILLING,
    // Appearance: admins can manage look-and-feel
    Permission.MANAGE_APPEARANCE,
    // Content & audit
    Permission.MODERATE_CONTENT,
    Permission.VIEW_AUDIT_LOGS,
    // Grants: admins can see but not modify
    Permission.VIEW_GRANTS,
  ]),
  [UserRole.SUPERADMIN]: new Set([
    // Superadmin has all permissions
    Permission.ACCESS_ADMIN_PANEL,
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    Permission.CHANGE_USER_ROLE,
    // Settings: full management
    Permission.VIEW_SETTINGS,
    Permission.MANAGE_SETTINGS,
    Permission.MANAGE_APPEARANCE,
    Permission.MANAGE_SECURITY,
    // Integrations: full management + can see secrets
    Permission.VIEW_INTEGRATIONS,
    Permission.MANAGE_INTEGRATIONS,
    Permission.VIEW_SECRET_KEYS,
    // Storage buckets
    Permission.MANAGE_STORAGE_BUCKETS,
    // Billing
    Permission.VIEW_BILLING,
    Permission.MANAGE_BILLING,
    // Content & audit
    Permission.MODERATE_CONTENT,
    Permission.VIEW_AUDIT_LOGS,
    // Grants
    Permission.VIEW_GRANTS,
    Permission.MANAGE_GRANTS,
    // System
    Permission.MANAGE_SYSTEM,
    Permission.MANAGE_ROLES,
    Permission.PERFORM_SUPERADMIN_ACTIONS,
  ]),
}

/**
 * Role hierarchy levels for comparisons
 * Higher number = more powerful role
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 0,
  [UserRole.ADMIN]: 10,
  [UserRole.SUPERADMIN]: 100,
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole]
  return permissions.has(permission)
}

/**
 * Check if a user has any of the given permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Check if a user has all of the given permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Check if one role is equal to or higher than another
 * Useful for comparisons without needing specific permissions
 */
export function isRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if a user can perform an action on another user
 * (e.g., edit, delete, change role)
 * 
 * Rules:
 * - Users cannot modify other users
 * - Admins cannot modify superadmins
 * - Superadmins can modify anyone (except preventing self-demotion edge cases)
 * - Admins can view all users
 */
export function canModifyUser(actorRole: UserRole, targetRole: UserRole, action: 'view' | 'edit' | 'delete' | 'change_role'): boolean {
  switch (action) {
    case 'view':
      // Admins and superadmins can view any user
      return isRoleAtLeast(actorRole, UserRole.ADMIN)
    
    case 'edit':
      // Can only edit users at equal or lower role level
      return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole]
    
    case 'delete':
      // Can only delete users at equal or lower role level
      return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole]
    
    case 'change_role':
      // Can only change role of users at lower level
      return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole]
    
    default:
      return false
  }
}

/**
 * Get all permissions for a role (for UI/permission displays)
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return Array.from(ROLE_PERMISSIONS[role])
}

/**
 * Check if a role is privileged (not a regular user)
 */
export function isPrivilegedRole(role: UserRole): boolean {
  return role !== UserRole.USER
}

/**
 * Get human-readable role name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    [UserRole.USER]: 'User',
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.SUPERADMIN]: 'Super Administrator',
  }
  return names[role]
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    [UserRole.USER]: 'Regular user with basic features',
    [UserRole.ADMIN]: 'Administrator with access to admin panel and user management',
    [UserRole.SUPERADMIN]: 'Super administrator with full system access',
  }
  return descriptions[role]
}

/**
 * ============================================================================
 * NEXIUM SQUAD PERMISSIONS
 * ============================================================================
 * 
 * Squad-specific permission system for Nexium squad collaboration
 * Separate from user-level permissions
 */

/**
 * Squad role permission mapping
 * Defines which squad permissions each squad role has
 * Hierarchy: OWNER > MEMBER > OBSERVER
 */
const SQUAD_ROLE_PERMISSIONS: Record<NexiumSquadRole, Set<SquadPermission>> = {
  [NexiumSquadRole.OWNER]: new Set([
    // Owners can do everything in the squad
    SquadPermission.VIEW_SQUAD,
    SquadPermission.UPLOAD_FILES,
    SquadPermission.MANAGE_FILES,
    SquadPermission.INVITE_MEMBERS,
    SquadPermission.MANAGE_MEMBERS,
    SquadPermission.VIEW_MEMBERS,
    SquadPermission.EDIT_SQUAD_INFO,
    SquadPermission.MANAGE_SQUAD_SETTINGS,
    SquadPermission.DELETE_SQUAD,
    SquadPermission.CREATE_OPPORTUNITY,
    SquadPermission.MANAGE_OPPORTUNITIES,
    SquadPermission.VIEW_APPLICATIONS,
  ]),
  [NexiumSquadRole.MEMBER]: new Set([
    // Members can upload and view but not manage squad-level things
    SquadPermission.VIEW_SQUAD,
    SquadPermission.UPLOAD_FILES,
    SquadPermission.MANAGE_FILES, // Can manage own files
    SquadPermission.VIEW_MEMBERS,
    SquadPermission.CREATE_OPPORTUNITY,
    SquadPermission.VIEW_APPLICATIONS,
  ]),
  [NexiumSquadRole.OBSERVER]: new Set([
    // Observers have read-only access
    SquadPermission.VIEW_SQUAD,
    SquadPermission.VIEW_MEMBERS,
    SquadPermission.VIEW_APPLICATIONS,
  ]),
}

/**
 * Squad role hierarchy levels for comparisons
 * Higher number = more powerful role
 */
const SQUAD_ROLE_HIERARCHY: Record<NexiumSquadRole, number> = {
  [NexiumSquadRole.OWNER]: 100,
  [NexiumSquadRole.MEMBER]: 10,
  [NexiumSquadRole.OBSERVER]: 0,
}

/**
 * Check if a squad member has a specific permission
 */
export function hasSquadPermission(
  squadRole: NexiumSquadRole,
  permission: SquadPermission
): boolean {
  const permissions = SQUAD_ROLE_PERMISSIONS[squadRole]
  return permissions.has(permission)
}

/**
 * Check if a squad member has any of the given permissions
 */
export function hasAnySquadPermission(
  squadRole: NexiumSquadRole,
  permissions: SquadPermission[]
): boolean {
  return permissions.some(permission => hasSquadPermission(squadRole, permission))
}

/**
 * Check if a squad member has all of the given permissions
 */
export function hasAllSquadPermissions(
  squadRole: NexiumSquadRole,
  permissions: SquadPermission[]
): boolean {
  return permissions.every(permission => hasSquadPermission(squadRole, permission))
}

/**
 * Check if one squad role is equal to or higher than another
 * Useful for role comparisons without needing specific permissions
 */
export function isSquadRoleAtLeast(
  squadRole: NexiumSquadRole,
  requiredRole: NexiumSquadRole
): boolean {
  return SQUAD_ROLE_HIERARCHY[squadRole] >= SQUAD_ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if a squad member can perform an action on another squad member
 * Rules:
 * - Observers cannot modify anyone
 * - Members cannot modify other members or owners
 * - Owners can modify anyone (except preventing self-removal edge cases)
 */
export function canModifySquadMember(
  actorRole: NexiumSquadRole,
  targetRole: NexiumSquadRole,
  action: 'view' | 'edit' | 'remove' | 'change_role'
): boolean {
  switch (action) {
    case 'view':
      // All roles can view members in their squad
      return hasSquadPermission(actorRole, SquadPermission.VIEW_MEMBERS)

    case 'edit':
      // Can only modify members at equal or lower role level
      return SQUAD_ROLE_HIERARCHY[actorRole] > SQUAD_ROLE_HIERARCHY[targetRole]

    case 'remove':
      // Can only remove members at equal or lower role level
      return SQUAD_ROLE_HIERARCHY[actorRole] > SQUAD_ROLE_HIERARCHY[targetRole]

    case 'change_role':
      // Only owner can change member roles
      return actorRole === NexiumSquadRole.OWNER && targetRole !== NexiumSquadRole.OWNER

    default:
      return false
  }
}

/**
 * Check if user is squad owner
 * Common check - shorthand for isSquadRoleAtLeast(role, OWNER)
 */
export function isSquadOwner(squadRole: NexiumSquadRole): boolean {
  return squadRole === NexiumSquadRole.OWNER
}

/**
 * Get all squad permissions for a role (for UI/permission displays)
 */
export function getSquadRolePermissions(role: NexiumSquadRole): SquadPermission[] {
  return Array.from(SQUAD_ROLE_PERMISSIONS[role])
}

/**
 * Get human-readable squad role name
 */
export function getSquadRoleDisplayName(role: NexiumSquadRole): string {
  const names: Record<NexiumSquadRole, string> = {
    [NexiumSquadRole.OWNER]: 'Owner',
    [NexiumSquadRole.MEMBER]: 'Member',
    [NexiumSquadRole.OBSERVER]: 'Observer',
  }
  return names[role]
}

/**
 * Get squad role description
 */
export function getSquadRoleDescription(role: NexiumSquadRole): string {
  const descriptions: Record<NexiumSquadRole, string> = {
    [NexiumSquadRole.OWNER]: 'Squad owner with full control over settings, members, and files',
    [NexiumSquadRole.MEMBER]: 'Squad member who can upload files and create opportunities',
    [NexiumSquadRole.OBSERVER]: 'Observer with read-only access to squad content',
  }
  return descriptions[role]
}

