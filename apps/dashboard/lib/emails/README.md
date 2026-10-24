# Email System

Emberly uses a sophisticated, preference aware email system built on top of the event infrastructure.

> All emails are sent through [Resend](https://resend.com/) and respect user email notification preferences.

## Architecture

### Components

1. **Email Templates** (`/templates`) - React components using [react-email](https://react.email/) for professional, responsive email layouts
2. **Email Handler** (`/packages/lib/events/handlers/email.ts`) - Listens to `email.send` events and dispatches emails
3. **Preference System** (`/packages/lib/events/utils/email-preferences.ts`) - Manages user preferences and email categorization
4. **Email Service** (`index.ts`) - Core email sending functionality using Resend

### Email Preference Categories

Users can control which types of emails they receive through these categories:

- **security** - Password changes, 2FA changes, suspicious activity alerts
- **account** - Profile updates, email verification, account changes
- **billing** - Subscription updates, payment notifications, refunds
- **marketing** - Promotional content and announcements
- **productUpdates** - Feature announcements, perk notifications, product news

### User Preferences Structure

```typescript
// User.emailPreferences (JSON in Prisma)
{
  "security": true,
  "account": true,
  "billing": true,
  "marketing": false,
  "productUpdates": true
}

// User.emailNotificationsEnabled (boolean)
// Master toggle - if false, NO emails are sent
```

## How It Works

### 1. Event Emission

When a feature needs to send an email, it emits an event:

```typescript
// Example: Perk gained
await events.emit('user.perk-gained', {
  userId,
  email: user.email,
  perkName: 'Discord Booster',
  perkDescription: 'Exclusive perks for boosting',
  perkIcon: '🎉',
  expiresAt: null,
})
```

### 2. Event Handler Routes to Email

The user event handler (`/packages/lib/events/handlers/user.ts`) receives the event and emits an `email.send`:

```typescript
events.on('user.perk-gained', 'send-notification', async (payload) => {
  await events.emit('email.send', {
    to: payload.email,
    template: 'perk-gained',
    subject: `🎉 You've unlocked: ${payload.perkName}`,
    variables: {/* ... */},
    userId: payload.userId,
    sourceEvent: 'user.perk-gained', // ⚠️ CRITICAL for preference checking
  })
})
```

### 3. Preference Check and Email Send

The email handler checks user preferences before sending:

```typescript
// In email.handler.ts
const { shouldSend, reason } = await shouldSendEmail(
  payload.userId,
  payload.sourceEvent as EventType // Uses the sourceEvent for lookup
)

if (!shouldSend) {
  logger.info('Email skipped due to preferences', { reason })
  return
}

// Only if preference is enabled, send the email
await sendEmail({/* ... */})
```

## Email Templates

Every template is built from the shared components in `components/index.tsx`, so all emails share one layout: the instance's logo and name, a white card, and a footer explaining why the reader got the email with a link to their notification settings.

| Component                                              | Use it for                                                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `EmailLayout`                                          | The page wrapper. Takes `preview` (inbox preview text) and an optional `reason` for the footer |
| `EmailHeading`, `EmailText`                            | The title and paragraphs (`muted` and `small` for secondary text)                              |
| `EmailButton`, `EmailLinkFallback`                     | The main action, and a copyable link under it for sign-in and reset links                      |
| `EmailDetails`                                         | Label and value rows, such as device and location, or amount and invoice                       |
| `EmailCallout`                                         | A tinted box with an `info`, `success`, `warning` or `danger` tone                             |
| `EmailCode`, `EmailQuote`, `EmailList`, `EmailDivider` | One-time codes, quoted replies, bullet lists and separators                                    |

`useEmailBrand()` returns the instance's `name`, `siteUrl`, `logoUrl` and `manageUrl`. Use it for any link or product name, never a hard-coded `embrly.ca`, so self-hosted instances get their own branding. `formatEmailDate()` and `formatEmailMoney()` format dates (in UTC) and amounts in cents.

`sendEmail` supplies the brand and builds the plain-text version from the same template automatically.

## Adding a New Email Template

### 1. Create the Template

```tsx
// lib/emails/templates/my-template.tsx
import React from 'react'

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailText,
  useEmailBrand,
} from '../components'

interface MyTemplateProps {
  name: string
  actionUrl: string
}

export function MyTemplate({ name, actionUrl }: MyTemplateProps) {
  const brand = useEmailBrand()
  return (
    <EmailLayout
      preview={`Something happened on your ${brand.name} account`}
      reason="We email you when something happens on your account."
    >
      <EmailHeading>Hi {name}</EmailHeading>
      <EmailText>Here's what happened.</EmailText>
      <EmailButton href={actionUrl}>Take a look</EmailButton>
    </EmailLayout>
  )
}
```

### 2. Export from Index

```typescript
// lib/emails/index.ts
export { MyTemplate } from './templates/my-template'
```

### 3. Register Event Handler

```typescript
// packages/lib/events/handlers/user.ts (or appropriate handler file)
events.on('my.event', 'send-email', async (payload) => {
  await events.emit('email.send', {
    to: payload.email,
    template: 'my-template',
    subject: 'Your template subject',
    variables: {/* ... */},
    userId: payload.userId,
    sourceEvent: 'my.event', // ⚠️ REQUIRED for preference checking
  })
})
```

### 4. Map Event to Preference Category

```typescript
// packages/lib/events/utils/email-preferences.ts
const EVENT_TO_PREFERENCE_MAP = {
  'my.event': 'account', // or 'security', 'billing', etc.
  // ... rest of mappings
}
```

## Critical Preference Categories for Events

| Event Type                    | Category       | Skippable?       |
| ----------------------------- | -------------- | ---------------- |
| auth.password-reset-requested | security       | ❌ No - critical |
| auth.2fa-enabled              | security       | ✅ Yes           |
| user.perk-gained              | productUpdates | ✅ Yes           |
| user.quota-reached            | account        | ✅ Yes           |
| user.storage-assigned         | productUpdates | ✅ Yes           |
| billing.subscription-created  | billing        | ✅ Yes           |

## Always-Send Events

These emails are ALWAYS sent, regardless of user preferences (critical transactional emails):

- `auth.password-reset-requested` - Password recovery
- `account.email-verified` - Email verification

Add new critical emails to `ALWAYS_SEND_EVENTS` array in `email-preferences.ts`.

## Best Practices

### ✅ DO

- ✅ Always include `sourceEvent` when emitting `email.send`
- ✅ Use event types that already exist in `EVENT_TO_PREFERENCE_MAP`
- ✅ Include user ID and email in event payloads
- ✅ Use professional react-email templates for new emails
- ✅ Test email rendering in Resend dashboard
- ✅ Build templates from the shared components in `components/index.tsx`

### ❌ DON'T

- ❌ Forget to map events in `EVENT_TO_PREFERENCE_MAP`
- ❌ Send emails without checking preferences (sourceEvent is how it works)
- ❌ Include unsubscribe URLs (handled at the preference level)
- ❌ Hard-code `embrly.ca` or "Emberly" in a template (use `useEmailBrand()`)
- ❌ Send critical emails without user preference checks

## Testing Emails

### Local Development

1. Check Resend test mode in `.env`
2. Resend test API key will prevent real email sending
3. View sent emails in Resend dashboard

### Email Preference Testing

```typescript
// Test that emails respect preferences
const user = await prisma.user.update({
  where: { id: userId },
  data: {
    emailPreferences: {
      productUpdates: false, // Disable perk notifications
    },
  },
})

// Trigger perk-gained event
// Email should be skipped with reason: "User has disabled productUpdates notifications"
```

## Troubleshooting

### Email not sending?

1. Check `emailNotificationsEnabled` is `true`
2. Verify preference category is enabled for that email type
3. Confirm `sourceEvent` is set in `email.send` event
4. Check `EVENT_TO_PREFERENCE_MAP` has the event type mapped
5. Review logs: look for "Email skipped due to user preferences"

### Email preferences not working?

1. Ensure `sourceEvent` is passed when emitting `email.send`
2. Verify event type exists in `EVENT_TO_PREFERENCE_MAP`
3. Check user preferences JSON structure is valid
4. Test with `shouldSendEmail()` function directly

### Email template rendering issues?

1. Build from the shared components, which use inline styles that email clients support
2. Check the plain-text version too, since some clients only show that
3. Check how it looks at phone width
4. Validate HTML output in Resend preview

## Resources

- [React-Email Documentation](https://react.email/)
- [Resend Documentation](https://resend.com/docs)
- [Event System Documentation](../events/README.md)
