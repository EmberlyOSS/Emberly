# Changelog (updated)

All notable changes to this project will be documented in this file.

The format is based on "Keep a Changelog" and follows [Semantic Versioning](https://semver.org/).

## [1.4.0] - 2026-01-01

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
  - **Videos now respect `enableRichEmbeds=false`**: Previously videos still generated thumbnail/video metadata; now returns minimal metadata with no media.
  - **Videos now work properly when `enableRichEmbeds=true`**: Changed from `/api/files/{id}/thumbnail` (which redirected to banner.png) to using `rawUrl` directly so Discord/Twitter can extract their own thumbnail and play the video inline.
  - Early return pattern when `enableRich=false` ensures no `og:image`, `og:video`, or `og:audio` tags are generated for any file type.
  - Twitter card type changed to `summary` (no image) when rich embeds disabled, `player` for videos when enabled, `summary_large_image` for images when enabled.
  - Non-media files now use generic OG banner (`/api/og`) instead of file-specific thumbnail endpoint.
  - Root cause: `buildRichMetadata()` was generating image/video URLs regardless of `enableRich` flag, and video thumbnails were redirecting to banner.png instead of allowing platforms to generate their own.
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
  - Added `?tab=` query parameter support to profile settings page (e.g., `/dashboard/profile?tab=security`).
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
- Navigation & UI tweaks: `BaseNav` avatar now links to `/dashboard/profile` to match `UserNav`, mobile sheet trigger/footers improved, and modal z-index/overflow fixes.
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
  - `BaseNav` aligned with `UserNav`: desktop avatar links directly to `/dashboard/profile`.
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
