# HaveIBeenPwned Integration

## Overview

Emberly integrates the **HaveIBeenPwned (HIBP)** password breach database to warn users when they're signing in with a compromised password. This is a free, privacy-friendly security feature.

## How It Works

### Privacy-First Approach

The integration uses **k-anonymity** to protect user privacy:

1. Password is **never sent** to HIBP servers
2. Only the **first 5 characters of the SHA-1 hash** are sent
3. HIBP returns all hashes matching that prefix
4. Client-side check determines if full hash is in the list
5. Password remains completely local

### Login Flow

```
User enters password and clicks "Sign in"
↓
Password is checked against HIBP (non-blocking)
↓
Sign in request proceeds simultaneously
↓
If password found in breach:
  ├─ User is logged in successfully
  ├─ Warning shown on screen
  ├─ Options: "Change Password" or "Continue Anyway"
  └─ NOT an Emberly security issue
↓
User can continue or change password
```

## Implementation Details

### Files

1. **`packages/lib/security/password-breach-checker.ts`**
   - Core HIBP API integration
   - Handles hash calculation and API calls
   - Non-blocking check (doesn't delay login)

2. **`packages/components/auth/password-breach-warning.tsx`**
   - Warning UI component
   - Shows occurrence count
   - Clear explanation that it's not an Emberly breach
   - Options to change password or continue

3. **`packages/components/auth/login-form.tsx`**
   - Integrated into password login form
   - Asynchronous breach check
   - Shows warning if password is compromised

### Key Features

- ✅ **Privacy-First:** Only sends hash prefix, never the password or full hash
- ✅ **Non-Blocking:** Login works simultaneously, doesn't wait for HIBP response
- ✅ **Free API:** No authentication required
- ✅ **User-Friendly:** Clear explanation about data breaches
- ✅ **Non-Intrusive:** Users can continue logging in even if password is compromised
- ✅ **Graceful Degradation:** If HIBP is down, login still works

## User Experience

### Scenario 1: Safe Password

```
User enters password: "MySecurePassword123"
↓
HIBP check: Not found in any breach
↓
Login successful → Dashboard
(No warning shown)
```

### Scenario 2: Compromised Password

```
User enters password: "Password123" (found in 5+ breaches)
↓
HIBP check: Found in 5 data breaches
↓
Login successful → Dashboard
↓
Warning shown:
┌─────────────────────────────────────┐
│ ⚠ Password Found in Data Breach     │
│ This password appears in 5 breaches │
│ NOT an Emberly issue - another site │
│ was compromised.                    │
│                                     │
│ [Change Password] [Continue Anyway] │
└─────────────────────────────────────┘
```

### User Actions

**Change Password:**
- Redirects to password reset page
- User can create new strong password
- More secure option

**Continue Anyway:**
- Dismisses warning
- Proceeds to dashboard
- Warning won't show again this session
- Recommended: User should change password ASAP

## Data Breach Detection

The system checks against HIBP's database which includes:

- **Over 613 million compromised accounts**
- **Breaches from 2007 onwards**
- **Major incidents:** LinkedIn, Adobe, MySpace, Yahoo, etc.
- **Continuously updated** with new breaches

## Technical Details

### API Endpoint

```
GET https://api.pwnedpasswords.com/range/{hash_prefix}
```

Rate limit: Not enforced by HIBP (public service)

### Response Format

```
SUFFIX:COUNT
00001E4C9B94F3855EC9...
00D4F6E4A462F6E8D5C7...:2
```

Example: If password hash is `ABC123DEF456GHI789JKL`, prefix is `ABC12`:
- Send request to `/range/ABC12`
- Check if `3DEF456GHI789JKL` is in response
- If yes, password is compromised

### Error Handling

- **HIBP Down (503):** Silently skip check, allow login
- **Network Error:** Log error, allow login (non-blocking)
- **Invalid Password:** Still works, just won't check HIBP

## Configuration

No configuration needed! The feature works out of the box.

Optional: See `packages/lib/security/password-breach-checker.ts` to adjust behavior.

## Testing

### Test with Known Compromised Password

Most common compromised password: `123456`

```
1. Go to login page
2. Email/Username: test@example.com
3. Password: 123456
4. Click "Sign in"
5. Should see breach warning after login
```

### Check Password Status

Visit [HaveIBeenPwned.com](https://haveibeenpwned.com) to check any password.

## Privacy & Security

### What Emberly Does NOT Do

- ❌ Store passwords
- ❌ Send passwords to third parties
- ❌ Log breach status
- ❌ Track breach checks
- ❌ Use breach data for any other purpose

### What HIBP Does

- ✅ Provides public API
- ✅ Receives hash prefix (5 characters)
- ✅ Returns matching hashes (no user context)
- ✅ No logging of requests (anonymous)
- ✅ No tracking of who checks what

## Performance Impact

- **Check Time:** 100-500ms (non-blocking)
- **User Impact:** None (simultaneous with login)
- **Timeout:** 5 seconds (auto-fails gracefully)

## Future Enhancements

- [ ] Show when last breach occurred
- [ ] Provide password strength check
- [ ] Integration with password manager recommendations
- [ ] Admin dashboard for breach statistics
- [ ] Email notifications for compromised accounts

## References

- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [K-Anonymity Approach](https://blog.cloudflare.com/validating-leaked-passwords-with-k-anonymity/)
- [Ethical hacking by Troy Hunt](https://www.troyhunt.com/)
