# Password Reuse Prevention Implementation

## Overview

This document describes the password reuse prevention system implemented to prevent users from reusing old passwords when changing their password.

## Features

- **Encrypted Password Storage**: Previous passwords are stored as encrypted bcryptjs hashes (same algorithm as current password)
- **Reuse Prevention**: Users cannot reuse any of their last 5 passwords
- **Automatic Cleanup**: System automatically keeps only the last 12 passwords per user
- **Automatic Initialization**: On login, existing users' passwords are automatically added to history (backward compatibility)
- **Security**: All previous password hashes are encrypted and stored securely
- **Integration Points**: 
  - Password reset endpoint (`/api/auth/password/reset`)
  - Profile update endpoint (`/api/profile`)
  - Login callback (automatic initialization)

## Database Schema

### PasswordHistory Model

```prisma
model PasswordHistory {
  id        String   @id @default(cuid())
  userId    String
  password  String   // Encrypted bcryptjs hash
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, createdAt])
}
```

**User Model Addition:**
```prisma
passwordHistory  PasswordHistory[]
```

## Core Functions

### `ensurePasswordInHistory(userId: string, currentPasswordHash: string)`

Ensures a user's current password is in their password history. Called automatically on login for backward compatibility.

**Parameters:**
- `userId`: The user's ID
- `currentPasswordHash`: The bcryptjs hash of the current password

**Returns:**
```typescript
Promise<boolean>  // true if password was added, false if already existed
```

**Use Case:** Automatically initializes password history for legacy users (created before password history system)

### `checkPasswordReuse(userId: string, newPassword: string)`

Checks if a password is being reused from the user's password history.

**Parameters:**
- `userId`: The user's ID
- `newPassword`: The new password to check

**Returns:**
```typescript
{
  isReused: boolean
  reusedCount?: number  // Number of times this password appears in history
}
```

**Logic:**
1. Retrieves the last 5 password hashes from PasswordHistory for the user
2. Compares the new password against each stored hash using bcryptjs
3. Returns true if ANY hash matches the new password

### `recordPasswordHistory(userId: string, currentPasswordHash: string)`

Records the current password to the user's password history.

**Parameters:**
- `userId`: The user's ID
- `currentPasswordHash`: The bcryptjs hash of the current password (NOT plaintext)

**Side Effects:**
1. Inserts a new PasswordHistory record
2. Auto-cleanup: Deletes old password history entries, keeping only the last 12

**Note:** This function must be called BEFORE the password is updated in the User table.

## Integration Points

### 1. Login Callback (`packages/lib/auth/index.ts`)

**Purpose:** Automatically initialize password history for existing users on their next login

**Flow:**
```typescript
// On successful password authentication
if (credentials?.password) {
  // 1. Get user's current password hash from database
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  
  // 2. Ensure password is in history (adds if first time, skips if already exists)
  const wasAdded = await ensurePasswordInHistory(user.id, dbUser.password)
  
  // 3. Log if password was newly added
  if (wasAdded) console.log(`Password history initialized for user ${user.id}`)
}
```

**Benefits:**
- Non-blocking: Runs in background, doesn't delay login
- Automatic: No user action required
- Gradual rollout: Users are initialized on their next login
- Safe: Idempotent function (safe to call multiple times)

### 2. Password Reset Endpoint (`/api/auth/password/reset/route.ts`)

**Flow:**
```typescript
// 1. Validate token and credentials
if (!isValidToken) return error

// 2. Check if password is unchanged
if (await compare(password, user.password)) return error

// 3. Check if password is being reused
const reuseCheck = await checkPasswordReuse(user.id, password)
if (reuseCheck.isReused) return error

// 4. Record current password to history
if (user.password) await recordPasswordHistory(user.id, user.password)

// 5. Update password
const newPassword = await hash(password, 10)
await user.update({ password: newPassword })
```

### 3. Profile Update Endpoint (`/api/profile/route.ts`)

**Flow:**
```typescript
// 1. Validate current password
if (!await compare(currentPassword, user.password)) return error

// 2. Check if new password is being reused
const reuseCheck = await checkPasswordReuse(user.id, newPassword)
if (reuseCheck.isReused) return error

// 3. Record current password to history
if (user.password) await recordPasswordHistory(user.id, user.password)

// 4. Update password
updateData.password = await hash(newPassword, 10)
await user.update(updateData)

// 5. Invalidate sessions
await sessionCache.invalidateUserSession(user.id)
```

## Backward Compatibility

### Problem

Users who created their accounts before the password history system was implemented don't have any password history. The reuse prevention system needs to work for these legacy accounts.

### Solution

When a legacy user logs in, the system automatically initializes their password history with their current password on login (non-blocking background task).

**Flow:**
1. User logs in with correct password ✓
2. Login succeeds immediately (no delay)
3. In background (fire-and-forget):
   - Check if user has any password history
   - If not, add their current password as the first history entry
4. On next password change, reuse prevention is fully functional

### Backfill Utilities

For administrators who want to proactively initialize all legacy users, two utilities are available:

#### `backfillPasswordHistory(limit?: number)`
Backfills password history for multiple users without it

```typescript
import { backfillPasswordHistory } from '@/packages/lib/security/backfill-password-history'

const result = await backfillPasswordHistory(100) // Process first 100 users
// Result includes: totalUsers, usersProcessed, passwordsAdded, errors
```

#### `backfillUserPasswordHistory(userId: string)`
Backfills password history for a single user

```typescript
import { backfillUserPasswordHistory } from '@/packages/lib/security/backfill-password-history'

const wasAdded = await backfillUserPasswordHistory(userId)
// Returns true if added, false if already existed
```

### Admin Endpoint

**Endpoint:** `POST /api/admin/password-history/backfill` (Admin only)

**Get statistics:**
```bash
GET /api/admin/password-history/backfill

Response:
{
  "message": "Password history coverage statistics",
  "data": {
    "totalUsers": 500,
    "usersWithPassword": 450,
    "usersWithHistory": 200,
    "usersWithoutHistory": 250,
    "coveragePercentage": 44
  }
}
```

**Backfill all users:**
```bash
POST /api/admin/password-history/backfill
{
  "action": "backfill-all",
  "limit": 100  // Process max 100 users per call
}

Response:
{
  "message": "Password history backfill completed",
  "data": {
    "totalUsers": 100,
    "usersProcessed": 100,
    "passwordsAdded": 85,
    "errors": [...]
  }
}
```

**Backfill specific user:**
```bash
POST /api/admin/password-history/backfill
{
  "action": "backfill-user",
  "userId": "user_id_here"
}

Response:
{
  "message": "Password added to history",
  "data": {
    "userId": "user_id_here",
    "wasAdded": true
  }
}
```

## Security Considerations

### What is Stored
- **Encrypted bcryptjs hashes** of previous passwords
- **Not plaintext passwords**
- **Same hashing algorithm** as current User.password field

### What is NOT Stored
- Plaintext passwords
- Unencrypted password strings
- Any personally identifiable information

### Hash Comparison
- Uses bcryptjs `compare()` function (same as password verification)
- Compares new password against stored hashes safely
- No plaintext comparison

### Privacy
- User cannot see their old password hashes
- Only the system can verify reuse
- Hashes are unique even for the same password (due to bcryptjs salting)
- Actually, bcryptjs comparison works by comparing new plaintext hash against old bcrypt hash, so a password can be identified as reused

## Testing

### Test Reuse Prevention

```bash
# 1. Create account with password "SecurePassword123"
# 2. Reset password to "NewPassword456"
# 3. Try to reset password back to "SecurePassword123"
# Expected: Error "Cannot reuse a recent password"

# Test record limit
# 1. Change password 13 times
# 2. Check PasswordHistory table
# Expected: Only 12 most recent passwords stored
```

### Test Integration

```bash
# Password Reset Endpoint
POST /api/auth/password/reset
{
  "email": "user@example.com",
  "token": "reset_token",
  "password": "OldPassword123"  // If this was used before
}
# Expected: 400 error - Cannot reuse a recent password

# Profile Update Endpoint
PUT /api/profile
{
  "currentPassword": "NewPassword456",
  "newPassword": "OldPassword123"  // If this was used before
}
# Expected: 400 error - Cannot reuse a recent password
```

## Error Messages

**Reuse Detected:**
```
"Cannot reuse a recent password. Please use a different password."
```

**Status Code:** `400 Bad Request`

## Related Security Features

### Password Breach Detection
- HaveIBeenPwned integration on login/register
- Non-blocking warning if password found in breach database
- Implemented in: `/packages/lib/security/password-breach-checker.ts`

### Password Validation
- Minimum length: 8 characters
- Maximum length: 128 characters
- Checks for: Breach status, Reuse status, Strength indicator
- Implemented in: `/packages/lib/security/password-validation.ts`

## Configuration

### Reuse Limit
**Currently set to:** Last 5 passwords cannot be reused

**To change:** Modify `checkPasswordReuse()` in `/packages/lib/security/password-reuse-checker.ts`

```typescript
const lastPasswords = await prisma.passwordHistory.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 5  // Change this number
})
```

### History Retention
**Currently set to:** Keep last 12 passwords per user

**To change:** Modify `recordPasswordHistory()` in `/packages/lib/security/password-reuse-checker.ts`

```typescript
const toDelete = await prisma.passwordHistory.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  skip: 12,  // Change this number
  select: { id: true }
})
```

## Monitoring

### Reuse Attempts
Currently not logged. To add monitoring:

1. Create a table to track reuse attempts:
```prisma
model PasswordReuseAttempt {
  id        String   @id @default(cuid())
  userId    String
  timestamp DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}
```

2. Log in `checkPasswordReuse()` when reuse is detected
3. Add admin dashboard to view patterns

## Future Enhancements

1. **Time-based reuse**: Allow reuse after X days (e.g., 1 year)
2. **Strength progression**: Require stronger passwords over time
3. **Breach notifications**: Email users if old password found in new breach
4. **Usage analytics**: Track password change patterns
5. **Admin controls**: Configurable reuse limits per user/role
