# Email System with User Preferences - Integration Guide

## Overview

The Emberly email system automatically respects user preferences. When emails are sent, they go through this flow:

```
Event Emitted → Event Handler → email.send Event → Preference Check → Send if Enabled
```

## How It Works

### Step 1: Event is Emitted (in feature code)

```typescript
// Example: When a perk is earned
await events.emit('user.perk-gained', {
  userId: user.id,
  email: user.email,
  perkName: 'Discord Booster',
  perkDescription: '...',
  perkIcon: '🎉',
  expiresAt: null,
})
```

### Step 2: Event Handler Routes to Email

The event handler (registered in `/handlers/user.ts`) receives the event and emits an email:

```typescript
events.on('user.perk-gained', 'send-notification', async (payload) => {
  // Handler receives the perk-gained event
  // and converts it to an email.send event
  
  await events.emit('email.send', {
    to: payload.email,
    template: 'perk-gained',
    subject: `🎉 You've unlocked: ${payload.perkName}`,
    variables: { /* ... */ },
    userId: payload.userId,
    sourceEvent: 'user.perk-gained',  // ⚠️ CRITICAL!
  })
})
```

### Step 3: Email Handler Checks Preferences

The email handler (in `/handlers/email.ts`) checks if the user wants this type of email:

```typescript
events.on('email.send', 'send-email', async (payload) => {
  // Check if user has enabled emails for this event type
  if (payload.sourceEvent && payload.userId) {
    const { shouldSend, reason } = await shouldSendEmail(
      payload.userId,
      payload.sourceEvent
    )
    
    if (!shouldSend) {
      logger.info('Email skipped due to preferences', { reason })
      return  // Don't send
    }
  }
  
  // Only if preference enabled, actually send the email
  await sendEmail(payload)
})
```

### Step 4: Preference Lookup

The `shouldSendEmail()` function looks up:

1. **Master toggle**: Is `emailNotificationsEnabled` true?
2. **Category preference**: Is the preference category enabled?

```typescript
// Lookup process:
// 1. 'user.perk-gained' → maps to 'productUpdates' category
// 2. User.emailPreferences.productUpdates → is it enabled?
// 3. If yes, send. If no, skip.

EVENT_TO_PREFERENCE_MAP = {
  'user.perk-gained': 'productUpdates',
  'user.quota-reached': 'account',
  'user.storage-assigned': 'productUpdates',
  // ... etc
}
```

## User Preference Structure

```typescript
// In Prisma User model:
{
  emailNotificationsEnabled: true,  // Master toggle
  emailPreferences: {
    security: true,         // Password changes, 2FA, auth alerts
    account: true,          // Profile updates, email verification
    billing: true,          // Subscriptions, payments
    marketing: false,       // Promotions, newsletters
    productUpdates: true,   // Feature announcements, perks
  }
}
```

## Complete Example: Sending a Perk Notification

### 1. Feature Code (where perk is earned)

```typescript
// In packages/lib/perks/discord.ts
if (isBooster && !alreadyEarned) {
  await addPerkRole(userId, PERK_ROLES.DISCORD_BOOSTER)
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  
  if (user?.email) {
    // Emit the event - preference checking happens automatically
    await events.emit('user.perk-gained', {
      userId,
      email: user.email,
      perkName: 'Discord Booster',
      perkDescription: 'Exclusive perks for boosting the Emberly Discord',
      perkIcon: '🎉',
      expiresAt: null,
    })
  }
}
```

### 2. Event Handler (converts to email)

```typescript
// In packages/lib/events/handlers/user.ts
events.on('user.perk-gained', 'send-notification', async (payload) => {
  await events.emit('email.send', {
    to: payload.email,
    template: 'perk-gained',
    subject: `🎉 You've unlocked: ${payload.perkName}`,
    variables: {
      perkName: payload.perkName,
      perkDescription: payload.perkDescription,
      perkIcon: payload.perkIcon,
      expiresAt: payload.expiresAt?.toISOString(),
    },
    userId: payload.userId,
    sourceEvent: 'user.perk-gained',  // ⚠️ This enables preference checking
  })
})
```

### 3. Email Handler (checks preferences and sends)

```typescript
// In packages/lib/events/handlers/email.ts
events.on('email.send', 'send-email', async (payload) => {
  // sourceEvent = 'user.perk-gained'
  // Maps to 'productUpdates' category
  const { shouldSend } = await shouldSendEmail(
    payload.userId,
    'user.perk-gained'
  )
  
  // User.emailPreferences.productUpdates determines if we send
  if (!shouldSend) return
  
  await sendEmail(payload)
})
```

### 4. Preference Mapping

```typescript
// In packages/lib/events/utils/email-preferences.ts
EVENT_TO_PREFERENCE_MAP = {
  'user.perk-gained': 'productUpdates',  // ⚠️ Must be here!
  // ... other mappings
}
```

## Key Points

### ✅ The system automatically:
- ✅ Checks user preferences before sending
- ✅ Respects master email toggle
- ✅ Logs skipped emails with reason
- ✅ Fails open (sends by default if unsure)
- ✅ Never sends if user has disabled category

### ⚠️ You must:
- ⚠️ Include `sourceEvent` in `email.send` event
- ⚠️ Map your event to a preference category in `EVENT_TO_PREFERENCE_MAP`
- ⚠️ Use existing preference categories or create new ones

### 🚫 Critical emails (never skipped):
- `auth.password-reset-requested` - Can't opt out of password recovery
- `account.email-verified` - Verification emails always send

## Testing Preferences

```typescript
// Disable productUpdates to test perk-gained skipping
await prisma.user.update({
  where: { id: userId },
  data: {
    emailPreferences: {
      productUpdates: false,
    },
  },
})

// Trigger perk-gained - should log "Email skipped due to user preferences"
// and not send the email
```

## New React-Email Templates

We're migrating to professional react-email templates:

- `WelcomeEmailNew` - Welcome for new users
- `QuotaReachedEmailNew` - Storage quota warning
- `PerkGainedEmailNew` - Perk celebration

These use Tailwind CSS via `@react-email/tailwind` for modern, responsive design.

## Adding New Email Types

1. **Define the event type** in your feature code
2. **Create/register event handler** that emits `email.send`
3. **Create email template** using react-email
4. **Map the event** in `EVENT_TO_PREFERENCE_MAP`
5. **Done** - preferences are automatically checked!

See `packages/lib/emails/README.md` for detailed template creation guide.
