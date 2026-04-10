# Changelog (updated)

All notable changes to this project will be documented in this file.

The format is based on "Keep a Changelog" and follows [Semantic Versioning](https://semver.org/).

## [2.4.0] - 2026-04-09

### Added
- **Full-Width Hero Cards on All Dashboard & Admin Pages** — Every dashboard and admin page now renders a full-width glass hero/title card *above* the `[sidebar | content]` flex row, rather than inside it.
  - `DashboardShell` gains an optional `header?: React.ReactNode` prop; when provided it renders above the sidebar+content layout.
  - `AdminShell` gains the same `header` prop with identical behaviour.
  - All 10+ dashboard pages (`/dashboard`, `/dashboard/files`, `/dashboard/analytics`, `/dashboard/upload`, `/dashboard/urls`, `/dashboard/domains`, `/dashboard/paste`, `/dashboard/verification-codes`, `/dashboard/bucket`, `/dashboard/discovery`) updated to pass their hero as the `header` prop.
  - All 11+ admin pages (`/admin`, `/admin/users`, `/admin/blog`, `/admin/legal`, `/admin/settings`, `/admin/logs`, `/admin/email`, `/admin/testimonials`, `/admin/partners`, `/admin/products`, `/admin/reports`, `/admin/applications`) updated with the same pattern.
  - Hero glass-cards extracted from client components (`DashboardIndex`, `AnalyticsOverview`, `AdminOverviewContent`) — server pages now own the hero and pass it down; client components render content only.
  - `DashboardShell` removed from `dashboard/layout.tsx`; each page wraps individually so the shell only appears once.
- **Discovery Mobile Tab Navigation** — The Discovery page previously relied on the sidebar for section navigation, leaving mobile users with no way to switch between Talent and Squads or navigate talent sub-sections.
  - `NexiumDashboardClient` now renders two horizontally-scrollable tab strips on mobile (`lg:hidden`) when not in squad-detail view.
  - Top strip: **Talent Profile** / **Squads** — controls the `selectedTab` state.
  - Sub-strip (Talent only): **Profile** / **Skills** / **Signals** / **Opportunities** / **Applications** — controls `talentSection`.
  - Both strips match the existing dashboard sidebar mobile style (`glass-subtle rounded-xl p-1.5`, active state `bg-primary/10 text-primary border border-primary/20`).
- **Discovery Navigation in Dashboard Sidebar** — Discovery sub-links moved from the old discovery-specific internal sidebar into the main `DashboardSidebar` as a collapsible expandable section.
  - Sidebar shows a **Discovery** parent row with a `ChevronDown` toggle; children are **Talent Profile** and **Squads**.
  - When on a talent sub-page, talent sub-links (Profile, Skills, Signals, Opportunities, Applications) render as indented secondary items below Talent Profile.
  - Collapse/expand state is initialised to open when the user is already under `/dashboard/discovery`.

### Fixed
- **Double Navbar on `/me` Routes** — `ConditionalBaseNav` was hiding the base nav for `/dashboard` and `/admin` but not for `/me`, causing `DashboardWrapper`'s fixed glass navbar to render alongside the `<BaseNav />` from the main layout on profile pages.
  - Added `/me` to the exclusion list in `conditional-base-nav.tsx`.
- **`LogoutButton` Import in Discovery Page** — Import path `../../profile/logout-button` resolved to a non-existent directory after the profile page was moved to `/me`. Fixed to `../../me/logout-button`.
- **`NexiumSquad.urlId` / `avatarUrl` Invalid Field References** — Prisma threw `PrismaClientValidationError` on the squad invite GET and accept routes because `urlId` and `avatarUrl` do not exist on `NexiumSquad` (fields are `slug` and `logo` respectively).
  - `GET /api/discovery/invites` — squad select updated: `urlId` → `slug`, `avatarUrl` → `logo`.
  - `GET /api/discovery/invites/[token]/accept` — same correction.
  - `SquadIncomingInvite` type in `dashboard/discovery/client.tsx` updated to match.
- **Squad Member Invite Flow** — Various issues in the invite accept/decline redirect flow corrected.
- **Build Errors and GitHub Links** — Miscellaneous build failures and broken GitHub repository links resolved.



### Added
- **Discovery Dashboard Redesign** — Full sidebar-controlled layout replacing the previous flat tab strip.
  - Three sidebar modes: talent (sub-tabs), squad detail (squad tabs), and top-level (squads list).
  - Talent sub-sections — Profile, Skills, Signals, Opportunities, Applications — rendered as indented sidebar items below "Talent Profile" on desktop; horizontal strip on mobile.
  - `NexiumDashboard` now supports optional controlled `activeSection` / `onSectionChange` props so the outer sidebar can drive section navigation without internal state conflicts.
  - Squad detail view rendered inline via `SquadDashboardClient` in embedded mode; tab state owned by the parent discovery client.
- **Discovery Page Hero Header** — Glass-card header on `/dashboard/discovery` showing the page title, a short description, quick-action links (View Public Profile, Profile Settings, Applications), and a `LogoutButton`.
- **GitHub Repo Picker Improvements** — Signal creation flow is now picker-first when GitHub is linked.
  - Repo picker shown immediately on "Add signal"; manual form is an explicit secondary option.
  - Org switcher replaced with a compact native `<select>` dropdown (user shown first, then orgs alphabetically).
  - Multi-select checkboxes on every repo row; selection highlighted with `border-primary/40 bg-primary/5`.
  - Footer "Add X signals" bulk-submit button appears when at least one repo is selected; POSTs each repo as a separate signal and shows a count toast on completion.
  - Info callout explains why repos are shown and lists other signal types (deployed apps, OSS contributions, shipped products, etc.) with a link to the manual form.
  - Manual form redesigned with "Browse repos" back button and "Cancel" header; no longer shows an inline GitHub shortcut inside the form body.
- **GitHub `read:org` OAuth Scope** — GitHub account linking now requests `read:org` in addition to `public_repo,repo`, so repositories from organizations the user belongs to are accessible in the picker.
  - Organization repos included via `affiliation=owner,collaborator,organization_member` on the GitHub repos API call.
  - "Grant org access" re-auth link in the picker footer and error state for users needing to re-authorize.
- **Squad Branding Fields** — `NexiumSquad` schema extended with `tagline` (≤120 chars), `logo` (URL), `banner` (URL), `website`, `twitter`, `github`, and `discord` social/web presence fields.
- **Squad File Relation** — `File` model gains a nullable `squadId` foreign key and `NexiumSquad` relation (`onDelete: SetNull`), enabling squad-owned file uploads alongside per-user files.
- **Discovery Dashboard Nav Link** — Dashboard navigation updated to surface `/dashboard/discovery` directly under the Dashboard menu.
- **Email Template Expansion** — 13 new transactional email templates covering the full account lifecycle.
  - `EmailChangedOldEmail` / `EmailChangedNewEmail` — dual notifications sent to both old and new address when email is changed, including timestamp and change source.
  - `ExportRequestedEmail` / `ExportCompletedEmail` — confirmations for data export request and download-ready notifications.
  - `DeletionRequestedEmail` / `DeletionCancelledEmail` / `AccountDeletedEmail` — full account deletion flow emails with cancellation window and final confirmation.
  - `SubscriptionCreatedEmail` / `SubscriptionUpdatedEmail` / `SubscriptionCancelledEmail` — Stripe subscription lifecycle notifications with plan details.
  - `PaymentSucceededEmail` / `PaymentFailedEmail` — payment confirmation and failure alerts with invoice context.
  - `RefundIssuedEmail` — refund confirmation with amount and reason.
  - All templates barrel-exported from `packages/lib/emails/index.ts` and wired into the event handler in `packages/lib/events/handlers/email.ts`.
- **Email Event Handler Overhaul** — `packages/lib/events/handlers/email.ts` completely rewritten.
  - Each template now has a dedicated dispatch branch instead of falling through to the generic `BasicEmail` renderer.
  - Existing templates (`welcome`, `verify-email`, `magic-link`, `password-reset`, `account-change`, `perk-gained`, `quota-reached`, `storage-assigned`, `new-login`, `admin-broadcast`, Nexium invite/welcome/opportunity, application status/reply, bucket credentials) all converted to typed `sendTemplateEmail` calls.
  - Eliminates the previous "body string split" fallback that caused inconsistent rendering across templates.
- **Squad Create Dialog** — Full-featured squad creation dialog replacing the previous single-field inline form.
  - `packages/components/discovery/squad-create-dialog.tsx` — React Hook Form + Zod validated dialog with name, description, max size, public toggle, and comma-separated skills fields.
  - Accepts any trigger element as `children` so it can be opened from any context.
- **Add Member Dialog** — Searchable user picker for squad owner to invite members.
  - `packages/components/discovery/add-member-dialog.tsx` — live search via `/api/users/search` with debounced input, avatar display, and one-click add.
  - Shows user name, handle, and email; highlights already-added members with a checkmark badge.
- **Squad Members Manager Component** — Standalone member list with role and kick controls.
  - `packages/components/discovery/squad-members-manager.tsx` — renders member rows with inline role `<select>` (MEMBER / OBSERVER) and kick button; owner row is non-editable.
  - Calls `POST /api/discovery/squads/[id]/members` for both role changes and kicks.
- **Squad Settings Form** — Full settings and danger-zone panel for squad owners.
  - `packages/components/discovery/squad-settings-form.tsx` — editable name, description, max size, public toggle, and skills; separate danger zone card with `AlertDialog`-gated disband action.
  - Validates with Zod, shows inline field errors, and navigates away on successful disband.
- **User Search API Endpoint** — `GET /api/users/search?q=query&limit=10`.
  - Returns `id`, `name`, `email`, `image`, `urlId` for matching users; searches `name` and `email` case-insensitively.
  - Used by `AddMemberDialog` for live member lookups.
- **Squad Members GET Endpoint** — `GET /api/discovery/squads/[id]/members` now returns the full member list for authenticated squad members (was previously missing entirely).
- **GitHub-Style Signal Cards** — Nexium proof-of-skill signals now render as rich GitHub embed widgets for `GITHUB_REPO` type signals, and branded cards for all other types.
  - New `packages/components/profile/signal-card.tsx` — `GitHubRepoCard` renders with GitHub's dark `#0d1117` surface, blue repo name link, muted description, topic chips, language color dot (30+ language colors from linguist palette), and live ⭐/🍴 counts pulled from metadata.
  - Generic signals show the user-supplied logo/banner image as a card header, falling back to a colored type abbreviation chip when no image is provided.
  - `SignalCard` dispatches to the correct renderer based on `type`; exported `SignalCardData` type consumed by all three display locations.
- **Signal Logo / Banner URL** — Non-GitHub signals now accept an optional `imageUrl` field for custom logos or banners displayed in the signal card header.
  - `imageUrl` added to `SignalInputSchema` in `packages/types/dto/nexium.ts` and exposed as a form field in the Nexium dashboard panel.
  - Field is hidden for `GITHUB_REPO` signals since the owner avatar is sourced automatically from GitHub API metadata.
- **Automatic GitHub Repo Metadata Fetch** — When a `GITHUB_REPO` signal is created or updated with a `github.com` URL, the API now automatically fetches live repository metadata and stores it in the signal's `metadata` field.
  - `POST /api/discovery/signals` — calls `parseGitHubUrl()` then `getRepo(owner, repo)` before writing to the database; stores `full_name`, `description`, `stargazers_count`, `forks_count`, `language`, `topics`, and `owner.avatar_url`.
  - `PUT /api/discovery/signals/[id]` — re-fetches metadata when the URL field changes on an existing `GITHUB_REPO` signal, keeping star/fork counts fresh on edit.

### Fixed
- **Squad Dashboard Blank Screen** — Squad detail page rendered nothing after a previous session changed the GET route to return `{ squad, isOwner }` while the client still read the response as the squad object directly.
  - Reverted `GET /api/discovery/squads/[id]` to return the squad directly via `apiResponse(squad)`; the `isOwner` flag is redundant since `page.tsx` passes `role` as a prop from the server.
- **Kick Member Failures** — Kick action was broken in two independent ways.
  - Wrong HTTP method: client called `DELETE /members` which invokes `leaveSquad()` on the caller (owners can't leave, so always errored). Fixed to `POST /members` with `{ userId, kick: true }`.
  - Wrong ID field: client passed `m.user.urlId` (human slug) instead of the UUID. Fixed by adding `id: true` to `SQUAD_INCLUDE`'s user selects in `packages/lib/nexium/squads.ts`.
- **ShareX Squad Uploads Returning 401** — `POST /api/files` only checked session and personal upload tokens; squad-issued upload tokens and `nsk_` API keys were never validated.
  - `getSquadFromBearerToken()` is now called first; on match, the squad owner's session is used as the acting user.
  - Squad uploads check `storageQuotaMB` separately from user quota and increment `nexiumSquad.storageUsed` (in bytes) in the same DB transaction.
- **Overview Stat Counts Always `–`** — API keys and domain counts on the squad overview tab showed dashes because those resources were only fetched when the user switched to their respective tabs.
  - Both are now pre-fetched on initial mount alongside the squad load so overview cards populate immediately.
- **Members Route Now Handles Four POST Cases** — `POST /api/discovery/squads/[id]/members` was previously only handling the join-self flow.
  - Rewritten to dispatch on body shape: `{ userId, kick: true }` → kick member; `{ userId, role }` → set role; `{ userId }` → owner direct-add; empty body → join self.
  - Direct-add validates: caller is owner, squad not at capacity, squad status is FORMING or ACTIVE, target user exists and is not already a member.
- **Welcome Email Sent Twice** — `packages/lib/events/handlers/account.ts` was registering the welcome email listener twice on startup; removed duplicate registration.
- **About Page Contributors Pulling from Forks** — `/about` contributors section was fetching commits from forked repositories, inflating the contributor list with unrelated accounts.
  - Fixed query to filter out forks so only canonical repo contributors appear.
- **Home CTA Button Wording** — Updated call-to-action button text on the home page for clarity.
- **S3 Section Feature List** — Removed a feature description and refined another for accuracy in `packages/components/pricing/S3Section.tsx`.
- **Magic Link Debug Logging** — Added server-side trace logging to both the send route and the NextAuth credentials provider to diagnose "Invalid or expired token" failures.
  - `[Magic Link Send]` logs confirm token generation and DB write; `[Auth]` logs expose stored vs. incoming hash comparison on validation failure.
- **GitHub Re-auth OAuth Callback Failing** — `getGitHubUserInfo` called `github.request('/user')` in the token-auth branch, but `github` was never imported in that module — a silent `ReferenceError` caught by the try/catch returned `null` and redirected users to the profile page with "Failed to retrieve GitHub user info".
  - Fixed to use the `personalAccessToken` argument via a direct `fetch` to `https://api.github.com/user` with an `Authorization: token` header.
  - Re-authorizing GitHub to grant additional org access now completes successfully.
- **Organization Repos Missing from Picker** — GitHub repos API only fetched repos with `affiliation=owner,collaborator`; organization-member repos never appeared in the picker.
  - Added `organization_member` to the affiliation list so all accessible repos are returned.
- **Squad Invite System** — Replaced direct owner-add with a full invite/accept/decline flow backed by email notifications.
  - New `NexiumSquadInvite` Prisma model with token-based accept/decline links, `PENDING`/`ACCEPTED`/`DECLINED`/`EXPIRED` status enum, 7-day TTL, and a `@@unique([squadId, userId])` constraint preventing duplicate pending invites.
  - `POST /api/discovery/squads/[id]/invites` — owner sends an invite; validates squad capacity, member status, and existing pending invite; emits `nexium.squad-invite` event to fire the invite email.
  - `GET /api/discovery/squads/[id]/invites` — lists pending invites for the squad (owner only).
  - `DELETE /api/discovery/squads/[id]/invites/[inviteId]` — owner revokes a pending invite.
  - `GET /api/discovery/invites/[token]/accept` — validates token, creates `NexiumSquadMember`, emits `nexium.squad-invite-accepted` to notify the owner; redirects to the squad dashboard on success.
  - `GET /api/discovery/invites/[token]/decline` — marks invite declined, emits `nexium.squad-invite-declined` to notify the owner; redirects to Discovery dashboard.
  - `GET /api/discovery/invites` — returns all active pending invites for the current user (for in-app display).
  - `POST /api/discovery/squads/[id]/members` direct-add branch removed; endpoint now returns `410 Gone` with an upgrade message pointing to the invite route.
  - Squad members tab updated: search button label changed from "Add" to "Invite"; already-invited users shown with a yellow "Invited" badge; new "Pending Invites" section lists pending invites with avatar, expiry date, and per-invite revoke button.
  - Discovery dashboard Squads view now shows an "Incoming Invites" card when the user has pending squad invites, with per-invite Accept (→ token URL) and Decline (→ token URL) buttons.
  - New email templates: `NexiumSquadInviteAcceptedEmail` (green themed, notifies owner when member accepts) and `NexiumSquadInviteDeclinedEmail` (gray themed, notifies owner when member declines).
  - Updated `NexiumSquadInviteEmail` to add `declineUrl` prop and decline link in the body.
  - New event types: `nexium.squad-invite-accepted` and `nexium.squad-invite-declined` added to `EventTypeMap` and the nexium event category list.
  - Prisma migration: `20260409062443_add_squad_invites`.

### Technical
- **Signal Display Refactor** — All three signal render locations unified behind the shared `SignalCard` component.
  - `nexium-dashboard.tsx` (profile settings panel), `nexium-public-section.tsx` (public profile sidebar), and `public-profile.tsx` (Talent tab full page) all replaced their inline signal render blocks with `<SignalCard />`.
  - Dashboard panel wraps each card in a `group relative` container so a floating delete button appears on hover without cluttering the card layout.
- **Squad Component Library** — Four new reusable components under `packages/components/discovery/`.
  - `squad-create-dialog.tsx`, `add-member-dialog.tsx`, `squad-members-manager.tsx`, `squad-settings-form.tsx` — all client components using React Hook Form, Zod, and the existing glass-card design system.
- **Squad Dashboard Client Refactor** — `app/(main)/dashboard/discovery/squads/[id]/client.tsx` significantly expanded.
  - Added `SquadMember` type (with `user.id` UUID) and `UserSearchResult` type for type-safe member operations.
  - Member management functions: `searchUsers` (300 ms debounce), `addMember`, `kickMember`, `setMemberRole` — all inline with loading state per-action.
  - Members tab now renders search input → results dropdown → add button alongside the full member list with inline role selector and kick button.
- **`NexiumDashboard` Controlled Mode** — Component now accepts optional `activeSection?: NexiumSection` and `onSectionChange?: (s: NexiumSection) => void` props; falls back to internal state when uncontrolled so existing usages remain unchanged.
- **Squad Storage Tab Bug Fix** — Storage tab `useEffect` was watching `tab` (always `'overview'` in embedded mode) instead of `currentTab`, causing the storage data to never load when navigating to the tab from the sidebar.
- **Prisma Migration** — `20260409051625_add_squad_branding_and_files` adds branding columns (`tagline`, `logo`, `banner`, `website`, `twitter`, `github`, `discord`) and the `files` relation to `NexiumSquad`; adds `squadId` index to `File`.

## [2.2.0] - 2026-04-04

### Added
- **Stripe API Clover Compatibility** — Updated promo code creation to use new Stripe v2025-11-17.clover API structure.
  - `promotionCodes.create` now uses `promotion: { type: 'coupon', coupon: string }` wrapper instead of direct `coupon: string` parameter.
  - Applied to three endpoints: `POST /api/admin/promo-codes`, `GET /api/admin/promo-codes`, and `POST /api/payments/promo-codes`.
  - Promo code responses properly expand nested coupon data via `expand: ['data.promotion.coupon']` for complete pricing details.
- **Promo Code Orphan Prevention** — Coupon deletion rollback mechanism when promotion code creation fails.
  - After creating a coupon, if `promotionCodes.create` fails, the orphaned coupon is automatically deleted to prevent dangling resources.
  - Reduces Stripe admin cleanup burden and improves data consistency.
- **Kener Status Page Integration** — Real time service status monitoring from Kener instance.
  - Maps Kener v4 monitor state field format to aggregated health statuses: `ACTIVE` → `UP`, `INACTIVE` → `DOWN`.
  - `GET /api/status` returns aggregated system health from all visible monitors with 60 second cache TTL.
  - Properly differentiates between Kener workflow state (ACTIVE/INACTIVE) and actual health status (UP/DOWN/DEGRADED).
- **Graceful Status Fallback** — Status endpoint returns `UNKNOWN` status instead of 503 when Kener is unreachable.
  - Improves UX for development environments without configured status page.
  - Prevents production status page from failing hard when external monitoring is unavailable.
- **User Buckets Storage System** — Granular file storage organization per user.
  - New `UserBucket` model with storage quota tracking and access control.
  - Prisma migration: `20260404075543_add_user_buckets` — Database schema for bucket management.
  - Enables team-based storage organization without requiring squads.
- **User Grants & Permissions System** — Role-based access control and permission management.
  - New `UserGrant` model and permission system for granular authorization.
  - Prisma migration: `20260404085324_add_user_grants` — Permission tracking and enforcement.
  - Supports delegation of admin functions without full superadmin access.
- **Sentry Error Tracking Integration** — Client and server error reporting with `@sentry/nextjs`.
  - Automatic error capture from both browser and server environments.
  - Environment-specific configuration via `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`.
  - Sentry source map upload and release tracking for production deployments.
- **Admin Applications List Redesign** — Comprehensive card based redesign replacing plain table layout.
  - Individual glass card rows with user avatars (initials fallback), role badges, and action buttons.
  - Header card with live stats pills showing PENDING and REVIEWING application counts via Prisma `groupBy` aggregation.
  - Proper empty state with centered icon when no applications exist.
- **Admin Applications Detail Redesign** — Improved detail page layout with icon headers and organized sections.
  - Header card with accent gradient top bar, `ClipboardCheck` icon, and back navigation.
  - Applicant card uses `next/image` with initial fallback instead of bare `<img>` tag for proper image optimization.
  - Section headers use small caps muted styling for visual hierarchy.
  - Metadata sidebar displays icon prefixed rows instead of plain key/value pairs for better readability.
- **Pricing Discounts Section Redesign** — Flat card design removing layered nesting.
  - Changed from outer wrapper with inner nested `glass-subtle` cards to flat `glass-card` per discount.
  - Matches the design pattern of `AddOnSelector` component.

### Changed
- **Documentation Files Comprehensive Update** — Production-ready documentation for open source project.
  - `README.md` expanded from minimal placeholder to complete project overview including:
    - Feature breakdown (file storage, domains, verification, teams, applications, admin tools)
    - Tech stack reference (Next.js 15, React 19, TypeScript, Tailwind, Stripe, Prisma, PostgreSQL, Kener)
    - Quick start setup guide with prerequisites and step-by-step instructions
    - Directory structure overview and contribution guidelines
    - Support channels (Discord, GitHub Discussions, email)
    - License and acknowledgments sections
  - `CONTRIBUTING.md` normalized for consistency:
    - Removed hyphens in compound words (`real-time` → `realtime`, `longer-form` → `longer form`)
    - Removed emoji formatting from template text
    - Maintained comprehensive developer setup, PR process, and coding standards documentation
- **Kener Status API Response Mapping** — Updated aggregation logic to handle Kener v4 format correctly.
  - Recognizes `ACTIVE` as enabled monitor state (treated as UP health status).
  - Differentiates between workflow state and actual health status properly.
  - Fallback to `UNKNOWN` status prevents status page crashes during Kener outages.
- **GitHub Module Export Structure** — Fixed module export for better client bundling.
  - Removed unused `github` object export from `packages/lib/github/index.ts`.
  - Clients now import only required functions (`getGitHubUser`, `getOrgRepos`, etc.) instead of entire module.
- **Grant Constants Client Access** — Separated client-safe constants from server code.
  - `public-profile.tsx` now imports `GRANT_META` and `ALL_GRANTS` directly from `packages/lib/grants/constants`.
  - Prevents Prisma (server-only database code) from being bundled into browser JavaScript.

### Fixed
- **TypeScript Nullish Coalescing Operator Syntax** — Resolved Turbopack build error in GitHub utility.
  - Fixed operator precedence in `packages/lib/github/index.ts:181` by adding parentheses.
  - Changed: `org ?? integrations.github?.org || process.env.GITHUB_ORG ?? 'EmberlyOSS'`
  - To: `org ?? (integrations.github?.org || process.env.GITHUB_ORG) ?? 'EmberlyOSS'`
- **Admin Applications Pages File Truncation** — Resolved file truncation issues from concurrent editing.
  - `app/(main)/admin/applications/page.tsx` — truncated old table code block removed, file normalized to 224 lines.
  - `app/(main)/admin/applications/[id]/page.tsx` — stray old code after return removed, missing closing brace added, file normalized to 243 lines.
- **Review Form Hydration Error** — Fixed React hydration mismatch in application review form.
  - `packages/components/admin/applications/review-form.tsx` — replaced invalid `<Badge>` render inside `<p>` tag with `<div>` flex container.
  - Text content wrapped in `<span>` elements to maintain layout structure without hydration mismatches.
- **Stripe Promo Code Expansion Fields** — Public promo code endpoint now correctly expands promotion coupon data.
  - Added `expand: ['data.promotion.coupon']` to `promotionCodes.list` calls for complete coupon details in responses.
  - Clients can now access coupon discount amounts directly from promo code API responses.
- **Prisma Bundle in Client Components** — Removed Node.js database library from browser bundles.
  - `public-profile.tsx` client component no longer imports server-only database utilities.
  - Reduced bundle size and prevented runtime errors from missing Node.js modules (dns, fs, net, tls) in browser context.
- **Debug Console Output Cleanup** — Removed temporary logging statements from Kener integration.
  - Cleaned up `[KENER]` prefixed console logs used during debugging phase.

### Technical
- **Prisma Migrations** — Three migrations for storage and permissions infrastructure.
  - `20260404075543_add_user_buckets` — User bucket management schema with quota tracking.
  - `20260404085324_add_user_grants` — User grants and permission system models.
- **Status Endpoint Architecture** — Kener integration in `packages/lib/kener/index.ts`.
  - `getKenerStatus()` fetches from `/api/v4/monitors` with Bearer token authorization.
  - `aggregateStatus()` intelligently maps monitor states to health statuses with proper fallback logic.
  - 60 second cache TTL reduces API load while maintaining reasonable freshness.
- **Sentry Configuration** — Multi-environment error tracking setup.
  - `sentry.client.config.ts` — Browser client configuration with sourcemap upload and release tracking.
  - `sentry.server.config.ts` — Backend API server error capture.
  - `sentry.edge.config.ts` — Edge runtime (middleware) error handling.
  - Environment-aware initialization with development/production specific settings.

## [2.1.0] - 2026-04-03

### Added
- **Brand Icon System (`skill-icons.tsx`)** — New shared utility in `packages/components/profile/` mapping 100+ skill name patterns to brand icons.
  - Uses **react-icons/si** (Simple Icons SVG) for modern tech: React, Next.js, TypeScript, Docker, Kubernetes, Terraform, GraphQL, Tailwind CSS, Svelte, Angular, Kotlin, Flutter, Rust, Go, and more.
  - Uses **devicons CSS font** for supplemental coverage: Python, Node.js, PHP, Ruby, Java, Swift, Dart, PostgreSQL, MySQL, MongoDB, Redis, GitHub, Firebase, AWS, HTML5, CSS3, Sass, Linux, Ubuntu, Debian, jQuery, npm, Laravel, Django, Meteor, Heroku, Jenkins, Travis CI, and more.
  - `getSkillIcon(name)` returns a type-discriminated `si` | `di` entry; `SkillIcon` component renders SVG or devicons glyph with correct brand color.
  - Consumed by both `public-profile.tsx` and `nexium-dashboard.tsx`.
- **Skill Level Bar** — New `SkillLevelBar` component replacing verbose badge text with 4 colored dots (blue/green/orange/purple by level). Used in public profile Talent tab and Nexium dashboard Skills panel.
- **Skills Category Grouping** — Skills are now grouped by category with a subtle category header in both the public profile and Nexium dashboard panels.
- **Signal Type Icon Chips** — Each signal type renders a colored icon chip for quick visual identification. GitHub repo signals use the `SiGithub` brand icon. All signal cards redesigned with bolder title, small uppercase type label, and cleaner layout.
- **Per-Tier Contributor & Booster Badges** — Perk role badges completely redesigned with custom gradient pill styling per tier.
  - **Contributor:** Bronze (amber), Silver (slate/zinc), Gold (yellow), Platinum (cyan/teal), Diamond (sky→violet gradient).
  - **Booster:** Bronze (amber), Silver (slate/zinc), Gold (yellow), Platinum (fuchsia), Diamond (purple→pink gradient).
  - Each badge includes a tier icon and a gradient border, replacing the generic flat `<Badge>` component.
- **Discord Social Link Icon** — Profile Discord social link now renders the `SiDiscord` brand icon (`#5865F2`) instead of the generic `MessageCircle` lucide icon.
- **Admin User Verify** — New admin action to manually verify a user's account.
  - `POST /api/admin/users/[id]/verify` — sets `isVerified: true` (or toggles it) on the target user.
  - `isVerified` and `storageQuotaMB` fields added to `USER_ADMIN_SELECT`; active subscription with product details also included.
  - Verify button in the admin user list shows `BadgeCheck` icon; verified users display a blue checkmark next to their name.
- **Admin User List — Plan & Storage columns** — Each user row now shows:
  - A plan badge (with `Zap` icon and plan name, or "Free" fallback).
  - A storage usage bar with color thresholds (orange at 75%, red at 90%).
- **Subscription Sync Endpoint** — New `POST /api/payments/sync-subscription` re-syncs the authenticated user's active Stripe subscriptions into the database. Useful when the original checkout webhook was missed or not yet configured.
- **Storage Quota Auto-Healing** — `getPlanLimits()` now automatically attempts a one-time Stripe sync when no active subscription is found in the database. A per-user 5-minute TTL cache prevents excessive Stripe calls.
- **Analytics Plan & Usage Card** — `AnalyticsOverview` now includes a Plan & Usage section showing:
  - Current plan name and badge.
  - Storage progress bar with used/total and percentage.
  - Upload size cap and custom domain limit (from plan).
  - `GET /api/analytics/overview` now returns `quotaInfo` and `planInfo` fields.
- **Billing History — Payment Methods & Subscriptions** — The billing settings tab now shows:
  - All saved payment methods (card brand, last 4 digits, expiry, default indicator).
  - All Stripe subscriptions with status badges (Active/Trial/Past Due/Cancelled), renewal date, billing interval, and amount.
  - Fetches all payment method types via `stripe.customers.listPaymentMethods` (captures Link-attached cards that `type:'card'` misses).

### Changed
- **Public Profile Redesign** — `public-profile.tsx` fully rewritten with a tabbed layout (Overview, Files, URLs, Contributions, Talent). Contributions tab lazy-loads on first click.
- **Contributions API Performance** — `GET /api/users/[id]/contributions` parallelized with `Promise.allSettled` — all repo and commit detail fetches now run concurrently, eliminating sequential O(repos × commits) round-trips.
- **Analytics Gating** — `GET /api/analytics/overview` now enforces plan-based gating on `topFiles` and `topUrls` fields (returns empty arrays for free tier) instead of unconditionally sending them.
- **Domain Slot Counting** — `getPurchasedDomainSlots()` now counts yearly subscription domain slots alongside legacy one-off purchases using a parallel `Promise.all` query.
- **`package.json` Cleanup** — Removed `bun` as a runtime dependency; added `react-icons` and `devicons` as explicit dependencies; `tsx` added for script execution.

### Fixed
- **`/u/[shortCode]` Username Lookup** — Short URL redirect now correctly resolves by username/vanity ID instead of raw user ID.
- **Proxy Custom Domain Root Rewrite** — Fixed incorrect rewrite target when a visitor hits `/` on a verified custom domain.
- **Private Profile Handling** — Profile page now correctly shows a private state instead of partially rendering when `profileVisibility` is private.
- **Duplicate Declaration Crash** — Removed stale duplicate code block appended after `public-profile.tsx` rewrite that caused five symbols to be declared twice.
- **Analytics `formatBytes` Unit Bug** — `AnalyticsOverview` was treating MB values as raw bytes; now correctly multiplies by 1 024² before formatting.
- **Stripe Credit Balance Sign** — Billing history was displaying Stripe's negative customer balance (credit) as a negative number; now correctly inverted to show credit as a positive `stripeBalance`.

## [2.0.0] - 2026-04-02

### Added
- **Royal Purple Theme** - Signature preset Emberly theme with rich purple color palette.
  - Royal Purple (💜) now the default theme for all new installations.
  - Comprehensive color configuration with custom hue/saturation/lightness controls.
  - Theme preset system expanded with additional base and animated themes.
  - Persistent theme selection in user profile persisted to database.
- **Discord Webhook Notification System** - Complete Discord integration for account and event notifications.
  - New `/api/profile/discord-webhook/test` endpoint to validate webhook URLs and send test notifications.
  - Discord notification handler integrated into event system with automatic preference gating.
  - User model extended with `discordWebhookUrl`, `discordNotificationsEnabled`, and `discordPreferences` fields.
  - Notification preferences UI in profile settings with category toggles: Security, Account, Billing, Marketing, Product Updates.
  - Event-driven delivery: billing events, security alerts, and account changes routed to Discord webhooks.
  - Prisma migration: `20260330011308_add_discord_webhook_notification_preferences`.
- **Custom Domain Routing via Proxy** - Visitors on custom domains see owner's public profile on root path.
  - New `/api/internal/domain-lookup` endpoint for secure hostname → profile mapping.
  - Middleware-level custom domain detection with fallback to normal routing for non-root paths.
  - Dynamic profile lookup using vanityId, urlId, and name with public visibility checks.
  - Enables white-label-style domains pointing to individual creator profiles.
- **Nexium Talent Discovery Platform** - New `/nexium` page introducing talent discovery features coming to Emberly.
  - Landing page showcasing Nexium's core features: unified profiles, proof-of-skill signals, smart opportunity routing, squad collaboration.
  - "How It Works" journey: Show Your Best Work → Prove with Signals → Match with Opportunities → Collaborate Fast.
  - Feature cards with animated hover effects and gradient icons.
  - FAQ section with 5 key questions about platform scope, audience, and timeline.
  - Audience badges: Developers, Creators, Community Managers, Studios.
  - Call-to-action buttons linking to registration and GitHub/Discord community channels.
- **Nexium Backend Infrastructure** - Complete talent platform backend with profiles, skills, signals, opportunities, applications, and squads.
  - 8 new Prisma models: `NexiumProfile`, `NexiumSkill`, `NexiumSignal`, `NexiumOpportunity`, `NexiumApplication`, `NexiumSquad`, `NexiumSquadMember`, `NexiumSquadSubscription`, `NexiumSquadApiKey`.
  - 8 new enums: `NexiumAvailability`, `NexiumSkillLevel`, `NexiumSignalType`, `NexiumOpportunityType`, `NexiumOpportunityStatus`, `NexiumApplicationStatus`, `NexiumSquadStatus`, `NexiumSquadRole`.
  - `NexiumProfile` extends `User` with unique `@handle` (lowercase, 3–32 chars), title, headline, availability, `lookingFor` tags, timezone, and location.
  - `NexiumSkill` supports level (Beginner → Expert), category (13 categories including Frontend, Backend, Game Dev, Data/ML), and sort ordering (max 30 per profile).
  - `NexiumSignal` tracks proof-of-work artifacts: GitHub repos, deployed apps, open-source contributions, shipped products, certifications, and more (max 20 per profile, with optional verification).
  - `NexiumOpportunity` supports Full-Time, Part-Time, Contract, Collab, and Bounty types with budget ranges, deadlines, required skills, and team size.
  - `NexiumApplication` workflow: PENDING → VIEWED → SHORTLISTED → ACCEPTED/REJECTED/WITHDRAWN with one-app-per-opportunity constraint.
  - Prisma migration: `20260330091056_add_nexium_tables`.
- **Nexium Library Modules** - Full business logic layer across 7 modules in `packages/lib/nexium/`.
  - `constants.ts`: Platform-wide limits (30 skills, 20 signals, 20 squad members, 10 API keys), handle regex, and enum-to-label mappings for all 8 enums.
  - `profiles.ts`: CRUD + discovery with paginated `listProfiles()` filtering by availability, skill, and `lookingFor` tags. Handle availability check with case-insensitive validation.
  - `skills.ts`: Add, update, remove, reorder (atomic transaction), and bulk replace for profile skills.
  - `signals.ts`: Add, update, remove, reorder, and admin `verifySignal()` for proof-of-work verification.
  - `opportunities.ts`: CRUD with poster ownership enforcement, paginated listing with type/skill/remote filters.
  - `applications.ts`: Apply/withdraw for applicants, list/status-update for opportunity posters.
  - `squads.ts`: Full squad lifecycle (create/update/disband), membership management (join/leave/kick/role), upload tokens, API keys, quota, and custom domains.
  - Zod DTOs in `packages/types/dto/nexium.ts` for all request/response validation (15+ schemas).
  - Barrel export via `packages/lib/nexium/index.ts`.
- **Nexium API Routes** - 20+ REST endpoints for the complete Nexium platform.
  - Profile: `GET/POST/PUT/DELETE /api/nexium/profile`, `GET /api/nexium/profile/[handle]` (public lookup).
  - Skills: `GET/POST /api/nexium/skills`, `PUT/DELETE /api/nexium/skills/[id]` — supports add, bulk replace, and reorder via POST.
  - Signals: `GET/POST /api/nexium/signals`, `PUT/DELETE /api/nexium/signals/[id]` — supports add and reorder via POST.
  - Opportunities: `GET/POST /api/nexium/opportunities`, `GET/PUT/DELETE /api/nexium/opportunities/[id]`, `GET/POST/DELETE /api/nexium/opportunities/[id]/apply`.
  - Squads: `GET/POST /api/nexium/squads` (with `?mine=true` filter), `GET/PUT/DELETE /api/nexium/squads/[id]`, `POST/DELETE /api/nexium/squads/[id]/members`.
  - All routes use `requireAuth()` with appropriate ownership checks; public endpoints available for discovery.
- **Nexium Squad Infrastructure** - Teams/squads with quotas, billing, API access, upload tokens, and plans.
  - `NexiumSquad` model with `storageUsed`, `storageQuotaMB`, `uploadToken` (unique UUID), and `stripeCustomerId` for Stripe billing integration.
  - `NexiumSquadSubscription` model mirrors user `Subscription`, reuses existing `Product` table for plan management.
  - `NexiumSquadApiKey` model with `nsk_` prefixed keys, SHA-256 hashed storage, prefix display (first 12 chars), and `lastUsedAt` tracking. Max 10 keys per squad.
  - Upload token management: `GET/POST /api/nexium/squads/[id]/token` — generate and rotate Bearer tokens for squad file uploads.
  - API key management: `GET/POST /api/nexium/squads/[id]/keys`, `DELETE /api/nexium/squads/[id]/keys/[keyId]` — full key shown once on creation, only prefix visible after.
  - Quota endpoint: `GET /api/nexium/squads/[id]/quota` — returns plan name, storage used/quota, upload size cap, percent usage.
  - Free tier defaults: 5 GB storage, 500 MB upload size cap, 3 custom domains, 10 API keys.
  - Prisma migration: `20260330135926_add_nexium_squad_billing_and_api_keys`.
- **Nexium Squad Custom Domains** - Squads can own and manage custom domains independently from users.
  - `CustomDomain` model updated: `userId` made nullable, new `squadId` foreign key and `NexiumSquad` relation added.
  - Domain management API: `GET/POST /api/nexium/squads/[id]/domains`, `DELETE /api/nexium/squads/[id]/domains/[domainId]`.
  - Domain limits enforced per plan (3 for free tier, unlimited for paid plans via subscription lookup).
  - Cloudflare integration for domain registration and removal via existing `registerCustomDomain`/`removeCustomDomain` utilities.
  - Upload validation updated: `validateSquadCustomDomain()` validates domain ownership for squad-authenticated uploads.
- **Nexium Squad Authentication** - Squad-level Bearer token and API key authentication integrated into existing auth system.
  - New `AuthenticatedSquad` type in `api-auth.ts` with `squadId`, `slug`, `ownerUserId`, `storageUsed`, `storageQuotaMB`, and `authMethod` (`upload_token` | `api_key`).
  - `getSquadFromBearerToken(req)`: Authenticates squads via Bearer header — tries squad upload token first, then SHA-256 hashes `nsk_` prefixed keys against `NexiumSquadApiKey.keyHash`.
  - `requireSquadAuth(req)`: Wrapper returning `{ squad, response }` for use in API route handlers.
  - User domain validation extended: `validateCustomDomain()` now accepts domains owned by any squad the user is a member of.
- **Nexium Squad ShareX Config** - Pre-configured ShareX `.sxcu` download for squad file uploads.
  - New endpoint: `GET /api/nexium/squads/[id]/sharex` — generates and downloads a ShareX config file.
  - Config uses squad's upload token as Bearer auth, prefers squad's primary custom domain if available.
  - Version 15.0.0 format with MultipartFormData body, `{json:data.url}` response URL parsing.
  - Only accessible to squad members with an active upload token.
- **Nexium Dashboard** - Standalone squad management dashboard at `/dashboard/nexium` with full glass-card styling.
  - Dashboard list page: View all squads the user belongs to, create new squads inline, status badges (Forming/Active/Completed/Disbanded), member counts.
  - Squad detail page at `/dashboard/nexium/squads/[id]` with membership verification and role-based access.
  - Tabbed squad management interface with 6 tabs:
    - **Overview**: Squad info cards (members, domains, API keys), slug, max size, visibility, skills tags.
    - **Members**: Member list with avatars, role badges (Owner/Member/Observer), kick functionality for owners.
    - **Uploads**: Upload token display/hide/copy/rotate, ShareX `.sxcu` config download button.
    - **API Keys**: Create named keys, one-time full key display with copy, revoke keys, prefix-only listing with last-used dates.
    - **Domains**: Add/remove custom domains, verified/pending status badges, primary domain indicator.
    - **Storage**: Plan name, storage usage progress bar with color thresholds (green/yellow/red), max upload size display.
  - Lazy-loaded tab data fetched only when tab is viewed for performance.
  - All management actions gated by squad role (owner-only for destructive operations).
- **Nexium Profile Dashboard Tab** - Nexium talent profile management integrated into existing profile settings.
  - New "Nexium" tab in profile dashboard with `Zap` icon for profile creation and management.
  - Setup flow for new users: handle and headline input with regex validation and availability check.
  - Full profile editor: title, headline, availability (Open/Limited/Closed), `lookingFor` tags, timezone, location, visibility toggle.
  - Skills management section: add/edit/delete skills with level, category, and years of experience fields.
  - Signals management section: add/edit/delete proof-of-work signals with type, title, description, URL, and verification status.
- **Nexium Public Profile Section** - Talent information displayed on public user profiles.
  - New "Talent" tab on public profiles when user has a Nexium profile.
  - Displays `@handle`, availability badge (color-coded green/yellow/gray), `lookingFor` tags, title, and headline.
  - Skills listed with color-coded level badges (Beginner blue, Intermediate green, Advanced orange, Expert purple).
  - Signals listed with type labels, titles, verified checkmarks, and clickable URL links.
  - Server-side `nexiumProfile` data fetched and passed to `PublicProfile` component.
- **Rich Embeds Infrastructure** - Advanced metadata handling system for file embeds across Discord, Twitter, and other platforms.
  - New `bot-handler.ts` middleware detects crawler/bot requests and applies rich embed strategy based on user's `enableRichEmbeds` setting.
  - New `metadata.ts` core module with `buildRichMetadata()` function implementing platform-specific strategies:
    - **Images**: Use raw URL for direct embedding (Discord/Twitter show actual image)
    - **Videos**: og:video for inline playback, og:image for poster thumbnail, Twitter player for iframe embeds
    - **Audio/Music**: og:audio + cover art thumbnail
    - **Other files**: Branded OG card with file type badge and metadata
  - New file classification system (`file-classification.ts`) categorizing files by type (video, image, audio, music, document, code, text, other).
  - Dynamic OG/Twitter image generation respects active theme colors from site configuration.
  - `GET /api/internal/file-settings` endpoint for middleware to fetch `enableRichEmbeds` setting without database access on Edge runtime.
- **Dynamic Open Graph & Twitter Images** - Theme-aware preview cards for file embeds.
  - New `opengraph-image.tsx` (1200×630px) and `twitter-image.tsx` (1200×628px) dynamic image generators for file pages.
  - Displays Emberly wordmark, file type icon with label (🎬 Video, 🎵 Audio, 🖼️ Image, etc.), file name, file size.
  - Subtle radial gradient accents using primary theme color for branded appearance.
  - Font sizing responds to file name length for proper readability.
  - Colors extracted from site config theme in real-time.
- **Twitter Video Player Support** - Minimal HTML player iframe for Twitter video embeds.
  - New `/[userUrlId]/[filename]/player` route serving minimal HTML page with one `<video>` element.
  - Supports Twitter's `player` card type for interactive video embeds (requires HTTPS and domain whitelisting).
  - Access control identical to main file page (respects visibility, password protection, session auth).
  - Gracefully degrades on unwhitelisted domains — Twitter falls back to summary_large_image.
- **Embed Preview Dialog** - Dashboard component for previewing embeds on Discord and Twitter before sharing.
  - Shows file name, size, type badge, and thumbnail/media preview.
  - Separate Discord and Twitter/X preview tabs.
  - Demonstrates actual embed appearance including with/without rich embeds enabled.
  - Located in file card actions for quick preview of how files will appear when shared.
- **Perks Refresh API** - New `/api/profile/perks/refresh` endpoint to re-check perk eligibility in real-time.
  - Verifies Discord booster status against current guild membership.
  - Verifies GitHub contributor status against contribution history.
  - Handles linked account scenarios (missing tokens, unlinked accounts) gracefully.
  - Returns structured results with per-platform success/error status.
  - UI button in Profile → Perks tab allows users to manually trigger re-check.
- **Unified Glass Styling System** - Consolidated glassmorphism design language across all UI components.
  - New reusable `glass`, `glass-card`, `glass-subtle`, `glass-hover`, `gradient-border`, and `gradient-border-animated` CSS utility classes.
  - Applied to 30+ components: footer, leaderboard, legal article, partners, pricing tabs, FAQ, status page, profile cards, testimonials.
  - Consistent backdrop blur, border opacity, shadow patterns, and color gradients across site.
  - Improves visual cohesion and reduces code duplication in component-level GlassCard implementations.
- **Navigation Component Rewrite** - Refactored navigation into modular, maintainable `NavContent` component.
  - New `packages/components/layout/nav.tsx` with centralized route definitions.
  - Separated route logic from layout (base, dashboard, admin, extras) for easier maintenance.
  - Updated `base-nav.tsx` to consume `NavContent` as lightweight wrapper.
  - Desktop: centered dropdown pill with section icons and nested routes.
  - Mobile: sheet-based navigation with collapsible sections and auth footer.
  - Added role-based route filtering: superadmin-only routes hidden from admins, admin routes hidden from users.
  - Nexium and Leaderboard added to base routes.
- **User Banner Images** - Profile banner upload support added to user profiles.
  - New `banner String?` field on `User` model stored as a URL after upload.
  - `POST/DELETE /api/profile/banner` — upload and remove profile banner.
  - `GET /api/users/[id]/banner` — public banner endpoint for display on profiles.
  - Prisma migration: `20260330184144_add_user_banner_field`.
- **OAuth Social Link Auto-fill** - GitHub and Discord handles automatically populated when linking accounts.
  - After linking GitHub: `github` profile field auto-set to the linked GitHub login.
  - After linking Discord: `discord` profile field auto-set to the linked Discord username.
  - Eliminates the manual copy-paste step previously required after account linking.
- **User Reports & Bans System** - Community moderation with user-to-user reporting and admin ban management.
  - New `UserReport` model with `ReportCategory` enum (SPAM, HARASSMENT, INAPPROPRIATE_CONTENT, IMPERSONATION, ABUSE, OTHER) and `ReportStatus` enum (PENDING, REVIEWING, RESOLVED, DISMISSED).
  - New `UserBan` model recording ban records with issuer, type (temporary/permanent), expiry, and lift metadata.
  - `User` model extended with `bannedAt`, `banReason`, `banExpiresAt`, and `banType` fields.
  - Report button on public profiles — authenticated users can report others (cannot self-report); category selector, reason (10–500 chars), and optional details.
  - `POST /api/reports` — submit a report; unique constraint prevents duplicate reports between the same user pair.
  - `GET /api/reports/[id]` — reporter or admin can view a specific report.
  - `GET /api/admin/reports`, `PATCH /api/admin/reports/[id]` — admin lists and resolves reports with filterable status/category.
  - `POST/DELETE/GET /api/admin/users/[id]/ban` — ban and unban users; admins/superadmins cannot be banned.
  - Ban enforcement in NextAuth `authorize`: expired temporary bans auto-lift on login; active bans redirect to `AccountSuspended` error page.
  - Admin reports management page at `/admin/reports` with status filter tabs and user profile links.
  - Events fired: `moderation.user-reported`, `moderation.report-resolved`, `admin.user-banned`, `admin.user-unbanned`.
  - Prisma migration: `20260330224911_add_reports_bans_applications`.
- **Applications System** - Staff applications, partner applications, verification requests, and ban appeals.
  - New `Application` model with `ApplicationType` enum (STAFF, PARTNER, VERIFICATION, BAN_APPEAL) and `ApplicationStatus` enum (PENDING, REVIEWING, APPROVED, REJECTED, WITHDRAWN).
  - Public applications landing page at `/applications` with glass cards and "Apply" links per type.
  - Type-specific validated forms: Staff (role, why, experience, availability), Partner (website, description, audience, collaboration), Verification (reason, social links), Ban Appeal (reason, evidence).
  - `POST/GET /api/applications` — submit application and list own; duplicate PENDING/REVIEWING check prevents spam.
  - `DELETE /api/applications/[id]` — withdraw a PENDING application.
  - `GET /api/admin/applications`, `PATCH /api/admin/applications/[id]` — admin list by type/status and review (REVIEWING/APPROVED/REJECTED).
  - Approving a BAN_APPEAL application automatically unbans the user (clears all ban fields).
  - Admin applications management at `/admin/applications` with type/status filters and `/admin/applications/[id]` review page.
  - Events fired: `application.submitted`, `application.reviewed`.
- **Admin Discord Alert System** - Admin-only Discord webhook for moderation and system event notifications.
  - New `packages/lib/events/handlers/admin-discord.ts` with `registerAdminDiscordHandlers()`.
  - Posts to `DISCORD_WEBHOOK_URL` environment variable (distinct from per-user Discord webhook URLs).
  - Covers: user bans (🔨 red), unbans (✅ green), user reports (🚨 orange), new applications (📋 blue), testimonials submitted/edited (💬 blue), client errors (🐛 yellow), server crashes (💥 red).
  - Rich Discord embeds with color-coded severity, user details, and action context.
- **Client & Server Error Reporting** - Automatic error forwarding to admin Discord.
  - New public `POST /api/errors/report` endpoint accepting `{ message, url, stack?, type, userAgent? }`.
  - Error boundary (`app/error.tsx`) automatically POSTs on every client-side render failure via `useEffect`.
  - Stack traces capped at 2 000 chars; endpoint always returns `204 No Content` to avoid leaking details.
  - Events: `system.client-error` and `system.server-error` routed to admin Discord.
- **Testimonial Event Notifications** - Admin Discord notifications on testimonial activity.
  - `testimonial.submitted` event fired when a testimonial is created via `POST /api/testimonials`.
  - `testimonial.edited` event fired when a testimonial is updated via `PUT /api/testimonials`.
  - Admin receives rich embed with user info and content preview (first 100 characters).
- **Codebase Consolidation Library Suite** - 13 new shared library modules replacing scattered inline logic.
  - `packages/lib/generators/index.ts` — `generateUrlId()`, `generateShortCode()`, `generateUploadToken()`, and related ID/token utilities.
  - `packages/lib/pagination/index.ts` — `parsePaginationParams()` and `createPaginatedResponse()` standardizing all paginated API responses.
  - `packages/lib/users/lookup.ts` — `findUserByIdentifier()`, `emailIsTaken()`, `findUserByIdWithSelect()` for consistent user queries.
  - `packages/lib/users/service.ts` — `getUserProfile()`, `updateUserProfile()`, `USER_ADMIN_SELECT` constant for admin user views.
  - `packages/lib/validation/index.ts` — 50+ centralized Zod schemas organized by domain (auth, files, users, domains, billing).
  - `packages/lib/api/error-handler.ts` — `handleApiError()`, `withErrorHandling()` for consistent API error logging and responses.
  - `packages/lib/files/service.ts` — 14 file operation functions consolidating upload, update, and delete logic.
  - `packages/lib/domain/service.ts` — `isValidDomainName()`, `getDomainWithOwnership()`, Cloudflare integration helpers.
  - `packages/lib/auth/service.ts` — `generateSecureToken()`, `verify2FACode()`, `getBaseUrl()`, `parseVerificationCodes()`.
  - `packages/lib/notifications/index.ts` — unified `notify()` dispatching emails and Discord events through the event system.
  - `packages/lib/plans/index.ts` — `planAtLeast()`, `resolvePlanKey()`, plan tier constants for subscription feature gating.
  - `packages/lib/github/index.ts` — GitHub REST API client with typed interfaces for user, repository, and contribution data.
  - `packages/lib/events/audit-helper.ts` — `emitAuditEvent()`, `auditAdminAction()`, `auditSecurityEvent()`, `auditBillingEvent()` for structured audit trails.

- **Navigation Mobile Drawer** - Replaced right-side sheet with Apple-style bottom drawer for mobile navigation.
  - Sheet slides up from the bottom with `rounded-t-2xl` corners and capped at `85dvh`.
  - Glass backdrop (`bg-background/80 backdrop-blur-xl`) matching v2 design system.
  - Drag handle ("bezel") positioned at top of drawer — a visual pill indicator consistent with iOS bottom sheets.
  - Full drag-to-dismiss: pointer/touch events track drag distance and dismiss on 100px+ downward drag, otherwise snap back.
  - Section headers use `bg-primary/10` icon badges and `rounded-xl` pill buttons for v2 aesthetic.
  - Active nav items use `bg-primary/10 text-primary` styling instead of flat `bg-secondary` dividers.
  - Footer profile row shows avatar inline with name for quick profile access.
  - X close button hidden — bezel drag is the sole dismiss affordance.
- **ScrollIndicator Component** - New shared `packages/components/ui/scroll-indicator.tsx` for overflow-scrollable tab navs.
  - Detects horizontal overflow via `ResizeObserver` + scroll events.
  - Shows left/right fade gradient overlays + `ChevronLeft`/`ChevronRight` icons when content is scrollable in that direction.
  - `pointer-events-none` overlays so indicator doesn't interfere with scroll or tap.
  - Integrated into 4 tab-based components: profile settings, Nexium dashboard, PricingTabs, and admin settings manager.

### Changed
- **v2 Glass Design System Normalization** - Comprehensive site-wide audit and standardization of all card, surface, and container components.
  - `bg-background/80 backdrop-blur-lg border-border/50 shadow-sm` established as the single canonical surface standard.
  - `Card` component updated from `bg-card/80` to `bg-background/80` to match glass system opacity.
  - 30+ components migrated: file cards, shared file cards, file grid (search, filters, pagination, skeleton), URL list tables, URL form, verification codes panel, analytics overview, blog TOC, upload form, OCR dialog, appearance panel, referrals, and more.
  - `glass-subtle` class redefined from lighter `bg-muted/50` baseline to `bg-background/80 backdrop-blur-md` to match dark glass standard.
  - All remaining `bg-muted/30`, `bg-background/30`, `bg-background/50` surface patterns normalized to `bg-background/80`.
  - Hardcoded `dark:` overrides (e.g. `dark:bg-muted/20`, `dark:bg-black/5`) removed from dashboard components — theme-aware tokens handle both modes.
  - `border-white/[0.0x]` → `border-border/X` and `bg-white/[0.0x]` → `bg-muted/X` replacements throughout.
  - Profile settings sidebar, admin settings sidebar, and all section panels brought to v2 dark glass standard.
  - Empty state containers (testimonials, partners) normalized to `bg-background/80`.
- **Navigation Dropdowns** - All nav sections (Base, Dashboard, Administration, Extras) now use consistent 2-column grid layout.
  - All `DropdownMenuContent` now render with `min-w-72 p-1.5` and `grid grid-cols-2 gap-0.5` regardless of item count.
  - Previously only the Administration section (11 items) used the grid; smaller sections used single-column `min-w-40`.
  - Consistent visual treatment across all nav sections.
- **CheckoutButton Component** - Extended with styling props for contextual use.
  - Added `className`, `variant`, and `size` props — if omitted, falls back to previous `w-full` default.
  - Enables reuse in compact inline contexts without needing a wrapper override.
- **Verified Badge Purchase Button** - Restyled to visually match Configure dropdown buttons on other add-ons.
  - Previously rendered as full-width primary button; now uses `variant="outline" size="sm"` to match Configure buttons.
  - `bg-background/50` styling consistent with the rest of the add-on action row.

### Fixed
- **Broken Nexium Import Paths** - Corrected 24 API routes and lib files importing from non-existent `discovery` module paths post-rebrand.
  - `@/packages/lib/discovery` → `@/packages/lib/nexium` in 13 `app/api/discovery/**` route files.
  - `@/packages/types/dto/discovery` → `@/packages/types/dto/nexium` in 11 `app/api/discovery/**` route files.
  - Root cause: automated rebrand pass renamed source directories but also incorrectly rewrote internal import paths.
- **Build Errors — Duplicate Variable Declarations** - Fixed 8 duplicate `const user` and 1 duplicate `const response` blocking production build.
  - `profile/avatar`, `profile/bash`, `profile/flameshot`, `profile/sharex`, `profile/spectacle`: `requireAuth` returns `{ user }` then same block re-declared `const user` from a Prisma query — renamed DB result to `dbUser` and updated all field accesses.
  - `analytics/summary` and `analytics/export`: same `user` duplication pattern; `analytics/summary` also had duplicate `const response` — renamed result object to `result` throughout.
- **Build Error — Missing Module** - Fixed `contact/route.ts` importing from non-existent `@/packages/lib/notifications`.
  - Corrected to `@/packages/lib/events/utils/discord-webhook` which is the actual `notifyDiscord` export location.


  - Outline buttons now use glass styling with semi-transparent background (`bg-background/60 backdrop-blur-sm`).
  - Default button hover shadow increased and uses primary color tint for glow effect.
  - Active state changed to `scale-[0.97]` (down from `scale-95`) for subtler press feedback.
  - Border color on outline buttons refined to `border-white/[0.08]` for better contrast.
- **Card Component Styling** - Improved shadows, borders, and overall visual depth.
  - Card border-radius increased from `rounded-xl` to `rounded-2xl`.
  - Border color updated to `border-white/[0.08]` for consistency with modern design.
  - Added 2-part shadow system: inset subtle border + outer drop shadow.
  - Backdrop blur increased to `backdrop-blur-xl` for stronger glass effect.
  - Transition added for smooth state changes (`transition-all duration-300`).
- **Layout & Shell Components** - Simplified page headers and containers using unified glass styling.
  - `PageShell` component now uses `glass-card` class instead of inline backdrop styles.
  - Page title text updated to use `text-gradient` class for consistent gradient effect.
  - Removed redundant gradient overlay divs in favor of CSS utility approach.
  - Footer styling simplified from manual glass setup to `glass` + `gradient-border` classes.
- **Theme Customizer Changes** - UI improvements and system theme management removal.
  - Default theme switched from 'default-dark' to 'royal-purple' in config and theme context.
  - Removed `saveAsSystemTheme()` method and `onSaveSystemTheme` callback (admin-only feature archived).
  - Theme tabs layout refined with better class ordering consistency.
  - Advanced color picker UI tweaks for improved readability.
- **Partners Component Rewrite** - Simplified from complex animated carousel to responsive static grid.
  - Removed auto-scrolling carousel with pause/resume mechanics.
  - Replaced with simple 2-5 column responsive grid (2 on mobile, up to 5 on desktop).
  - Updated to static server component (removed client-side state management).
  - Hover effects simplified to subtle background and shadow changes.
  - Tooltip/expanded info removed in favor of simpler truncated name/tagline display.
- **FAQ Accordion Refactoring** - Consolidated multi-card layout to single unified FAQ section.
  - Changed from 2-column grid of individual GlassCards to single card with divided items.
  - Added divider lines between questions for better visual separation.
  - Improved padding and spacing for better mobile readability.
  - ChevronDown rotation transitions added for expand/collapse cues.
  - Answer text styling improved with `leading-relaxed` for better readability.
- **Leaderboard Component Updates** - Animation consolidation and glass styling migration.
  - Replaced individual Tailwind animations (fade-in, slide-in, zoom-in) with unified `animate-fade-up` class.
  - Removed `animate-float` duration overrides, now uses consistent animation timing.
  - Updated loading skeleton colors from `bg-muted` to `bg-primary/10` and `bg-primary/5` for consistency.
  - GlassCards updated to remove inline gradient overlays in favor of unified `glass` class.
  - Podium card borders changed from generic highlight to `gradient-border-animated` for top contributor.
  - Hover states improved with consistent `glass-hover` class application.
- **Status Page Components** - Unified styling and simplified color scheme.
  - Updated all inline glass styling to use `glass` utility class.
  - Component row backgrounds changed from `bg-background/30` to `bg-white/[0.03]` for subtler appearance.
  - Border colors refined to `border-white/[0.04]` across all component state levels.
  - Removed redundant gradient overlay divs.
- **Profile Notifications UI** - Enhanced Discord webhook configuration with better layout and validation.
  - Master toggle for Discord notifications now disabled when no webhook URL is set.
  - Webhook URL input has visual feedback during save/test operations.
  - Preference category switches disabled when master toggle is off.
  - Toast notifications for all save, test, and toggle operations.
  - Better label and description text for Discord notification features.
- **Email Template Updates** - Password reset link expiration changed from hours to minutes.
  - `PasswordResetEmail` component now shows expiration in `expiresInMinutes` (default 30) instead of `expiresInHours`.
  - Updated prop names for clarity: `expiresInHours` → `expiresInMinutes`.
  - Email template adjusted timeout display to use minutes for more precise user expectations.
- **Markdown Component Relocations** - Standardized documentation rendering paths.
  - `MarkdownRenderer` moved from `packages/components/docs/` to `packages/components/shared/`.
  - `LegalArticle.tsx` import updated to reference new location.
  - Shared status enables reuse across legal, blog, and documentation pages.
- **Public Profile Styling** - Reduced visual noise with glass-subtle styling for opportunity cards.
  - "How to Earn Perks" section updated to use `glass-subtle` background.
  - Contributor, Discord Booster, and Affiliate cards now use consistent `glass-subtle glass-hover` classes.
  - Removed explicit `bg-muted/30` and `hover:bg-muted/50` in favor of unified glass styling.
- **Login History Styling** - Updated background colors to match modern white/opacity scheme.
  - Recent login highlight changed from `border-primary/30 bg-primary/5` to better contrast `bg-white/[0.03]` base.
  - Older login entries updated to `border-white/[0.04] bg-white/[0.03]` instead of `border-border/50 bg-background/50`.
- **Auth Error Page** - Added `AccountSuspended` error state.
  - New case with user-friendly message: "Your account has been suspended. Contact support if you believe this is an error."
  - Zero admin details exposed — ban reason and issuer are never shown to the affected user.
- **Dashboard Navigation** - Added "Squads" link to dashboard navigation routes.
  - New `/dashboard/nexium` entry in `dashboardRoutes` using `Sparkles` icon, positioned after Analytics.
  - Provides direct access to Nexium squad management from the main dashboard menu.
- **Custom Domain Model** - Extended to support squad ownership alongside user ownership.
  - `userId` field changed from required `String` to optional `String?` to allow squad-only domains.
  - New `squadId String?` field with relation to `NexiumSquad` model.
  - Domain validation updated to accept domains owned by any squad the authenticated user is a member of.
- **Verification Codes Panel** - Glass styling consolidation and layout improvements.
  - Panel header refactored to use `overflow-hidden glass rounded-2xl` consistent with other cards.
  - Removed inline gradient overlay div (now handled by `glass` utility class).
  - Improved spacing and relative positioning for cleaner structure.
- **Profile Page Components** - Extensive glass styling migration and consistency improvements.
  - `GlassCard` wrapper component standardized to `rounded-2xl glass transition-all duration-300`.
  - Removed all inline `bg-white/10 dark:bg-black/10 backdrop-blur-xl` patterns in favor of utility classes.
  - Profile data explorer, testimonials, and shared file sections updated to use `glass` class.
  - Consistent `glass-subtle` styling for list items, input backgrounds, and secondary sections.
- **File Components** - Unified glass styling across file operations.
  - Collaborator manager buttons and content updated to `glass-subtle glass-hover` classes.
  - File actions buttons (copy, download, open raw, OCR, etc.) now use `glass-subtle glass-hover` classes.
  - Suggestion manager content sections updated with `glass-subtle` styling.
  - Code viewer tabs and preview areas now use `glass-subtle` class.
- **Form & Upload Components** - Improved styling for file transfer operations.
  - Upload form drag-and-drop zone updated with `bg-white/[0.03]` for better contrast.
  - File list items changed from `bg-white/10 dark:bg-black/10` to `glass-subtle` class.
  - Paste form tabs and preview sections updated to use `glass-subtle` styling.
  - Suggest edit form components receive `glass-subtle` treatment for consistency.
- **Pricing Components** - Comprehensive glass styling updates across pricing UI.
  - All GlassCard components in pricing pages now use simplified `glass` class.
  - Plan cards, add-on selectors, current plan cards updated with consistent styling.
  - FAQ accordion items use `glass-subtle` for better visual hierarchy.
  - Pricing tab headers updated to `glass` styling.
- **Legacy Component Removals** - Deleted unused documentation component library.
  - Removed `packages/components/docs/BlogToc.tsx` - blog table of contents component.
  - Removed `packages/components/docs/DocsAlert.tsx` - info/warning/danger alert variants.
  - Removed `packages/components/docs/DocsBrowser.tsx` - searchable docs listing UI.
  - Removed `packages/components/docs/DocsCard.tsx` - simple doc card wrapper.
  - Removed `packages/components/docs/DocsShell.tsx` - docs page shell layout.
  - Removed `packages/components/docs/DocsToc.tsx` - docs table of contents sidebar.
  - Removed `packages/components/docs/EndpointTable.tsx` - API endpoint listing table.
  - Removed `packages/components/docs/SubPageSelector.tsx` - doc category selector.
  - Moved `MarkdownRenderer` from `docs/` to `shared/` for reuse across site.
  - Removed `packages/components/docs/nav-links.ts` - hardcoded docs navigation routes.

### Fixed
- **Theme Management** - Fixed system-theme context to properly initialize with royal-purple default.
  - Default theme context now matches config default ('royal-purple' instead of 'default-dark').
  - Theme initialization logic consolidated to prevent mismatches between system and user preferences.
- **Custom Domain Lookup Edge Cases** - Improved error handling in proxy domain routing.
  - Added proper try-catch around domain lookup API calls.
  - Returns graceful fallback when lookup fails or domain not found.
  - Non-root paths on custom domains now skip rewrite and proceed with normal routing.
- **Profile Perks Refresh** - Fixed missing import of new perk utilities in profile component.
  - Added `getPerkDisplayInfo()` function import and usage in perk calculation logic.
  - Properly handles missing or empty perk roles without errors.

### Removed
- **ST5 Fan Hub System** - Removed ST5 (streaming show fan community hub) in preparation for feature sunset.
  - Deleted `packages/components/st5/Comments.tsx` - full comment system with replies, reactions, image attachments, spoiler tags.
  - Deleted `packages/components/st5/Countdown.tsx` - countdown timer to release dates with live status.
  - Deleted `packages/components/st5/Facts.tsx` - info cards, viewing tips, and cast/crew notes.
  - Removed Prisma models: `St5Comment`, `St5CommentReply`, `St5CommentReaction`, and `St5CommentAttachment` table.
  - Removed `/api/st5/*` API routes: `/comments`, `/comments/:id`, `/comments/:id/replies`, `/comments/:id/reactions`.
  - Removed `/st5` page and related ST5 navigation.
  - Removed ST5 routes from public middleware paths and auth exclusions.
  - Migration: `20260614000000_remove_docs_and_st5`.
- **Database-Backed Documentation System** - Removed DocPage model and related infrastructure.
  - Deleted `DocPage` Prisma model and associations.
  - Removed doc service (`packages/lib/docs/service.ts`) and doc loader (`packages/lib/docs/load-markdown.ts`).
  - Removed enums: `DocCategory` (API, MAIN, USERS, HOSTING, INTEGRATIONS, SECURITY, TROUBLESHOOTING, ADMINS).
  - Removed `DocStatus` enum (DRAFT, PUBLISHED, ARCHIVED).
  - Removed `/admin/docs` route and admin UI components.
  - Documentation now served from external docs site (docs.embrly.ca) with link in navigation.
  - Markdown fallback for legacy docs removed (external docs site is canonical).
- **System Theme Save Feature** - Removed admin capability to set system-wide default theme.
  - Deleted `onSaveSystemTheme` callback from theme context provider.
  - Removed `saveAsSystemTheme()` method from theme context.
  - Removed admin theme override API.
  - Only user theme customization now supported (stored in profile).

### Security
- **Discord Webhook URL Validation** - All Discord webhook URLs validated as proper HTTPS endpoints.
  - Zod schema ensures webhook URLs are valid URLs (not arbitrary strings).
  - Webhook URLs stored securely in database (plaintext but should be rotated if leaked).
  - Test endpoint validates webhook URL before sending to Discord.
- **Nexium Squad API Key Security** - Secure key generation and storage for squad integrations.
  - API keys generated with 24 cryptographically random bytes (`crypto.randomBytes`) encoded as base64url with `nsk_` prefix.
  - Keys stored as SHA-256 hashes only — full key returned once at creation time and never retrievable again.
  - Bearer token authentication checks squad upload token first, then hashes `nsk_` prefixed tokens against stored key hashes.
  - All squad management endpoints enforce ownership verification (owner-only for destructive operations).

### Technical
- **Configuration Defaults** - System now defaults to Royal Purple theme instead of Default Dark.
  - Updated `DEFAULT_CONFIG` in `packages/lib/config/index.ts` with Royal Purple color values.
  - Updated `DEFAULT_THEME_CONFIG` in `packages/lib/theme/theme-types.ts`.
  - Updated initial user theme in theme provider to match system default.
- **Prisma Migrations** - Several major migrations in this version.
  - `20260329120000_migrate_users_to_royal_purple` - Config defaults update (informational).
  - `20260330011308_add_discord_webhook_notification_preferences` - Discord fields on User model.
  - `20260330091056_add_nexium_tables` - 8 enums and 5 core Nexium tables (Profile, Skill, Signal, Opportunity, Application) with Squad and SquadMember.
  - `20260330135926_add_nexium_squad_billing_and_api_keys` - Squad billing fields (storageUsed, storageQuotaMB, uploadToken, stripeCustomerId), NexiumSquadSubscription, and NexiumSquadApiKey tables.
  - `20260330165324_unify_nexium_profile_with_user` - Linked `NexiumProfile` directly to `User` schema.
  - `20260330174227_add_nexium_active_hours` - Added Nexium active hours tracking field to `NexiumProfile`.
  - `20260330184144_add_user_banner_field` - Added `banner String?` field to `User` model.
  - `20260330224911_add_reports_bans_applications` - Added `UserBan`, `UserReport`, `Application` models; 4 new enums; ban fields on `User`.
  - `20260614000000_remove_docs_and_st5` - Removed DocPage and St5Comment models and relations.
- **Embed System Architecture** - Bot handler middleware + metadata builders for platform-specific embed strategy.
  - `packages/lib/middleware/bot-handler.ts`: Detects crawler/bot requests (Discord, Telegram, Twitter, Facebook, LinkedIn), fetches `enableRichEmbeds` setting via internal API, and conditionally redirects to `/raw` if disabled.
  - `packages/lib/embeds/metadata.ts`: Core module with `buildRichMetadata()`, `buildMinimalMetadata()` functions and metadata options interface.
  - `packages/lib/embeds/file-classification.ts`: MIME type classifier returning boolean flags (isVideo, isImage, isAudio, isMusic, isDocument, isCode, isText, other).
  - Dynamic image generators use Next.js `ImageResponse` API with theme color extraction via `getConfig()`.
  - Embed preview component at `packages/components/dashboard/file-card/embed-preview-dialog.tsx` for Discord/Twitter preview simulation.
  - `registerDiscordHandlers()` called during `registerAllHandlers()` in event initialization.
  - Discord handler listens for billing, security, auth, and account events.
  - Respects user preference gates before sending notifications.
- **Event System Expansion** - 10 new event types added to `EventTypeMap` across 4 new categories.
  - New event categories: `moderation`, `applications`, `testimonials`, `system`.
  - New events: `admin.user-banned`, `admin.user-unbanned`, `moderation.user-reported`, `moderation.report-resolved`, `application.submitted`, `application.reviewed`, `testimonial.submitted`, `testimonial.edited`, `system.client-error`, `system.server-error`.
  - `packages/lib/events/handlers/nexium.ts` — Nexium-specific event handler for squad and opportunity notifications.
  - Email templates added: `nexium-welcome.tsx`, `nexium-squad-invite.tsx`, `nexium-opportunity.tsx` in `packages/lib/emails/templates/`.
- **API Route Changes** - Removed `/admin/docs` endpoints, added new internal endpoint.
  - New: `POST /api/profile/discord-webhook/test` - test webhook URL.
  - New: `POST /api/profile/perks/refresh` - refresh perk status.
  - New: `GET /api/internal/domain-lookup` - lookup custom domain owner (internal use only).
  - New: 20+ Nexium API routes under `/api/nexium/` covering profiles, skills, signals, opportunities, applications, squads, squad tokens, squad keys, squad domains, squad quota, and squad ShareX config.
  - New: `POST /api/reports`, `GET /api/reports/[id]` - user report submission and view.
  - New: `GET /api/admin/reports`, `PATCH /api/admin/reports/[id]` - admin report management.
  - New: `POST/DELETE/GET /api/admin/users/[id]/ban` - user ban management.
  - New: `POST/GET /api/applications`, `DELETE /api/applications/[id]` - application lifecycle.
  - New: `GET /api/admin/applications`, `PATCH /api/admin/applications/[id]` - admin application review.
  - New: `POST /api/errors/report` - public client/server error ingestion.
  - New: `POST/DELETE /api/profile/banner` - user banner image upload and removal.
  - New: `GET /api/users/[id]/banner` - public banner image retrieval.
  - New: `GET /api/profile/avatar/linked` - linked account avatar endpoint.
- **Theme System: System Admin Themes & Hue-Based Colors** - Extended theme initialization with priority system and dynamic color generation.
  - `ThemeInitializer.tsx` enhanced with system theme support and fallback priority: User theme → System admin theme → Config default theme.
  - New `generateHueColors()` function creates 18-color palettes dynamically based on hue input (0-360°), maintaining destructive reds.
  - System themes support `hue:` prefix format (e.g., `hue:220` for blue theme) for programmatic generation.
  - Theme colors applied globally via `--color-*` CSS variables with hsl() values.
  - Falls back gracefully when colors missing: generates them on demand or uses config defaults.
- **Authentication Event Logging** - Audit trail integration for all login events.
  - New `'auth.login'` event emitted during successful credential/OAuth authentication.
  - Event captures: userId, email, method (credentials/oauth), success status, isNewDevice flag, and full login context.
  - Enables audit logs and security monitoring for account access patterns.
  - Non-blocking emission allows fast auth completion without waiting for event processing.
- **Auth Header Handling** - Improved OAuth callback parameter isolation.
  - Fixed GitHub and Discord OAuth callback handlers to extract `NEXT_PUBLIC_BASE_URL` from env (not request.url).
  - Prevents production OAuth redirects from inheriting localhost domains in development environments.
  - Ensures `redirect_uri` parameter consistency in OAuth flow.
- **Config Cache Optimization** - Reduced development cache TTL for faster iteration.
  - Development cache TTL reduced from 30 seconds to 5 seconds (production unchanged at 5 minutes).
  - Faster config updates during development without requiring server restart.
  - `CONFIG_TTL_SECONDS` and `SETUP_TTL_SECONDS` now use unified time constant.
- **File Classification System** - Complete MIME type categorization for embed strategies.
  - New `file-classification.ts` module exports `classifyMimeType()` function.
  - Returns object with boolean flags: `isVideo`, `isImage`, `isAudio`, `isMusic`, `isDocument`, `isCode`, `isText`, `other`.
  - Powers metadata builder strategy selection (different handling for videos vs images vs audio).
  - Covers 50+ common MIME types with sensible categorization.
- **File Access & Lookup Refactoring** - Modularized file access control and path resolution.
  - New `packages/lib/files/access.ts` with `checkFileAccess()` function validating visibility, password, and auth.
  - New `packages/lib/files/lookup.ts` with `findFileByUrlPath()` and `findFileBySha256()` for path-based and hash-based lookup.
  - Enables consistent access checking across file page, API routes, and middleware.
  - Supports public files, private files with password, private files requiring login.
- **Upload Validation Enhancements** - Squad domain and custom domain support in upload flows.
  - `validateSquadCustomDomain()` function validates domain ownership for squad uploads.
  - Squad upload flow checks domain membership via squad relationship.
  - `validateCustomDomain()` extended to check both user-owned and squad-owned domains.
  - Domain whitelist validation ensures files can only be uploaded to domains the uploader has permission for.
- **Storage Quota System** - Squad storage tracking and enforcement.
  - `packages/lib/storage/quota.ts` module with `checkSquadQuota()` and `updateSquadStorage()` functions.
  - Quota validation on file upload prevents exceeding squad's `storageQuotaMB` limit.
  - Storage used tracking in `NexiumSquad.storageUsed` (bytes).
  - Free tier default 5 GB quota sufficient for typical use cases.
- **Discord Event Handler** - Notification delivery system for Discord webhooks.
  - `packages/lib/events/handlers/discord.ts` with `registerDiscordHandlers()` function.
  - Listens to events: `billing.*`, `security.*`, `auth.*`, `account.*` matching user's Discord preferences.
  - Formats rich Discord embeds with event-specific colors, titles, and description text.
  - Webhook retry logic with exponential backoff for failed deliveries.
  - Event preference gating prevents unnecessary API calls when user has category disabled.
- **Discord Notification Preferences** - Utilities for preference validation and formatting.
  - `packages/lib/events/utils/discord-preferences.ts` with `validateDiscordPreferences()` Zod schema.
  - Preference categories: Security (2FA, suspicious logins), Account (email/password/profile changes), Billing (credit application, subscription changes), Marketing, Product Updates.
  - Default preferences: Security ON, Account/Billing ON, Marketing/Updates OFF (opt-in for promotional content).
  - Removed: All `/api/admin/docs` routes.
  - Removed: All `/api/st5` routes.

## [1.4.0] - 2026-01-04

### Added
- **Public User API Access** - Added `/api/users` to public paths for contribution stats visibility.
  - Public profiles can now display GitHub contribution statistics without authentication.
  - Ensures contribution data is accessible for public profile pages.
- **Custom Status Page System** - Comprehensive system status page powered by Instatus API integration.
  - New `/status` page displaying real-time service health, incidents, and maintenance windows.
  - TypeScript types for full Instatus API coverage (`packages/types/instatus.ts`): `StatusSummary`, `StatusComponent`, `Incident`, `Maintenance`, and related interfaces.
  - Instatus client library (`packages/lib/instatus/index.ts`) with public and authenticated API support.
  - Supports both public API (`/summary.json`, `/v2/components.json`) and authenticated API (`/v2/:page_id/...`) with Bearer token.
  - Environment variables: `INSTATUS_API_KEY`, `INSTATUS_PAGE_ID`, `INSTATUS_STATUS_URL` for configuration.
  - API routes: `/api/status`, `/api/status/components`, `/api/status/incidents`, `/api/status/maintenances`.
  - Status components: `StatusBadge`, `StatusIcon`, `StatusHeader`, `ComponentsList`, `ActiveIncidentsPanel`, `ActiveMaintenancesPanel`, `IncidentHistory`, `MaintenanceHistory`, `UptimeDisplay`, `StatusPageSkeleton`.
  - Tabbed interface organizing Components, Incidents, and Maintenances with count badges.
  - Glass-morphism styling consistent with rest of site using `GlassCard` components.
  - Expandable incident/maintenance cards showing update timelines with HTML message support.
  - Parent-child component hierarchy built dynamically from flat API responses using `group.id` references.
  - Auto-refresh capability with manual refresh button and last-updated timestamps.
  - Responsive design with mobile-optimized tab navigation.
- **Media Kit Generator Script** - Automated media kit generation for press and promotional use.
  - New `scripts/generate-media-kit.ts` script generates complete media kit zip file.
  - Run with `bun run media-kit` to generate `/public/emberly-media-kit.zip`.
  - Includes: logos (SVG, PNG), brand guidelines, color palette documentation, typography guide, promotional videos.
  - Auto-generates README, BRAND_GUIDELINES.md, COLOR_PALETTE.md, and TYPOGRAPHY.md documentation.
  - Copies all video assets from `/public/videos/` with technical specs and usage guidelines.
  - Creates downloadable zip using PowerShell (Windows) or native zip (Unix).
- **Promotional Videos in Media Kit** - Added video showcase section to press media kit page.
  - New Promotional Videos section in `/press/media-kit` page between Logo Assets and Color Palette.
  - Client-side `VideoPlayer` component with hydration-safe rendering to avoid SSR mismatches.
  - Videos display with native HTML5 controls, download buttons, and duration indicators.
  - Videos: `site-preview-ad.mp4` (interface overview), `uploading-ad.mp4` (upload flow demo).
- **Community Documentation** - Added open source contribution and conduct guidelines.
  - `CONTRIBUTING.md` with development setup, coding standards, commit conventions, and PR guidelines.
  - `CODE_OF_CONDUCT.md` based on Contributor Covenant 2.1 with enforcement guidelines.
  - Contact information updated to use correct domain (`hey@embrly.ca`, Discord invite link).

### Changed
- **Profile Dashboard Tab Navigation** - Migrated from select menu to proper icon-based tabs.
  - Replaced Select dropdown with horizontal TabsList component for better UX.
  - Added icons to all 10 profile tabs: Profile (User), Billing (CreditCard), Uploads (Upload), Security (Shield), Perks (Gift), Referrals (Users), Notifications (Bell), Appearance (Palette), Testimonials (MessageSquare), Data (Database).
  - Gradient glow effect behind tab container for visual depth.
  - Responsive design: icons only on mobile (`hidden sm:inline` for labels), full labels on larger screens.
  - Active tab styling with primary color highlight, subtle border, and shadow.
  - Glassmorphism tab container with backdrop blur and semi-transparent background.
- **Referrals Section Responsive Design** - Improved mobile experience for referral code creation.
  - Form input and "Create Code" button now stack vertically on mobile (`flex-col sm:flex-row`).
  - Button stretches to full width on mobile for better tap targets.
  - Code requirements text uses `break-words` to prevent overflow on narrow screens.
  - "How Billing Credits Work" sections have responsive padding (`p-3 sm:p-4`) and list margins (`ml-3 sm:ml-4`).
  - List items use `break-words` class for long text handling.
- **Markdown Table Rendering** - Added horizontal scrolling and improved table styling.
  - Tables wrapped in scrollable container with `overflow-x-auto` for mobile responsiveness.
  - Custom table header styling with subtle background color (`bg-white/5 dark:bg-black/10`).
  - Table headers use `whitespace-nowrap` to prevent awkward text breaking.
  - Consistent padding and border styling on all table cells.
  - Hover effect on table rows for better interactivity (`hover:bg-white/5`).
  - Negative margin with padding (`-mx-2 px-2`) allows tables to use full width while maintaining scroll container.
- **Environment Variable Consolidation** - Unified domain configuration to use existing `NEXT_PUBLIC_BASE_URL`.
  - Updated OAuth routes (GitHub and Discord) to use `NEXT_PUBLIC_BASE_URL` instead of deprecated `NEXT_PUBLIC_APP_URL`.
  - Changed fallback domain from `https://emberly.site` to `https://emberly.ca` across all authentication flows.
  - Updated root layout metadata base URL to ensure proper Open Graph and Twitter card generation.
  - Ensures consistent redirect URI configuration between OAuth initiation and callback handling.
- **GitHub Actions Build Workflow Simplified** - Removed unnecessary PostgreSQL service from CI.
  - Build workflow no longer spins up PostgreSQL container since `prisma generate` doesn't require a database connection.
  - Reduced CI complexity and build times by eliminating unused service dependency.
  - Workflow now: checkout → setup Node/Bun → install dependencies → prisma generate → build.
- **Security Section Responsive Design** - Enhanced mobile experience for login history and session management.
  - Login history header now stacks vertically on mobile (`flex-col sm:flex-row`) with proper gap spacing.
  - Action buttons (Refresh, Sign Out Everywhere) now stretch to full width on mobile (`flex-1 sm:flex-none`).
  - Current session card padding reduced on mobile (`p-3 sm:p-4`) with responsive text sizing (`text-xs sm:text-sm`).
  - Login entry cards feature smaller gaps on mobile (`gap-2 sm:gap-3`) and responsive padding (`p-1.5 sm:p-2`).
  - Device icons and metadata icons use `flex-shrink-0` to prevent squishing on narrow screens.
  - Added `break-all` for IP addresses and `break-words` for location text to prevent overflow.
- **Recovery Codes UI Overhaul** - Converted to modal-based display with improved accessibility.
  - Removed Card wrapper in favor of cleaner inline section layout matching other security components.
  - Recovery codes now display in a Dialog modal instead of inline expansion for better focus and security.
  - Modal features scrollable code list with `max-h-[50vh]` preventing viewport overflow on long lists.
  - Statistics grid improved with responsive layout: 2 columns on mobile, 4 columns on desktop (`grid-cols-2 sm:grid-cols-4`).
  - Text sizes scale appropriately: `text-xs sm:text-sm` for labels, `text-xl sm:text-2xl` for stats.
  - Action buttons (View Codes, Regenerate Codes) stack vertically on mobile with full width.
  - Modal action buttons (Download as File, Copy All Codes) use default size instead of small for better tap targets.
  - Code display cards feature `break-all` on code text to handle long strings gracefully.
  - Warning banners and important notices use responsive text sizing for readability.
- **GitHub Contributions API Optimization** - Improved reliability and performance of contribution statistics.
  - Reduced commits fetched per repository from 10 to 5 to avoid GitHub API rate limiting.
  - Added individual try-catch blocks around commit detail fetches to prevent single failures from breaking entire stats.
  - Improved error handling with specific error logging per commit and repository.
  - Stats calculation (additions, deletions, files changed) now properly accumulates even with partial failures.
- **Press Pages Theme Compatibility** - Fixed hardcoded colors to respect active theme.
  - Press page hero section now uses theme variables (`text-foreground`, `text-primary`) instead of hardcoded colors.
  - Media kit color palette dynamically pulls from CSS variables to display actual theme colors.
  - Color swatches show live theme values with proper hex code extraction from computed styles.

### Fixed
- **Rich Embeds Metadata System** - Fixed inconsistent behavior where `enableRichEmbeds` setting was not respected for all file types.
  - **Images now respect `enableRichEmbeds=false`**: Previously images always showed preview regardless of setting; now returns minimal metadata with no image preview.
  - **Videos now respect `enableRichEmbeds=false`**: Previously videos still generated video metadata; now returns minimal metadata with no media.
  - **Middleware now checks user settings**: Updated `bot-handler.ts` to query user's `enableRichEmbeds` setting from database before redirecting bot requests.
  - **No embed metadata when disabled**: When rich embeds are disabled, `buildMinimalMetadata()` returns pure metadata with NO `openGraph` or `twitter` card data, ensuring Discord/Twitter show plain links without any embed cards.
  - **Videos work properly when enabled**: When `enableRichEmbeds=true`, videos use raw URL directly so Discord/Twitter can extract their own thumbnail and play the video inline.
  - Bot request handling: For non-video files with rich embeds disabled, middleware redirects to `/raw` so bots get the file directly; for videos, redirects to `/raw` only when embeds disabled.
  - Root cause: Middleware was unconditionally redirecting image bot requests to `/raw` before metadata evaluation, and metadata builders were still generating embed tags even when disabled.
- **Authentication System Domain Configuration** - Resolved production OAuth redirects incorrectly using `https://localhost:3000`.
  - Fixed all OAuth callback routes (GitHub and Discord) to use `NEXT_PUBLIC_BASE_URL` environment variable.
  - Updated proxy middleware redirects (alpha migration, email verification, password breach, login, admin authorization) to respect configured base URL.
  - Fixed auth library email notification URLs (new login alerts) to use correct production domain.
  - Replaced 18 instances of `new URL('/path', request.url)` pattern which preserved incoming request's protocol/host.
  - All auth redirects now use: `const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://embrly.ca'`.
  - Ensures OAuth success/error redirects, middleware security checks, and email links all use correct production domain.
  - Root cause: Using `request.url` as base URL caused redirects to inherit the request's domain, including localhost in development.
- **Static Asset Loading Issues** - Resolved CSS and JavaScript not loading for some users.
  - Updated middleware matcher to explicitly exclude all static asset types from authentication checks.
  - Added exclusions for: CSS files (`.css`), JavaScript (`.js`), font files (`.woff`, `.woff2`, `.ttf`, `.otf`).
  - Included `_next/webpack-hmr` exclusion for hot module replacement during development.
  - Prevents middleware from intercepting and potentially blocking critical static resources.
  - Root cause: Middleware regex was not comprehensive enough, causing some users to experience missing styles.
- **Theme Effects Hydration Mismatch** - Fixed React hydration errors caused by browser extensions injecting elements.
  - Created `ThemeEffectsContainer` client component that renders nothing on server and only creates the container div after hydration.
  - Replaced static `<div id="theme-effects-root">` in layout with client-only `<ThemeEffectsContainer />`.
  - Updated `Snowfall` component to track mount state and only render canvas after client hydration.
  - Prevents browser extensions (like Dark Reader) from causing mismatches by injecting elements into server-rendered divs.
  - Root cause: Server rendered empty div, but browser extensions injected `<link>` or `<style>` elements before React hydrated.
- **Root Layout Theme Configuration** - Fixed `InvalidCharacterError` when theme config object was passed to HTML attribute.
  - Added `typeof` guards to ensure only string values are passed to theme-related attributes.
  - Prevents `[object Object]` from being passed when config returns an object instead of a string.
  - Applies to `config.settings.appearance.theme` and `config.settings.appearance.systemThemes` values.

## [1.3.0] - 2025-12-29

### Added
- **Enhanced Public Profile System** - Comprehensive user profile pages with GitHub integration and milestone-based perk displays.
  - Tab-based interface with Overview, Contributions, and Files sections for organized content presentation.
  - Milestone tier system display: Bronze (🥉), Silver (🥈), Gold (🥇), Platinum (💎), and Diamond (💠) badges for contributors and Discord boosters.
  - Real-time contribution stats fetched from GitHub API showing lines of code, repository activity, and commit history.
  - Public files showcase displaying user's shared files with view counts, download stats, and upload dates.
  - Social account badges: Discord username badge with themed styling, GitHub profile link with external indicator.
  - Perk benefits breakdown showing tier-specific storage bonuses and custom domain slot allocations.
  - "How to Earn Perks" section guiding users on becoming contributors, Discord boosters, or affiliates.
- **GitHub Contributions API** (`/api/users/[id]/contributions`) - Detailed contribution metrics and activity tracking.
  - Fetches total lines of code contributed across EmberlyOSS repositories.
  - Lists contributed repositories with name, description, programming language, and star count.
  - Retrieves up to 10 most recent commits with SHA, message, date, and repository name.
  - Collects commit statistics: files changed, lines added (green), lines deleted (red).
  - Aggregates total contribution stats: cumulative files changed, additions, deletions, and repository count.
  - Uses GitHub PAT for public profile viewing to avoid rate limiting and token exposure.
- **Public Files API** (`/api/users/[id]/public-files`) - Public file listing endpoint.
  - Queries user's public files (visibility: 'PUBLIC') with comprehensive metadata.
  - Returns file details: name, URL path, MIME type, size, view count, download count, upload date.
  - Limits results to 20 most recent files ordered by upload date descending.
  - Generates full URLs for direct file access.
- **Dashboard Profile Query Parameters** - URL-based tab navigation support.
  - Added `?tab=` query parameter support to profile settings page (e.g., `/me?tab=security`).
  - Tab state syncs with URL using `window.history.pushState` for shareable links.
  - Initial tab selection reads from URL on page load with validation against available tabs.
  - Works with both tabs component and select menu for consistent navigation experience.

### Changed
- **Public Profile Architecture Refactored** - Switched from API-based to direct database access.
  - Removed intermediate API route calls in favor of server-side Prisma queries for better performance.
  - Updated to use Next.js 15 async params pattern (`await params`) throughout dynamic routes.
  - Implemented GlassCard component pattern for visual consistency across profile sections.
  - Consolidated perk calculation logic in server components to reduce client-side processing.
- **Perk Display System Enhanced** - Accurate milestone-based benefit visualization.
  - Updated to display actual tier names (Bronze/Silver/Gold/Platinum/Diamond) instead of generic labels.
  - Contribution statistics now show precise lines of code count with locale formatting.
  - Discord booster duration displayed in months with proper pluralization.
  - Storage and domain bonuses calculated from milestone constants with tier-specific values.
  - Added visual tier icons for quick recognition of achievement levels.
- **API Route Organization** - Consolidated dynamic routes under consistent parameter naming.
  - Moved contribution and file endpoints from `/api/users/[username]/` to `/api/users/[id]/` to avoid route conflicts.
  - Renamed files endpoint to `public-files` to prevent collision with existing `/api/users/[id]/files/[fileId]/` route.
  - Updated routes to accept id, urlId, vanityId, or username for flexible user lookup.
  - Frontend updated to use `user.id` for API calls ensuring consistent identifier usage.
- **GitHub Integration Display** - Rich commit history and repository contribution visualization.
  - Contributions tab now shows detailed commit cards with truncated SHA hashes and clickable links.
  - Added color-coded statistics: green for additions, red for deletions, blue for files changed.
  - Repository cards display with hover effects and external link indicators.
  - Commit metadata includes repository name, file count, line changes, and formatted dates.

### Fixed
- **Next.js 15 Compatibility Issues** - Resolved dynamic route parameter handling errors.
  - Fixed "params is a Promise" errors by properly awaiting params in all dynamic route handlers.
  - Removed invalid `fetch` cache options causing build-time errors.
  - Updated API route type definitions to use `Promise<{ id: string }>` parameter types.
- **Prisma Schema Field Errors** - Corrected field name mismatches across queries.
  - Fixed `accounts` field references to use correct `linkedAccounts` relation name.
  - Updated `username` field access to use `providerUsername` from LinkedAccount model.
  - Corrected provider account data structure queries for GitHub and Discord integrations.
- **Dynamic Route Naming Conflicts** - Resolved slug parameter conflicts in API routes.
  - Eliminated "You cannot use different slug names for the same dynamic path" error.
  - Standardized on `[id]` parameter naming throughout `/api/users/` route hierarchy.
  - Prevented route collision between user files endpoint and existing file management routes.
- **Public Profile 404 Errors** - Fixed routing and data fetching issues.
  - Resolved profile not found errors by ensuring proper user lookup across urlId, vanityId, and name fields.
  - Added `isProfilePublic: true` filter to all public profile queries for privacy enforcement.
  - Implemented proper null handling and not-found redirects for non-existent or private profiles.

## [1.2.0] - 2025-12-29

### Added
- **2FA Recovery Codes System** - One-time backup codes for account recovery if authenticator is lost.
  - Generate 10 recovery codes when enabling 2FA, displayed only once to the user.
  - Codes stored in database with used/unused tracking and timestamps.
  - Users can regenerate codes anytime to invalidate old ones and create new ones.
  - Recovery codes work as valid 2FA authentication alongside TOTP codes.
  - **Enhanced Recovery Codes UI** - Beautiful glass-morphism design with individual copy buttons, copy-all functionality, and download as text file.
  - **View Codes Anytime** - "View Codes" button allows users to fetch and display all unused recovery codes on demand (not just after generation).
  - Individual code copy buttons with visual feedback (checkmark animation on copy).
  - Numbered code list with monospace font, hover effects, and responsive layout.
  - Prominent download and copy-all action buttons side-by-side.
  - Session storage persistence for recently generated codes (cleared on browser close).
  - Visual status dashboard showing total codes, used codes, and remaining codes with count badges.
  - Warning indicators when only 3 or fewer codes remain.
  - Automatic invalidation of all codes when 2FA is disabled.
  - New `TwoFactorRecoveryCode` model with batchId for tracking code generations.
  - `/api/profile/2fa/recovery-codes` endpoints for status, regeneration, and download with optional `?includeCodes=true` parameter to fetch unused codes.
  - `RecoveryCodesManager` component in security settings to manage codes.
  - `getUnusedRecoveryCodes()` utility function to retrieve all unused recovery codes for a user.
- Environment configuration template (`.env.template`) with clear placeholder values, helpful comments, and format examples for all required environment variables.
- Complete two-factor authentication (2FA) system using TOTP (Time-based One-Time Password) with authenticator app support.
  - New `TwoFactorForm` component for secure 6-digit authenticator code entry with real-time validation.
  - 2FA enforcement in NextAuth credentials provider: users with `twoFactorEnabled` must enter a valid authenticator code before login succeeds.
  - Added `twoFactorEnabled` and `twoFactorSecret` fields to JWT and session interfaces for persistent 2FA state tracking.
  - Proper error-based 2FA flow: throws `TwoFactorRequired` error when 2FA is enabled but code not provided, forcing frontend to show 2FA form.
  - Support for both password and magic link authentication paths with identical 2FA enforcement.
- Comprehensive metadata coverage across all pages:
  - Added metadata exports to home page using `buildSiteMetadata()` for dynamic OG/Twitter image generation.
  - Added metadata to all admin pages: User Management, Platform Settings, Blog Management, Products, Docs Management, Legal Pages, Partner Management, Testimonial Management, Audit Logs, and Email Broadcasts.
  - All metadata uses consistent `buildPageMetadata()` helper with title and description for SEO and social previews.
- GitHub/Discord account linking system for social authentication and perk system integration.
  - OAuth endpoints for GitHub (`/api/auth/link/github`) and Discord (`/api/auth/link/discord`) account linking.
  - Automatic contributor detection: users with 1000+ lines of code across EmberlyOSS repos get +1GB storage per 1000 LOC.
  - Automatic Discord booster detection: server boosters get +5GB storage + 1 custom domain slot.
  - LinkedAccount model to store OAuth connections with access tokens and provider metadata.
  - Perk utilities for calculating storage/domain bonuses and managing contributor levels.
- Cross-domain session sharing via Redis for seamless login across multiple domains.
  - Switched from JWT to database session strategy using Redis adapter.
  - Sessions now shared between `emberly.site` and `embrly.ca` domains automatically.
  - Users log in on one domain and are authenticated on both.
- Enhanced login history tracking with complete device and IP information.
  - Captures client IP address with support for Vercel, Cloudflare, and standard x-forwarded-for headers.
  - Stores user agent, device fingerprint, country, and city for each login.
  - Displays parsed device type (Desktop/Mobile/Tablet), browser, and OS in security dashboard.
  - Device icons and detailed geographic information shown in login history.
  - New device detection triggers automatic email alerts for suspicious logins.
- **Billing Credits & Transaction Logging System** - Comprehensive credit tracking for audit trail and financial transparency.
  - New `CreditTransaction` Prisma model with userId, type, amount, description, and related metadata fields.
  - Transaction logging for all credit operations: referral earnings, credit applications, manual adjustments, and refunds.
  - `/api/profile/billing-history` endpoint for retrieving credit transaction history with graceful error handling.
  - `BillingCreditsSection` component in user profile displaying current balance, Stripe customer balance, and recent transaction activity.
  - Transaction metadata includes relatedUserId for referral tracking and relatedOrderId for purchase attribution.
  - Automatic transaction logging when credits are applied to Stripe customer balance during checkout.
- **Custom Referral Codes System** - User-friendly referral code creation replacing auto-generated codes.
  - Users can create custom, memorable referral codes (3-30 characters, alphanumeric with hyphens/underscores).
  - Custom code form in profile with real-time validation feedback.
  - Validation prevents reserved words (admin, api, auth, dashboard, settings, profile, billing, null).
  - Brand name protection blocks referral codes containing trademarked terms (emberly, pixelated, codemeapixel).
  - Case-insensitive substring matching ensures brand variations cannot bypass restrictions.
  - `/api/profile/referrals` POST endpoint supports creating custom codes with comprehensive validation.
  - Two-state referral component: creation form when no code exists, full statistics and sharing options when code is active.
- **Enhanced Payment Routes with Centralized Stripe Utilities** - Consolidated payment processing infrastructure.
  - All payment routes (`/api/payments/portal`, `/api/payments/webhook`, `/api/payments/checkout`, `/api/payments/purchase`) refactored to use centralized utilities.
  - `ensureStripeCustomer()` utility validates and creates Stripe customer IDs consistently across all payment flows.
  - `applyReferralCreditsToStripe()` utility manages credit application and transaction logging with metadata tracking.
  - Webhook handler enhanced with credit transaction logging for purchase completion events.
  - Checkout and purchase routes now include order metadata for credit transaction attribution.

### Changed
- Metadata system significantly refactored and simplified:
  - Consolidated metadata building from ~400+ lines across multiple helper functions into streamlined `buildRichMetadata()`, `buildSiteMetadata()`, and `buildPageMetadata()` functions.
  - Removed 150+ lines of unnecessary helper functions (`buildOpenGraphImages`, `buildOpenGraphAudio`, `buildTwitterMetadata`, `buildOtherMetadata`).
  - Removed hardcoded image references in favor of Next.js auto-detection of `opengraph-image.tsx` and `twitter-image.tsx`.
  - Improved URL handling using URL constructor instead of manual string manipulation.
  - `enableRichEmbeds` setting now properly enforced: disables rich metadata for both images and videos, returning minimal metadata instead.
  - Password-protected files now return minimal metadata to prevent embedding sensitive content in social previews.
  - Added strict `fileId` validation requirement for rich metadata generation to ensure thumbnail URLs are available.
- Login form updated to detect 2FA requirement and display `TwoFactorForm` component:
  - Stores pending credentials during 2FA verification flow.
  - Clear error messaging for invalid authenticator codes.
  - "Back to login" button allows users to restart authentication flow.
- Dashboard metadata conflicts resolved:
  - Removed redundant metadata definitions from `dashboard/layout.tsx` and `pricing/layout.tsx`.
  - Each dashboard page now defines its own specific metadata with unique titles and descriptions.
  - Applied `buildPageMetadata()` consistently across all dashboard pages.
- Short URL layout metadata cleaned up:
  - Removed 30+ lines of verbose metadata with explicit null/empty field definitions.
  - Simplified to only include essential `robots: { index: false, follow: false }` to prevent search engine indexing.
- OG/Twitter image generation updated to use actual Emberly logo instead of placeholder.
  - Logo now renders with dynamic colors based on selected theme.
  - Proper two-color flame icon design applied to social media previews.
- Storage quota system now includes perk bonuses.
  - Domain slot calculation includes Discord booster +1 domain bonus.
  - Storage quota calculation includes contributor and booster storage bonuses.
  - Perk bonuses stack additively for users with multiple perk roles.
- README updated to clearly establish this as the Emberly Cloud instance:
  - Added tech stack documentation (Next.js 14, TypeScript, PostgreSQL, Prisma, NextAuth.js, Tailwind CSS, shadcn/ui).
  - Clarified distinction between this cloud-hosted repository and the upcoming self-hosted open-source distribution.
  - Included cloud-specific features (Stripe billing, Resend email, analytics, 2FA).
  - Added development setup instructions.

### Fixed
- Critical 2FA enforcement vulnerability: users with 2FA enabled were able to bypass authentication without entering an authenticator code.
  - Root cause: NextAuth's `authorize` function was returning user objects on password validation, which NextAuth interprets as successful authentication regardless of 2FA status.
  - Solution: Changed to throw `Error('TwoFactorRequired')` when 2FA is enabled but code is missing, properly failing authentication and forcing 2FA prompt on frontend.
- **Recovery Codes Manager Component Fixes**:
  - Fixed missing icon exports (`download` and `refresh`) in `Icons` component causing "undefined component" runtime errors.
  - Fixed password requirement for recovery code regeneration - now optional for authenticated users since they're already verified.
  - Fixed API response parsing to handle `{ data, success }` wrapper format from `apiResponse()` helper.
  - Fixed `.length` TypeError by properly unwrapping API responses and providing safe fallbacks for `newCodes` array.
- EmberlyIcon component now respects all theme modes including individual hue selections.
  - Updated to use Tailwind `fill-foreground` and `fill-primary` classes instead of inline CSS variables.
  - Icon properly displays with custom theme colors set via the theme customizer.
- Login tracking IP address and device information now properly captured and stored.
  - Updated proxy middleware to extract client IP from multiple header sources with proper fallback handling.
  - Login context (IP, UserAgent, Geo) now passed through to NextAuth callbacks via global context store.
- Metadata loading inconsistencies for Twitter and Open Graph embeds:
  - Simplified fallback chains reduced failure points.
  - Fixed `enableRichEmbeds` being ignored for some file types.
  - Improved validation to prevent undefined/null values in metadata generation.
  - Protected files no longer expose metadata that could reveal sensitive information in social previews.
- Metadata coverage gaps:
  - All public and admin pages now have explicit metadata exports, ensuring consistent SEO and social preview handling.
  - Removed metadata configuration fragmentation across layouts and pages.
- Metadata inheritance override issue: `(main)` layout's `generateMetadata()` was incorrectly overriding child page metadata.
  - Root cause: Next.js layout metadata exports take precedence over child page metadata, causing pages like `/about` to display incorrect metadata.
  - Solution: Removed dynamic `generateMetadata()` from `(main)` layout, allowing each page to properly define its own metadata without interference.

## [1.1.0] - 2025-12-27

### Added
- Dynamic Open Graph and Twitter card images (`opengraph-image.tsx`, `twitter-image.tsx`) using Next.js ImageResponse API with Hawkins Neon theme styling, Emberly branding, and feature pills.
- Current plan banner on pricing page: dedicated `CurrentPlanBanner` component displaying the user's active plan prominently above the plans grid with plan details, feature preview pills, and "Manage Billing" link.
- CORS headers and `OPTIONS`/`HEAD` handlers added to raw file route (`/[userUrlId]/[filename]/raw`) for Discord and Twitter video embed compatibility.
- Video metadata tags: explicit `og:video`, `og:video:secure_url`, `og:video:type`, `og:video:width`, and `og:video:height` meta tags in `buildOtherMetadata` for proper video embeds on social platforms.

### Changed
- Pricing page tabs restyled: `TabsList` and billing cycle toggle now share consistent glass-morphism styling (`bg-muted/50 rounded-xl`) with matching active states (`bg-primary text-primary-foreground`).
- Plans grid refactored: current plan is now separated from the upgrade options grid; remaining plans display under an "Upgrade your plan" section header.
- `PlanSection` component restructured into smaller components (`CurrentPlanBanner`, `PlanCard`) for cleaner code organization.
- Video thumbnail route updated to handle video files by redirecting to a placeholder or generating appropriate thumbnails.
- Bot handler logic clarified for video content type detection and metadata delivery.

### Fixed
- Magic link authentication session loading: fixed `sessionVersion` mismatch where the stale value was used instead of the incremented value from `prisma.user.update()`, causing immediate session invalidation after login.
- Middleware constants: fixed typo in `PUBLIC_PATHS` array that could cause incorrect path matching.
- Pricing tabs `RovingFocusGroupItem` error: restored `TabsList` wrapper around `TabsTrigger` components to satisfy Radix UI's accessibility context requirements.

## [1.0.0] - 2025-12-26

### Added
- Commitlint for enforcing some sort of standard with commit messages.
- Server-side 2FA endpoints: `GET/POST/DELETE /api/profile/2fa` generating TOTP secrets and QR data (uses `otplib` + `qrcode`), plus client-friendly payloads.
- Client 2FA flows: full enable flow (QR + code confirmation) and a new multi-step disable flow (warning → code → password → confirm → disable).
- DB migration: `User` fields `twoFactorEnabled` and `twoFactorSecret` added and migrated locally to persist per-user 2FA state.
- Appearance and theming: per-user `theme` persisted via `PUT /api/profile`, `ThemeInitializer` ensures `data-theme` on `<html>` pre-hydration for consistent previews and Snowfall activation.
- Snowfall: site-wide falling-snow visual component added and wired to theme detection so it activates for Christmas/Holly themes.
- Docs now render through `MarkdownRenderer` (Getting Started, API, Custom Domains, User Guide, ShareX, Flameshot) for consistent anchors, code fence styling, and link handling across docs/blog.
- Dashboard file grid UX: filters wrap and size correctly on mobile (full-width stack, tighter gaps), and the desktop search now starts collapsed and toggles open/closed via a search button for better readability.
- Transactional email system wired for outbound product comms and notifications (Resend-backed) with templated delivery.
- Database-backed documentation: new `DocPage` model + admin UI (create/edit/publish/sort), published/draft visibility, and an `INTEGRATIONS` doc category.
- Docs browsing UX: `DocsShell`/`DocsBrowser` with category tabs, search, pagination, last-updated metadata, and a clear "Read" CTA on cards; markdown fallbacks remain for unpublished docs.
- Admin CMS tools: blog manager with Markdown editor/preview, post table, and helper copy; docs manager with category/status controls; refreshed partners/testimonials admin lists.
- Product/pricing system: product CRUD APIs (`/api/products` + catalog endpoints), pricing helpers for plans/add-ons, admin product manager, add-on selector, FAQ, donations tab, custom pricing CTA, and current-plan display.
- Markdown source docs added for hosting/users/main (API, custom domains, getting started, architecture, user guides) to back the new docs system.
- Legal hub refreshed with glassmorphic cards and alert callout; legal pages continue to render via the catch-all DB route.
- Paste collaboration system: `FileCollaborator` and `FileEditSuggestion` Prisma models for multi-user paste editing with owner-approved suggestions.
- Paste sharing UI: `allowSuggestions` toggle in paste creation form allowing owners to enable edit suggestions from other users.
- "Shared with Me" dashboard section: lists pastes where the current user is a collaborator with pending suggestion badges.
- Collaborator and suggestion management APIs: `/api/files/[id]/collaborators`, `/api/files/[id]/suggestions`, `/api/files/shared`, `/api/files/suggestions/pending`.
- Redis caching infrastructure: new cache modules (`upload-cache`, `config-cache`, `session-cache`, `rate-limit`, `general-cache`) to offload transient data from Prisma/filesystem.
- Upload metadata caching: chunked upload metadata now stored in Redis (with filesystem fallback) for faster multi-instance coordination.
- Session and user lookup caching: Redis-backed caching for auth lookups with automatic invalidation on profile changes.
- Rate limiting: Redis-based sliding-window and fixed-window rate limiters applied to registration and contact endpoints.
- OCR safeguards: configurable `OCR_MAX_QUEUE_LENGTH` and `MAX_OCR_FILE_SIZE` environment variables to prevent memory exhaustion.
- Page metadata: added `buildPageMetadata` exports to auth pages (login, register, forgot, reset), changelogs, blog listing, and created wrapper layouts for client-only pages (verify-email, alpha-migration, setup); added `generateMetadata` to dynamic routes (`blog/[slug]`, `legal/[...slug]`) for proper SEO.

### Changed
- Server-side password verification when disabling 2FA: DELETE `/api/profile/2fa` now requires account password and verifies with `bcrypt.compare` before clearing 2FA.
- Client robustness fixes: include credentials on profile/2fa fetches, unwrap API response envelope (`payload.data ?? payload`), visible fetch errors and debug logs to surface failures.
- Navigation & UI tweaks: `BaseNav` avatar now links to `/me` to match `UserNav`, mobile sheet trigger/footers improved, and modal z-index/overflow fixes.
- Navigation dropdown chevrons now animate/rotate on desktop for both base and dashboard navs.
- Pricing page restructured into tabs (plans, add-ons, donations, FAQ) with billing toggle and expandable plan details.
- Documentation pages now resolve from the database first and fall back to markdown; category routing and slug inference updated for integrations.
- Updated knip configuration (incorrect entrypoints).
- Updated husky configs and lint-staged.
- Legal routing now uses only `/legal/[...slug]` backed by the database (markdown fallback removed; legacy individual legal routes deleted); legal content expanded across all policies (Terms, Privacy, Cookies, Security, AUP, Accessibility, SLA, Refund, GDPR, DMCA) and contact points standardized to email.
- Event worker defaults reduced: batch size lowered to 3–5 and concurrency to 1 to reduce DB/memory pressure.
- Event handler execution changed from parallel `Promise.all` to sequential processing to prevent spikes.
- `getScheduledEvents` now enforces a `take` limit (default 100) to prevent unbounded result sets.
- Config and setup status lookups now use Redis cache with short TTL and in-memory fallback.
- **UI overhaul**: site-wide glass-morphism styling applied across all dashboard pages, cards, panels, and components (`bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 dark:border-white/10`).
- Dashboard components restyled: `SharedFileCard`, `VerificationCodesPanel`, `DataExplorer`, `ProfileAppearance`, file grid cards, URLs page, Upload page, Domains page, and Paste pages all updated with consistent glass aesthetic.
- Changelog repo filter: replaced native `<select>` element with the site's `Select` component for visual consistency.
- Themed logo component (`Icons.logo`) verified as the standard across all pages and components; press pages intentionally use static images for media downloads.
- 2FA QR code rendering switched from server-side `qrcode` to client-side `QRCodeSVG` (`qrcode.react`) to eliminate `Buffer()` deprecation warning; QR container now has white background for theme compatibility with centered Emberly logo overlay.
- Domains page completely redesigned: stats cards showing total/verified/pending counts, Cloudflare recommendation banner (dismissible), collapsible domain rows with inline DNS configuration display, and improved empty states.

### Fixed
- Fixed broken JSX/parse error in `components/profile/security/profile-security.tsx` and restored a working client component.
- Fixed disable-modal not opening (modal nesting and button `type` issues resolved) and added a visible click debug counter during troubleshooting.
- Resolved "Loading QR…" / 2FA state mismatch by fetching secrets at the correct lifecycle point and adding an initial `Checking 2FA…` UI while profile loads.
- Exposed `updateProfile()` from profile hook to resolve `updateProfile is not a function` runtime error.
- Defensive guards and runtime checks added across profile/settings pages to prevent TypeErrors (e.g., safe access of `quotas`).
- Metadata robustness: Next metadata generation now validates inputs/base URLs, falls back to minimal metadata when data is missing/invalid, and avoids serialization crashes for embeds/OG cards.
- Video delivery: local storage provider routes video extensions (mp4/webm/mov/avi/mkv) through `/api/files` for range-friendly playback and honors host overrides for correct streaming URLs.
- Legal catch-all route now awaits `params` to avoid Next.js "params is a Promise" runtime errors.
- Fixed event worker memory leaks and "heap out of memory" crashes by limiting batch sizes, concurrency, and adding OCR queue/file-size caps.
- Fixed Prisma "Connection terminated unexpectedly" errors by reducing parallel DB load in event processing.
- Fixed paste form Language/Filename inputs not aligning properly by adding `items-end` grid alignment and explicit input heights.
- Fixed duplicate `border-white/10` class warning in `BlogToc.tsx`.
- Fixed Prisma client imports across 17 files to use the generated client path (`@/prisma/generated/prisma/client`) instead of `@prisma/client`, resolving Turbopack module resolution errors during build.
- Fixed TypeScript build errors: config path in verification-codes page, missing `id` prop on `GlassCard`, `billingPeriod` type annotation in pricing helpers, extra argument in admin email logs API, invalid `_sum2` in analytics summary, Map type and property names in top-users analytics, logger fallbacks and payload type annotations in domain routes.


## [1.0.0-alpha.6] - 2025-12-16

### Added
- Snowfall site-wide visual: falling snow canvas that activates when a Christmas/Holly theme is in use (client canvas component + theme-aware detection).
- Per-user appearance settings: theme presets, hue overrides, live preview on the client, and persistence to the user's profile (`theme` stored on `User`).
- New server APIs and components:
  - Profile 2FA endpoints (`GET/POST/DELETE /api/profile/2fa`) to generate TOTP secrets and QR codes, verify tokens, enable and disable 2FA (server-side QR generation via `qrcode` + `otplib`).
  - Partners and Testimonials server APIs and admin UIs (partners CRUD, testimonial submission/management), plus homepage partners carousel wired to server data.
  - Profile Data Explorer: server `GET /api/profile` and a client JSON viewer for exporting/inspecting account data.
- UI components and client flows added: `ProfileAppearance` (appearance tab), `ThemeInitializer` client script, `Snowfall` component, 2FA UI scaffolding in profile security (temporarily blurred as "Coming soon").
- Prisma schema changes & migrations for new data models and fields: `Partner`, `Testimonial`, `twoFactorEnabled`, `twoFactorSecret`, and related migration files applied locally during development.
- Package additions for server-side 2FA/QRCodes: `otplib` and `qrcode`.

### Changed
- Theme propagation and client hydration: `data-theme` is now set on the `<html>` element and a small client initializer ensures the system/site theme is applied before React hydration so client-only features (Snowfall, previews) reliably reflect system-level site appearance.
- `hooks/use-profile.ts` now exposes `updateProfile()` and the profile API `PUT /api/profile` accepts `theme` and persists appearance changes.
- Navigation and header updates:
  - `BaseNav` aligned with `UserNav`: desktop avatar links directly to `/me`.
  - Mobile sheet trigger moved to the right and renders the signed-in user's avatar (falls back to menu icon when not signed in).
  - Mobile sections are toggleable and only the `base` section is open by default.
  - Mobile sheet now closes automatically on footer actions (Sign In/Register/Profile/Dashboard/Sign Out).
- Tabs, list UIs and dropdowns improved for better small-screen overflow and keyboard/outside-click behaviours (Radix primitives adopted for consistent focus management).
- Changelogs, partners, testimonials and ST5 pages refactored to use shared layout primitives (`PageShell`, `DashboardWrapper`) and improved responsive layouts.

### Fixed
- Defensive checks and runtime guards added to Settings, profile and other pages to prevent TypeErrors (e.g. attempting to access `quotas` on undefined objects).
- Admin role checks updated to treat `SUPERADMIN` equivalently to `ADMIN` where appropriate (settings/posts/admin routes and UIs).
- Resolved `updateProfile is not a function` by returning `updateProfile` from the profile hook the client uses.
- Snowfall visibility issues resolved by ensuring server-configured/system-level themes set `data-theme` on the document root and by improving Snowfall to observe both `data-theme` and document `className`.
- Prisma schema changes for 2FA and other models were added and migrations applied during development (see migrations folder).
- Misc layout and accessibility bug fixes across navs, modals, and small-screen components (modal scrolling, focus traps, dropdown outside-click behaviour, mobile overflow fixes).


## [1.0.0-alpha.5] - 2025-12-12

### Added
- Persisted partners to the database with a new `Partner` Prisma model and migration.
- Admin partner management UI (`/dashboard/partners`) with create/edit/delete and an empty-state.
- Server API routes for partners (`/api/partners` and `/api/partners/[id]`) supporting public GET and admin-protected create/update/delete.
- Homepage partners carousel wired to server data so partners can be surfaced dynamically.
 - New `Testimonial` Prisma model, migrations, and server APIs for public and admin operations (`/api/testimonials`).
 - Profile testimonial UI allowing users to submit, edit, archive, or delete a single testimonial from their profile.
 - Admin testimonial management in the dashboard with approve/hide/archive controls.
 - Public testimonial listing component with avatar support (image or initials fallback) and star-rating display.
 - Profile Data Explorer: added server GET for `/api/profile` and a client JSON viewer for exporting/inspecting account data.

### Changed
- Home page now fetches active partners server-side and conditionally renders the partners carousel.
- `components/partners/partners-carousel.tsx` refactored to accept server-driven `partners` props and fixed a JSX parsing bug.
- Navigation: added `Partners` admin link to both base and dashboard navigation.
- Error and Not Found pages standardized to use the site's fixed header (`BaseNav` / `DashboardNav` + `UserNav`), `DynamicBackground`, and a centered card layout for visual consistency.
- Dialog primitive and modals updated to cap height and enable internal scrolling for better mobile behavior; applied to edit/view user modals.
 - Standardized layout and theme across the site so pages use a consistent `PageShell` / `DashboardWrapper` composition with `BaseNav`, `DashboardNav`, `DynamicBackground`, and shared spacing/typography tokens.
 - Testimonial APIs updated to support `?mine=true` for fetching the current user's testimonial and admin `?all=true` for full lists.
 - Profile submit flow now enforces one testimonial per user (client shows Edit when a testimonial exists); POST creates only when no existing testimonial is present.
 - `components/testimonials` presentation refactored to use `Avatar` with initials fallback and a responsive card/grid layout.

### Fixed
- Guarded and unwrapped API responses in the dashboard partners list so `partners` is always an array (resolved `partners.map is not a function`).
- Fixed modal overflow on small screens so modals are scrollable and close controls remain accessible.
- Repaired a syntax/parse error in the partners carousel implementation.
- Various small layout and runtime fixes related to the partners integration and admin tooling.
 - Fixed client-side handling of API envelopes so `data === null` is not treated as an existing testimonial.
 - Added safe date parsing for testimonial `createdAt` to prevent display of `Invalid Date`.
 - Render testimonial ratings as star icons and added responsive button layout for mobile-friendly actions (submit/edit/delete/archive).
 - Resolved several runtime/hydration issues found while wiring testimonials and profile APIs (including Radix focus-group SSR fix and missing icon imports).


## [1.0.0-alpha.4] - 2025-12-12

### Added
- Public access for the pricing page via updated middleware constants.
- Navigation menus and dropdowns for both the main website and dashboard.
- Expanded analytics tracking for user actions and page visits.
- New analytics endpoints and improved dashboard analytics display.
 - `PageShell` applied across public pages (blog, docs, legal) for consistent header and content layout.
 - Table-style listing components used for blog, docs, and legal hub indexes for tighter, more readable lists.
 - New legal pages: Refund Policy and Service Level Agreement (SLA) with detailed policy text.
 - `DashboardWrapper` now supports a `nav` prop to choose between base and dashboard navigation contexts.

 - Analytics server routes: `overview`, `storage`, `top-items`, `top-users`, and `metrics/activity` providing timeseries, top-10 lists, and storage summaries.
 - Top users scoring & privacy model: primary + composite scoring (downloads + clicks, avg-per-file) and privacy-aware responses (anonymized distribution for non-admins, full list for admins).
 - Changelogs feature: server route `/api/changelogs` (GitHub releases fetch), `components/changelogs/ChangelogList.tsx`, and `/changelogs` page to list organizational releases (uses `react-markdown` for release bodies).
 - Recharts added for dashboard charts and visualizations.
 - Client UI components: `PageShell`, `DocsCard` (table-style), changelogs list with expandable rows and search, and analytics overview components.

### Changed
- Blog management layout now restricts post creation/management to admin users only.
- Refined analytics event structure and improved data consistency.
- Updated navigation logic for better user experience.
 - Main and dashboard navigation dropdowns converted to managed `DropdownMenu` primitives (replacing CSS hover groups) for reliable outside-click closing and keyboard interaction.
 - Public layout now uses a `ConditionalBaseNav` so the base navigation is only shown where appropriate; `DashboardWrapper` renders the dashboard header only when required.
 - Blog and docs index views refactored from card grids into the shared `Table` UI component.
 - Legal subpages refactored to use `PageShell` with compact left navigation and prose-based content; legal hub uses table rows and includes Refund and SLA links.

 - Docs layout: left TOC converted to a compact card for desktop and the mobile TOC toggle simplified to a small disclosure. `DocsToc` updated to hide on large screens in favor of the left card nav.
 - `PageShell` updated to integrate with `DashboardWrapper` so public pages show the same dynamic background and header as dashboard pages.
 - Changelogs page: moved to `DashboardWrapper`-backed layout for consistent background, and `ChangelogList` styling refactored to a compact table with expanders.
 - Added `react-markdown` and adjusted `package.json` to include the dependency (client-side markdown rendering in changelogs).

 - Navigation UX: `BaseNav` is now a fixed header so it scrolls consistently with the page; `ConditionalBaseNav` renders a spacer to prevent content overlap with the fixed header.
 - `DashboardNav` mobile sheet now includes a profile / auth footer area (sign in / register / profile / sign out) so account actions remain accessible on small screens.
 - Improved responsive nav behavior to prevent link overflow on smaller screens and to centralize nav rendering responsibilities.

### Fixed
- Navigation menu dropdowns.
- Various navigation and menu-related bugs.
- Fixed broken analytics event reporting and dashboard stats.
- Addressed issues with analytics data aggregation and display.
- Minor UI/UX bugs across dashboard and public pages.
 - Resolved duplicate/overlapping navigation rendering on public pages by centralizing base nav rendering and gating the dashboard header.
 - Desktop dropdowns now reliably auto-close on outside click and behave consistently across pages.
 - Fixed several small layout regressions introduced during nav and hero refactors.

  - Fixed base navigation overlap by making the base header fixed and adding a spacer via `ConditionalBaseNav`.
  - Added mobile sheet footer to `DashboardNav` to surface auth/profile actions and prevent layout overflow.
  - Resolved additional responsive overflow issues for dashboard nav links on narrow viewports.

 - Fixed duplicate variable declarations and hook-order issues introduced during iterative changes (`TopUsers.tsx`, `top-users` route, and `ChangelogList.tsx`).
 - Corrected top-users scoring inconsistency by introducing `compositeScore` weighting to account for `filesCount` so users with many files do not score lower unfairly.
 - Fixed a Hook ordering bug in `ChangelogList.tsx` so expand state is declared before early returns.
 - Various build fixes and runtime stability improvements encountered while wiring the new pages and APIs.


## [1.0.0-alpha.3] - 2025-12-11

### Added
- New Stranger Things 5 hub page with themed visuals, countdowns, and facts.
- `Comments` feature for the ST5 page: users can post comments with attachments (images/GIFs), mark spoilers, and admins can hide comments.
- `Hawkins Neon` theme preset added to the theme customizer.
- Pricing page improvements: server-rendered pricing page, AddOn checkout UI, and active-plan detection.
- Stripe integration: webhook route and Discord forwarding support.
- `Contact` page (links-first) and `ContactInfo` component.
- Reworked file upload flow and attachments API to support preview URLs and safer client uploads.
- Support for image/GIF attachments in comments with spoiler flag handling.

### Changed
- Refactored ST5 page layout into a three-column grid (countdowns + info left, facts right).
- Repaired and standardized the Countdown component sizing and layout.
- Moved interactive add-on quantity controls into a client `AddOnCheckout` component.
- Pricing CTA alignment and active-plan button states updated.
- Reworked S3 storage provider connector: multipart uploads, signed URL generation, and cleaner env-driven provider selection.
- Custom domains subsystem fixes and DNS alias handling improved (validation, mapping, and edge-case handling).
- Files API validation improved (content-type/size checks) and storage records better integrated with comment attachments.

### Database
- Prisma schema updated: extended `St5Comment` with `isHidden` and `isSpoiler`, added `St5CommentAttachment` model.
- NOTE: Run `prisma migrate` to apply schema changes locally before using the new comments endpoints.
- Additional migrations added to support attachments and moderation fields. Run:
  ```bash
  bunx prisma migrate dev --name add_st5_comment_fields
  ```
- Confirm `St5CommentAttachment` and `File` tables exist after migration.

### Fixed
- Various layout and build issues (including a parse error in `Countdown.tsx` repaired).
- Fixed a build-breaking parse error in `components/st5/Countdown.tsx` and removed/merged temporary fallback components.
- Fixed several domain-related edge-cases that affected custom domain provisioning and SSL assignment.
- Resolved issues with S3 uploads that caused broken previews for certain file types.

### Removed
- Contact form and `/api/contact` route replaced with links-first contact page.
- Temporary development artifacts (e.g., `CountdownFixed.tsx`) consolidated or removed as part of cleanup.

---

For full details and developer notes see `RECENT_CHANGES.md` and `ST5_PAGE_THEME.md`.
