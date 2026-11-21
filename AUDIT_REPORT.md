# Stay Escape — Full Application, Functionality, Security & Bug Audit

**Audit type:** static codebase audit. No application code was modified.  
**Scope note:** the supplied prompt ends mid-sentence at “authenticated users can access routes”; that item was interpreted as route/role access protection and audited accordingly.  
**Runtime limitations:** live Supabase project settings, deployed cookie flags, Razorpay dashboard configuration, scheduled cron execution, email provider settings, and Supabase Email Confirmation were **NOT TESTABLE** from the repository.

---

## Executive Summary

Overall status: **NOT PRODUCTION READY WITHOUT FIXES**.

The application has a strong structural foundation: App Router routes, server actions, Zod validation, Supabase RLS, role guards, storage policies, review moderation, payment signature verification, and security headers are present. However, several high-impact defects undermine that foundation:

- **Critical:** the enquiry form cannot submit any enquiry because the required `message` field is commented out while still required server-side.
- **Critical/high:** guest review tokens are returned to the browser and treated as bearer credentials, enabling review impersonation.
- **High:** `consume_rate_limit` is callable directly by anonymous/authenticated Supabase clients with attacker-controlled limits/windows.
- **High:** suspended accounts retain usable sessions for several APIs and actions.
- **High:** a hardcoded personal email is auto-promoted to super admin in a migration.
- **High:** account deletion can silently fail to anonymise data when the service-role key is absent, and may leave the auth account active.
- **High:** the owner contact view exposes phone/WhatsApp data for all active owner/admin/super-admin profiles with visible properties.
- **High:** payment webhook/activation lacks amount validation, failure/refund handling, and transactional idempotency.
- **High:** public storage bucket URLs bypass storage RLS.
- **High:** email verification is not enforced by the application.

Key positive controls include server-side role guards for most pages/actions, extensive RLS triggers, Zod validation in application flows, Razorpay HMAC verification, content-based upload validation, and global security headers.

---

# Phase 1 — Complete Architecture Map

## 1. Tech stack and runtime layers

- Framework: **Next.js 16.4.6**, App Router, Turbopack build.
- Language: TypeScript.
- Backend/database: Supabase Auth, Postgres, Supabase Storage, PostgREST, RLS, SQL functions/triggers.
- Validation: Zod in `src/lib/validations/index.ts`.
- Payments: Razorpay order creation, client verification, webhook activation.
- Styling/UI: Tailwind CSS, lucide-react icons, framer-motion-style reveal patterns.
- Security: custom rate limiting, CSP/security headers, audit log table, upload validation.

Main code layers:

| Layer | Location | Responsibility |
|---|---|---|
| App routes | `src/app` | Public pages, auth pages, dashboard, admin, API routes |
| Layouts | `src/app/layout.tsx`, `src/app/(auth)/layout.tsx`, `src/app/(public)/layout.tsx`, `src/app/admin/layout.tsx`, `src/app/dashboard/layout.tsx` | Global shells, metadata, auth guards |
| Components | `src/components` | UI for home, properties, auth, dashboard, admin, payments, legal |
| Server actions | `src/app/actions`, `src/app/auth`, `src/app/admin`, `src/app/dashboard` | Mutations and form handling |
| API routes | `src/app/api` | Auth callback, payments, cron, image uploads |
| Data access | `src/lib/data` | Public/owner/admin query mappings |
| Auth/security | `src/lib/auth`, `src/lib/security`, `src/lib/uploads` | Guards, rate limits, audit, upload validation |
| Supabase clients | `src/lib/supabase` | Browser/server/service-role clients |
| Schema | `supabase/migrations/*.sql`, `supabase/seed.sql` | Tables, RLS, triggers, functions, buckets |
| Types | `src/types` | Hand-written DB/app types |
| Config | `src/lib/config.ts`, `next.config.ts` | Site URL, district list, image constraints, CSP/headers |

## 2. Route map

### Public routes

| Route | Purpose | Notes |
|---|---|---|
| `/` | Homepage | Loads destinations, district summaries, featured/top-rated/recent properties. |
| `/properties` | Explore Stays | Server-side filters via URL params. |
| `/properties/[slug]` | Property detail | Approved property only; reviews, enquiry, gallery, owner contact, JSON-LD. |
| `/destinations` | Destination index | Lists active destinations. |
| `/destinations/[slug]` | Destination detail | Destination-filtered properties. |
| `/pricing` | Pricing | Plan cards and checkout buttons. |
| `/list-your-property` | Owner acquisition page | Marketing CTA. |
| `/contact` | Contact form | Writes `contact_messages`. |
| `/account-deletion` | Deletion request form | Requires user. |
| `/account-suspended` | Suspended account notice | Public informational route. |
| `/privacy-policy`, `/terms-and-conditions`, `/user-terms`, `/owner-terms`, `/cookie-policy`, `/disclaimer`, `/grievance-redressal`, `/listing-policy`, `/review-policy`, `/cancellation-refund-policy`, `/subscription-policy`, `/acceptable-use-policy`, `/security` | Legal/support content | Backed by `src/content/legal-documents.ts`. |

### Auth routes

| Route | Purpose | Notes |
|---|---|---|
| `/login` | Login | Uses `loginAction`. |
| `/register` | Registration | Allows `user` or `owner` self-selection. |
| `/forgot-password` | Reset request | Uses Supabase recovery email. |
| `/reset-password` | Reset form | Uses recovery-age check. |
| `/auth/verify` | Verification success page | Static success message; not gated. |
| `/auth/reset-password` | Redirect stub | Redirects to `/reset-password`. |
| `/api/auth/callback` | OAuth/email callback | Exchanges code and redirects to `next`. |

### Owner/dashboard routes

Guard: `src/app/dashboard/layout.tsx:11-13` calls `requireUser()`.

| Route | Purpose |
|---|---|
| `/dashboard` | Owner/user overview |
| `/dashboard/properties` | Own property list |
| `/dashboard/properties/new` | Create property |
| `/dashboard/properties/[id]` | Edit property/images |
| `/dashboard/enquiries` | Owner enquiry inbox |
| `/dashboard/profile` | Read-only profile |
| `/dashboard/subscription` | Plan status/history |

Owner-only pages additionally call `requireOwner()`: `src/app/dashboard/properties/page.tsx:14`, `new/page.tsx:7`, `[id]/page.tsx:14`, `enquiries/page.tsx:11`, `subscription/page.tsx:15`.

### Admin routes

Guard: `src/app/admin/layout.tsx:11-13` calls `requireAdmin()`.

| Route | Purpose |
|---|---|
| `/admin` | Admin overview |
| `/admin/properties`, `/admin/properties/new`, `/admin/properties/[id]` | Property moderation/CRUD |
| `/admin/users`, `/admin/users/[id]` | User roles/status |
| `/admin/subscriptions`, `/admin/payments` | Commerce views |
| `/admin/enquiries` | Enquiry moderation |
| `/admin/reviews`, `/admin/review-reports` | Review/report moderation |
| `/admin/destinations`, `/admin/destinations/new`, `/admin/destinations/[id]` | Destination management |
| `/admin/categories`, `/admin/categories/new`, `/admin/categories/[id]` | Category management |
| `/admin/settings` | Plans and amenities |

### API routes

| Route | Purpose |
|---|---|
| `/api/auth/callback` | Code exchange/session cookie redirect |
| `/api/payments/create-order` | Creates Razorpay order and pending payment row |
| `/api/payments/verify` | Verifies client payment signature and activates subscription |
| `/api/payments/webhook` | Verifies webhook signature and activates subscription |
| `/api/cron/expire-subscriptions` | Marks expired subscriptions |
| `/api/owner/images` | Owner image upload |
| `/api/admin/property-images` | Admin property image upload |
| `/api/admin/destination-image` | Admin destination image upload |

Proxy: `src/proxy.ts:4-11` calls `updateSession`; `src/lib/supabase/proxy.ts:13-31` refreshes Supabase auth cookies only. It does **not** enforce route protection.

## 3. Major entities and relationships

- `auth.users` → `profiles`  
  Created by `handle_new_user`; profile holds `role`, `account_status`, contact fields.

- `profiles` → `properties`  
  `properties.owner_id` references owner profile.

- `destinations` → `properties`  
  `properties.destination_id`; active destinations are public lookup data.

- `categories` → `properties`  
  `properties.category_id`.

- `amenities` ↔ `properties`  
  Many-to-many via `property_amenities`.

- `properties` → `property_images`, `enquiries`, `reviews`  
  Cascading child entities.

- `reviews` → `review_reports`  
  Reports reference review plus user or guest token.

- `plans` → `subscriptions`, `payments`  
  Subscription/entitlement model.

- `profiles` → `subscriptions`, `payments`, `admin_audit_logs`, `account_deletion_requests`.

- `security_rate_limits`  
  Standalone hashed rate-limit bucket table.

- `contact_messages`  
  Standalone contact form table.

- Storage bucket `property-images`  
  Paths conventionally contain owner/property or destination folder segments; access controlled by SQL helper policies rather than FKs.

## 4. Key data flows

### Property creation/edit

`PropertyForm` → server action → `persistProperty()` → Zod validation → plan checks → Supabase insert/update → image/amenity handling → `revalidatePath` → redirect/refresh.

Evidence: `src/components/dashboard/property-form.tsx:126-155`, `src/lib/properties/save-property.ts:39-213`.

### Public discovery

URL params → `src/app/(public)/properties/page.tsx:19-48` → `getPublishedProperties()` → approved-only query → destination/district/category/amenity/price/rating filters → maps images/reviews/amenities into `PropertyListItem`.

Evidence: `src/lib/data/public.ts:168-286`.

### Property detail

Slug → `getPropertyBySlug()` → approved-only property → lookups/images/amenities/owner/reviews → review summary → JSON-LD → enquiry/review forms.

Evidence: `src/lib/data/public.ts:394-467`, `src/app/(public)/properties/[slug]/page.tsx:28-190`.

### Auth

Credentials → server actions in `src/app/auth/actions.ts` → Supabase Auth cookies → `getAuthContext()` → page/action guards → redirects.

Evidence: `src/app/auth/actions.ts:91-301`, `src/lib/auth/guards.ts:13-64`.

### Payments

Pricing/dashboard CTA → `/api/payments/create-order` → Razorpay order → pending `payments` row → Razorpay checkout → `/api/payments/verify` or webhook → `activatePaidSubscription()` → subscription row → revalidation.

Evidence: `src/app/api/payments/create-order/route.ts:8-84`, `src/app/api/payments/verify/route.ts:6-38`, `src/app/api/payments/webhook/route.ts:17-41`, `src/lib/payments/razorpay.ts:41-127`.

### Admin moderation

`requireAdmin()` in layout/actions → service-role-preferred client → property/review/user/destination/category mutations → limited audit logging → revalidation.

Evidence: `src/app/admin/actions.ts:26-28`, `:137-686`.

---

# Phase 2 — Feature-by-Feature Audit

Statuses are based on static code review.

## A. Authentication

| Feature | Status | Key evidence |
|---|---|---|
| User registration | **PASS WITH ISSUES** | Zod validation and role enum at `src/lib/validations/index.ts:16-27`; raw Supabase error returned at `src/app/auth/actions.ts:135-143`; users can self-select `owner`. |
| Login | **PASS** | Generic failure message at `src/app/auth/actions.ts:181-185`; rate limit at `:170-174`. |
| Logout | **PASS** | `src/app/auth/actions.ts:203-208`; forms in header/admin/dashboard shells. |
| Email verification | **FAIL / NOT TESTABLE** | Redirect supplied at `src/app/auth/actions.ts:123-133`, but login never checks `email_confirmed_at`; `/auth/verify` at `src/app/auth/verify/page.tsx:7-21` unconditionally says verified. Supabase provider config not testable. |
| Password reset | **PASS WITH ISSUES** | Recovery-age check at `src/app/auth/actions.ts:270-278`; no verification of recovery token type/session purpose; raw errors at `:233-241`. |
| Authenticated password change | **NOT IMPLEMENTED** | No current-password change action in `src/app/auth/actions.ts`; profile page is read-only at `src/app/dashboard/profile/page.tsx:7-57`. |
| Email change | **NOT IMPLEMENTED** | No email-change action/schema found. |
| Session persistence | **NOT TESTABLE** | Depends on Supabase project and `@supabase/ssr` defaults; no explicit cookie options in `src/lib/supabase/server.ts:12-35`. |
| Session expiration | **NOT TESTABLE** | No app-level idle/absolute timeout; Supabase JWT/session config external. |
| Auth redirects | **PASS WITH ISSUES** | `safeNext` blocks `//` but allows arbitrary local paths, including API paths: `src/app/auth/actions.ts:17-20`; callback uses same pattern at `src/app/api/auth/callback/route.ts:11-14`. |
| Invalid login handling | **PASS** | Generic message at `src/app/auth/actions.ts:181-185`. |
| Duplicate email handling | **FAIL** | Raw auth error returned from registration at `src/app/auth/actions.ts:135-143`; account enumeration risk. |
| Account recovery | **PASS WITH ISSUES** | Works structurally, but reset page/session binding is weak. |
| Login brute-force protection | **PASS WITH ISSUES** | Rate limits exist at `src/app/auth/actions.ts:170-174`, but proxy-IP headers may be spoofable and DB RPC itself is exposed. |
| Session security | **NOT TESTABLE / PASS WITH ISSUES** | No explicit `secure`, `maxAge`, `sameSite`, or `httpOnly` options configured; likely dependent on framework defaults. |

## B. Authorization and protected routes

| Feature | Status | Key evidence |
|---|---|---|
| `/admin/*` protection | **PASS** | `src/app/admin/layout.tsx:11-13`. |
| `/dashboard/*` protection | **PASS** | `src/app/dashboard/layout.tsx:11-13`. |
| Owner-only property pages | **PASS** | `requireOwner()` calls in owner property pages; edit queries also scope by `owner_id` at `src/app/dashboard/properties/[id]/page.tsx:18-25`. |
| Missing-profile handling | **PASS WITH ISSUES** | `getAuthContext()` returns `profile: null` at `src/lib/auth/guards.ts:22-28`; ordinary dashboard access can proceed. |
| Suspended-account enforcement | **FAIL** | Only `requireUser()` checks suspension at `src/lib/auth/guards.ts:31-35`; many mutating APIs use `getAuthContext()` directly. |
| Role escalation protection | **PASS WITH ISSUES** | App protections at `src/app/admin/actions.ts:275-340`; DB trigger at `supabase/migrations/0003_super_admin.sql:86-129`; service-role writes skip trigger at `:95-97`. |
| Super-admin bootstrap | **FAIL** | Hardcoded email promoted at `supabase/migrations/0003_super_admin.sql:138-155`. |
| API route authorization | **PASS WITH ISSUES** | Upload/payment APIs perform some checks but not all status/role checks. |
| Admin audit logging | **PASS WITH ISSUES** | Some actions audited, e.g. `src/app/admin/actions.ts:192-199`; many mutations unaudited; logging silently no-ops without service key in `src/lib/security/audit.ts:13-14`. |

## C. Property management

| Feature | Status | Key evidence |
|---|---|---|
| Property create/edit UI | **PASS WITH ISSUES** | Shared step form with state preservation at `src/components/dashboard/property-form.tsx:130-155`; state/district fields at `:48-49`, `:77-97`. |
| Server validation | **PASS WITH ISSUES** | `propertySchema` validates required Kerala district at `src/lib/validations/index.ts:112-122`; URL fields accept non-HTTP schemes via bare `.url()` at `:5`. |
| Save/create/update | **PASS WITH ISSUES** | `src/lib/properties/save-property.ts:39-213`; raw DB errors returned at `:169`, `:184`, `:199`. |
| Owner plan limits | **PASS WITH ISSUES** | Enforced at `src/lib/properties/save-property.ts:105-117`; premium-only fields gated at `:128-150`. |
| Admin create/edit | **PASS WITH ISSUES** | Role/owner checks at `src/app/admin/actions.ts:137-173`; admin mode still applies owner plan gating in `save-property.ts:93-117`, causing rich fields to be stripped for free owners. |
| Approval/status actions | **PASS WITH ISSUES** | Admin status handling exists; approval reset trigger list does not include new `state`/`district` columns. |
| Owner image upload | **PASS WITH ISSUES** | Auth/suspension/ownership checks at `src/app/api/owner/images/route.ts:11-49`; content validation in `src/lib/uploads/validate-image.ts:110-163`; storage/public bucket issues remain. |
| Admin image upload | **PASS WITH ISSUES** | Role checks only, no status check; service-role fallback patterns. |
| District support | **PASS WITH ISSUES** | Migration `supabase/migrations/0011_property_district.sql`, config/validation/UI implemented; migration not applied live; approval-reset trigger not updated. |
| Property detail | **PASS WITH ISSUES** | Full detail page exists, but review ratings/visibility, JSON-LD, gallery UX, and owner contact exposure have issues. |

## D. Admin/owner/user dashboards

| Feature | Status | Key evidence |
|---|---|---|
| Owner overview | **PASS** | `src/app/dashboard/page.tsx:11-48`. |
| Owner property list | **PASS** | `src/app/dashboard/properties/page.tsx`. |
| Owner enquiry inbox | **PASS** | `src/app/dashboard/enquiries/page.tsx:10-136`. |
| Owner profile | **PASS WITH ISSUES** | Read-only only; no edit/password/email change at `src/app/dashboard/profile/page.tsx:7-57`. |
| Admin overview/users | **PASS WITH ISSUES** | Role/status management exists; last-super-admin invariant depends on app and service-role bypass. |
| Admin destinations/categories/amenities/plans | **PASS WITH ISSUES** | CRUD/settings pages exist; unaudited mutations and plan versioning gaps. |
| Admin payments/subscriptions | **PASS WITH ISSUES** | Tables exist but stale status, no effective status, filters, pagination, or reconciliation actions: `src/app/admin/payments/page.tsx:6-38`, `src/app/admin/subscriptions/page.tsx:6-36`. |
| Admin audit log UI | **NOT IMPLEMENTED** | Table exists, no admin page/link. |

## E. Reviews and enquiries

| Feature | Status | Key evidence |
|---|---|---|
| Enquiry submission | **FAIL** | Required message textarea commented out at `src/components/properties/enquiry-form.tsx:81-92`; schema requires it at `src/lib/validations/index.ts:48-62`; action parses it at `src/app/actions/enquiry.ts:12-29`. |
| Enquiry owner response | **PASS** | `src/app/dashboard/enquiries/page.tsx:80-120`. |
| Authenticated review submit | **PASS WITH ISSUES** | `src/app/actions/reviews.ts`; owner blocked, but no verified-stay requirement. |
| Guest review submit | **FAIL / HIGH RISK** | Guest identity is a client-controlled UUID; token leaked to public UI. |
| Review moderation | **PASS WITH ISSUES** | Admin actions exist; audit coverage incomplete. |
| Review reporting | **FAIL** | Report RLS does not bind reporter identity: `supabase/migrations/0010_legal_security.sql:120-126`; unique indexes can be poisoned at `:55-56`. |
| Review ratings | **PASS WITH ISSUES** | `getPropertyReviews()` includes viewer’s own pending/rejected rows at `src/lib/data/public.ts:359-368`; `summarizeReviews()` averages all at `:388-391`. |
| Guest own pending review visibility | **FAIL** | Fetch includes guest token rows, but UI filter only checks user ID at `src/components/properties/review-list.tsx:51-54`. |

## F. Public discovery/search/homepage

| Feature | Status | Key evidence |
|---|---|---|
| Homepage | **PASS WITH ISSUES** | Data loaded in `src/app/(public)/page.tsx:21-29`; district section depends on migration applied. |
| Explore Stays | **PASS WITH ISSUES** | Server filtering implemented, but several filter correctness issues remain. |
| Destination/district filters | **PASS WITH ISSUES** | Both supported but ANDed; mismatched selections yield zero results: `src/lib/data/public.ts:195-211`. |
| Price/sort/category/amenity filters | **PASS WITH ISSUES** | Implemented, but bounds unvalidated and amenities OR-only. |
| Rating filter | **PASS WITH ISSUES** | Loads all approved reviews and aggregates in JS: `src/lib/data/public.ts:240-253`; URL values unvalidated. |
| Search | **PASS WITH ISSUES** | Only name/district/destination searched; no category/amenity/description coverage. |
| Hero search | **PASS WITH ISSUES** | Desktop/mobile form exists; adds district select. |
| Property cards | **PASS WITH ISSUES** | Responsive, but carousel controls hover-only and small touch targets. |
| Property gallery | **PASS WITH ISSUES** | Thumbnail-only; no arrows/keyboard/lightbox. |
| Favourites | **PASS WITH ISSUES** | Local-only via `src/components/properties/use-favorite.ts:5-39`; no saved-stays page. |
| SEO | **PASS WITH ISSUES** | Detail metadata good; index pages inherit root canonical; no sitemap/robots; JSON-LD incomplete. |

## G. Subscriptions and payments

| Feature | Status | Key evidence |
|---|---|---|
| Pricing page | **PASS WITH ISSUES** | Uses fallback data, ignores `is_active`, renders checkout unconditionally. |
| Checkout order creation | **FAIL / PASS WITH ISSUES** | Unconfigured in current env; no status/owner check; no rate limit: `src/app/api/payments/create-order/route.ts:8-84`. |
| Client verification | **PASS WITH ISSUES** | Ownership bound and HMAC verified; no rate limit; suspended accounts allowed. |
| Webhook | **FAIL** | No amount/currency validation, no failed/refund handling, `order.paid` requires payment entity though type declares only payment: `src/app/api/payments/webhook/route.ts:4-38`. |
| Subscription activation | **FAIL / HIGH RISK** | Non-atomic update/insert/payment-success sequence: `src/lib/payments/razorpay.ts:67-122`. |
| Cron expiry | **FAIL / NOT TESTABLE** | No `CRON_SECRET` configured; no scheduler file; plain string comparison: `src/app/api/cron/expire-subscriptions/route.ts:5-9`. |
| Success banner | **FAIL** | Trusts `?payment=success`: `src/app/dashboard/subscription/page.tsx:14`, `:32-36`. |
| Renewal wording | **FAIL** | Says “Renews / expires on” while `auto_renew: false`. |
| Admin payment/subscription management | **PASS WITH ISSUES** | Read-only basic tables, no reconciliation. |

### G.1 Owner-based subscription and listing-limit requirement

**Requirement added after the original audit:** subscriptions must apply to the owner account, not individual properties. Free allows 1 property. Premium allows 3 properties and costs ₹499/month, ₹2,499/6 months, or ₹4,999/year. Limits must be enforced server-side against direct API requests, server actions, manipulated frontend requests, and concurrent property creation. On expiry, all property data/images remain, only 1 property remains published/active, the owner chooses which one, and renewal restores access to 3. Super Admin must have unlimited properties, all Premium features, bypassed limits, and manual Premium grant/duration controls.

**Verdict:** the current core model is **owner-based, not property-based**. No owner-to-property subscription conversion migration is required. The subscription source of truth is `public.subscriptions.owner_id` (`supabase/migrations/0001_initial_schema.sql:156-168`, especially `:158`), only one active subscription is allowed per owner (`0001:170-171`), payments are tied to `user_id` rather than property (`0001:173-186`, especially `:175`), entitlement helpers accept owner IDs (`0001:278-331`; final versions in `supabase/migrations/0004_super_admin_entitlement.sql:1-72`), property-limit enforcement counts by owner (`0001:642-675`), and application plan context is loaded by owner (`src/lib/plans/limits.ts:111-155`). Checkout and activation also use the authenticated owner only (`src/app/api/payments/create-order/route.ts:30-67`, `src/lib/payments/razorpay.ts:75-110`).

The only property-scoped artifact is a denormalized plan cache: `public.properties.plan_type` (`0001:107`), overwritten by `sync_property_plan()` (`0001:434-456`; final `0004:101-133`) and bulk-synced by `sync_owner_properties_plan()` (`0001:795-827`; final `0004:135-177`). It is used for visibility (`0004:74-99`) but not for purchase or limit authority.

| Requirement | Current state | Evidence |
|---|---|---|
| Subscription attached to owner, not property | **PASS** | `subscriptions.owner_id` at `0001:158`; no `property_id` in `subscriptions` or `payments`; owner-based checkout/activation at `create-order/route.ts:53-67` and `razorpay.ts:75-110`. |
| Free max 1 property | **PASS WITH ISSUES** | Seed has `max_properties=1` at `supabase/seed.sql:8-11`; app fallback is 1 at `src/lib/plans/limits.ts:21-31`; DB uses owner plan limit at `0001:663`. Admin can change the global limit without snapshot at `src/app/admin/actions.ts:342-389`. |
| Premium max 3 properties | **FAIL** | Seed and fallback use 5: `supabase/seed.sql:13-16`, `src/lib/plans/limits.ts:24`; UI copy says 5 at `src/components/dashboard/dashboard-shell.tsx:37`. |
| ₹499/month | **PASS** | `supabase/seed.sql:14`, `src/lib/plans/limits.ts:26`, `src/app/(public)/pricing/page.tsx:57-59`, order amount from DB at `create-order/route.ts:39`. |
| ₹2,499/6 months | **FAIL** | `billing_cycle` enum has only `monthly`/`yearly` at `0001:10`; plans have only `price_monthly`/`price_yearly` at `0001:78-79`; duration mapping is 1 or 12 months at `src/lib/payments/razorpay.ts:71-73`; checkout exposes only two buttons at `src/components/payments/checkout-button.tsx:46-52`. |
| ₹4,999/year | **PASS** | `supabase/seed.sql:14`, `src/lib/plans/limits.ts:27`, `src/app/(public)/pricing/page.tsx:61-63`. |
| Premium applies to owner and all properties | **PASS WITH DRIFT RISK** | Owner-based enforcement at `0001:642-675`, `0004:1-72`, `0004:74-99`, `0004:135-177`; stale `properties.plan_type` can still affect visibility. |
| Server-side limit enforcement | **PASS WITH ISSUES** | DB trigger `enforce_property_limit_trigger` at `0001:931-933`; function rejects over-limit at `0001:668-671`; service/admin bypass at `0001:652-654`; app server action also checks at `src/lib/properties/save-property.ts:93-117`. Payment APIs still lack active-owner/rate-limit checks at `create-order/route.ts:8-10` and `verify/route.ts:6-8`. |
| Concurrent property creation protection | **PASS** | `perform 1 from public.profiles p where p.id = new.owner_id for update` at `0001:661` serializes inserts per owner. Image-limit checks lack the same lock/owner fix (`0004:190-198`). |
| Expiry keeps all properties and images | **PASS** | Expiry only updates subscription status at `0001:599-614` and `src/app/api/cron/expire-subscriptions/route.ts:14-18`; no property deletion path exists. |
| After expiry only 1 active/published property | **FAIL** | Public queries filter only `status = approved` at `src/lib/data/public.ts:168-177` and `:403-408`; owner query returns all properties at `src/lib/data/owner.ts:33-42`; no active/published flag exists in `src/types/database.types.ts:73-104` or `src/types/index.ts:35-41`. |
| Owner chooses which property remains active | **FAIL** | No selector/action exists. `is_featured` is only an editorial/admin marker at `src/app/admin/properties/page.tsx:151-156` and `src/components/dashboard/property-form.tsx:325-333`. |
| Renewal restores access to all 3 | **PARTIAL** | Payment activation sets the owner subscription active again (`razorpay.ts:71-110`) and entitlement recomputes from active/non-expired subscription (`src/lib/plans/limits.ts:120-155`), but reactivation of extra listings has no UI/workflow. |
| Super Admin unlimited properties and Premium features | **PASS** | `SUPER_ADMIN_UNLIMITED = 1000000` at `src/lib/plans/limits.ts:7` and bypass context at `:61-85`; DB unlimited limit at `0004:37-45`, Premium bypass at `0004:8-15`, forced `plan_type='premium'` at `0004:120-130`, `0004:161-173`. |
| Super Admin manual Premium grant/duration controls | **FAIL** | Admin subscriptions and payments pages are read-only (`src/app/admin/subscriptions/page.tsx:6-47`, `src/app/admin/payments/page.tsx:6-44`); no subscription grant/extend action exists in `src/app/admin/actions.ts`; duration is hardcoded at `razorpay.ts:71-85`. |

#### Owner-based migration plan

No data-conversion migration is needed for ownership because the schema is already owner-based. Do not add `property_id` to `subscriptions` or `payments`, and do not re-key existing subscriptions. Preserve all existing `subscriptions`, `payments`, `properties`, and `property_images` rows.

1. **Plan catalog migration**
   - Add a six-month billing cycle, e.g. `half_yearly` or `six_month`, to `public.billing_cycle` (`0001:10`).
   - Add a six-month price column to `public.plans` beside `price_monthly` and `price_yearly` (`0001:78-79`) and backfill ₹2,499 for Premium.
   - Update existing Premium plan row: `max_properties = 3`, `price_monthly = 499`, six-month price `= 2499`, `price_yearly = 4999`, and align `features` copy. Do not rely only on `supabase/seed.sql` because it uses `on conflict (code) do nothing` at `seed.sql:17`.
   - Keep Free `max_properties = 1`. Decide explicitly whether `max_images_per_property` remains 5 and whether `expired_listing_visibility` remains `hide`.

2. **Single source of truth**
   - Preferred: remove `properties.plan_type` and derive visibility from the owner's active subscription instead of a per-property cache. That removes drift risk from `0001:107`, `0001:434-456`, `0001:795-827`, and `0004:74-99`.
   - Minimum-risk interim: keep `plan_type` only as a derived display cache, add reconciliation triggers for `profiles.role`, `profiles.account_status`, and subscription expiry, and never use `plan_type` for new entitlement decisions.
   - Update TypeScript/UI fallbacks to Premium 3 and the new six-month cycle only after the DB migration lands.

3. **Expiry/downgrade policy**
   - Add an explicit owner-controlled active/published concept separate from moderation `status`; current status values are only `draft`, `pending`, `approved`, `rejected` (`src/types/database.types.ts:3`).
   - Preserve all property rows, images, contact data, and descriptions. Expiry must not delete or blank data.
   - On expiry or downgrade, hide/deactivate enough approved properties so only the owner-selected one remains publicly active. Existing over-limit owners need a backfill policy: either default the newest approved property to active and let the owner change it, or mark all as retained-inactive and force selection before any remain public.
   - Add an audited owner server action to choose the active property, and a Super Admin override.
   - Renewal restores the owner's ability to have 3 active properties; do not auto-delete or auto-recreate anything.

4. **Backend enforcement hardening**
   - Keep the DB trigger as final authority (`0001:642-675`) and preserve the per-owner `FOR UPDATE` lock (`0001:661`) for concurrent creation.
   - Keep server-action checks (`src/lib/properties/save-property.ts:93-117`) as UX/defense-in-depth, but do not rely on frontend state.
   - Require active owner account status and rate limiting on `/api/payments/create-order`, `/api/payments/verify`, and webhook-related routes.
   - Fix the storage image-limit owner UUID bug at `0004:190-198` and add equivalent concurrency protection if image limits must be hard caps.

5. **Payment activation and subscription controls**
   - Replace the non-atomic JavaScript activation sequence (`razorpay.ts:67-122`) with one service-role Postgres RPC that locks the `payments` row, rejects non-pending rows, validates amount/currency against the DB order/plan, upserts the owner subscription by `owner_id`, writes `payments.subscription_id`, and marks payment success in one transaction.
   - Add webhook event-ID deduplication and handle `payment.failed`, refunds, duplicate events, and wrong amounts.
   - Add audited Super Admin RPC/UI actions for grant Premium, set start date, extend duration, revoke, and reconcile active properties. Do not rely on direct PostgREST writes to `subscriptions`.
   - Keep Super Admin bypass via `is_admin()`/`super_admin`, but define whether it should coexist with an explicit subscription row.

6. **RLS/security**
   - Revoke anon access to `has_active_premium(uuid)` (`0001:1346`) and preferably `is_service_role()`/`is_admin()` from anon (`0001:1342-1343`).
   - Restrict direct `subscriptions`/`payments` writes to service role only and route manual changes through audited app code; current admin `for all` policies at `0001:1200-1205` and `0001:1213-1218` are too broad.
   - Snapshot effective limits/duration on each subscription or audit plan changes so global admin edits do not retroactively change paid entitlements (`0004:52-58`, `src/app/admin/actions.ts:342-389`).

7. **UI/UX plan**
   - Update public pricing and dashboard fallback copy to Premium 3 properties and add the ₹2,499/6-month option.
   - Disable “Add property” at quota with an upgrade CTA while keeping server enforcement.
   - Show total properties separately from active/published properties.
   - Add expiry/downgrade banners: all data retained, only one active property, choose which remains active, renew to restore 3.
   - Stop trusting `?payment=success` (`src/app/dashboard/subscription/page.tsx:14`, `:32-36`) and derive status from the database.
   - Add Super Admin controls on `/admin/subscriptions` and owner detail pages for manual grant/extension/revocation.

## H. Legal/security/support

| Feature | Status | Key evidence |
|---|---|---|
| Legal pages | **PASS WITH ISSUES** | Content present; wrong guest cookie name in copy. |
| Contact form | **PASS WITH ISSUES** | App validation/rate limit exists; direct PostgREST insert can bypass. |
| Account deletion | **FAIL** | Service-role dependency, silent failures, auth account may remain active. |
| CSP/security headers | **PASS WITH ISSUES** | `next.config.ts:13-25`, `:54-69`; inline scripts/styles allowed; broad external sources. |
| Upload validation | **PASS WITH ISSUES** | Strong content validation but storage-level weaknesses remain. |
| Rate limiting | **FAIL** | Exposed RPC and spoofable identity. |
| Audit logging | **FAIL / PASS WITH ISSUES** | Partial and silently disabled without service key. |

---

# Consolidated Findings and Recommended Fixes

## CRITICAL

### C-01 — Enquiry form is permanently broken

- **Status:** FAIL
- **Evidence:**
  - Message textarea commented out: `src/components/properties/enquiry-form.tsx:81-92`
  - Message required: `src/lib/validations/index.ts:48-62`
  - Action reads `message`: `src/app/actions/enquiry.ts:12-29`
- **Impact:** Every property enquiry fails validation. The primary lead/conversion path is non-functional.
- **Fix:** Restore the message field or remove the requirement consistently from schema/action. Add a form submission regression test.

### C-02 — Guest review token is leaked and usable as an impersonation credential

- **Status:** FAIL
- **Evidence:**
  - Guest token selected and returned: `src/lib/data/public.ts:351-385`
  - Public component compares token: `src/components/properties/review-list.tsx:38-42`
  - RLS trusts request header: `supabase/migrations/0007_anonymous_reviews.sql:15-30`, `:128-139`
- **Impact:** Any visitor can extract another guest’s token from the RSC payload/page data, send `x-stayscape-guest` directly to Supabase, and edit/delete that guest’s review.
- **Fix:** Never return `guest_token` to clients. Compute ownership server-side and pass only a boolean such as `isOwnReview`. Rotate existing tokens. Issue signed opaque tokens server-side in `HttpOnly; Secure; SameSite=Lax` cookies.

---

## HIGH

### H-01 — Rate-limit RPC is publicly callable and attacker-controlled

- **Evidence:** `supabase/migrations/0010_legal_security.sql:58-98`, `:172-173`; caller at `src/lib/security/rate-limit.ts:62-67`.
- **Impact:** Anonymous/authenticated users can call the SECURITY DEFINER RPC directly with arbitrary `p_limit`, `p_window_seconds`, and `p_subject`, resetting or disabling their own rate-limit buckets and creating unbounded rows.
- **Fix:** Revoke `EXECUTE` from `anon`/`authenticated`. Move limits into trusted server code or SQL config keyed by action. Validate positive bounds. Call only via service role.

### H-02 — Suspended accounts retain mutation access

- **Evidence:**
  - Status only checked in `requireUser()`: `src/lib/auth/guards.ts:31-35`
  - APIs use `getAuthContext()` only: `src/app/api/payments/create-order/route.ts:8-10`, `src/app/api/payments/verify/route.ts:6-8`
  - Admin upload APIs check role only: `src/app/api/admin/destination-image/route.ts:10-14`, `src/app/api/admin/property-images/route.ts:12-16`
- **Impact:** Suspended users/admins can still create payments, verify payments, submit reviews/reports, and upload admin images. Suspension does not revoke sessions.
- **Fix:** Add active-status checks to `getAuthContext()` or a shared `requireActiveUserApi()` used by every mutation. Revoke refresh tokens/sessions when suspending.

### H-03 — Hardcoded personal email auto-promoted to super admin

- **Evidence:** `supabase/migrations/0003_super_admin.sql:138-155`; README documents it at `README.md:42-54`.
- **Impact:** Any environment where that email exists gains highest privilege automatically. The migration temporarily disables a safety trigger; failure between disable/enable can leave it disabled.
- **Fix:** Remove hardcoded promotion. Use an explicit one-time bootstrap runbook with an env-controlled user ID/email and an exception-safe `DO` block that always re-enables the trigger.

### H-04 — Account deletion can silently fail and falsely mark completion

- **Evidence:**
  - `writer = admin ?? supabase`: `src/app/actions/account-deletion.ts:39-40`
  - Review/profile updates ignore errors: `:57-82`
  - Hard delete only when no payments/subscriptions: `:84-94`
  - Final status always written: `:96-99`
- **Impact:** Without service key, review anonymisation fails, profile may not be suspended, auth account remains active, yet request is marked `anonymised`/`completed`. Users with payment/subscription records can still sign in.
- **Fix:** Require service role and fail closed. Implement anonymisation as one service-role RPC/transaction. Only mark completed after verified auth deletion. Detach or anonymise payment/subscription dependencies rather than blocking deletion forever.

### H-05 — Owner contact view exposes admin/super-admin phone numbers

- **Evidence:**
  - View selects `phone`, `whatsapp_number` and includes `owner`, `admin`, `super_admin`: `supabase/migrations/0009_owner_contact.sql:3-14`
  - Granted to `anon`: `supabase/migrations/0001_initial_schema.sql:1304-1306`
  - Consumed by public detail page: `src/lib/data/public.ts:420-424`
- **Impact:** Anonymous users can query the view directly and enumerate contact numbers of all active owner/admin/super-admin profiles with at least one visible property.
- **Fix:** Recreate with `security_invoker = true`, restrict to `role = 'owner'`, and expose contact details only for a specific visible property via a SECURITY DEFINER function taking `property_id`.

### H-06 — Review reports do not bind reporter identity

- **Evidence:** `supabase/migrations/0010_legal_security.sql:120-126`; unique indexes at `:55-56`; action at `src/app/actions/review-reports.ts:28-49`.
- **Impact:** Users can spoof `reporter_user_id`; guests can use arbitrary tokens. Unique indexes can be poisoned to permanently block a victim from reporting a review.
- **Fix:** Enforce identity in RLS `WITH CHECK` and a table CHECK constraint:
  - authenticated: `reporter_user_id = auth.uid()` and no guest token
  - anon: token must equal `public.current_guest_token()` and no user ID

### H-07 — Payment activation is non-atomic and webhook validation is incomplete

- **Evidence:**
  - Activation updates/inserts subscription before marking payment successful: `src/lib/payments/razorpay.ts:67-122`
  - Webhook ignores amount/currency and failure/refund events: `src/app/api/payments/webhook/route.ts:4-38`
  - `order.paid` requires `payment` entity not present in declared type: `:25-31`
- **Impact:** Concurrent verify/webhook calls can extend expiry multiple times; failed/refunded payments remain pending; signed events with wrong amounts can activate premium.
- **Fix:** Move activation into a single Postgres RPC/transaction with row locking and event-id idempotency. Validate amount/currency against DB order and plan. Handle `payment.failed`, refunds, and duplicate events.

### H-08 — Public storage bucket bypasses storage RLS

- **Evidence:** Bucket is public at `supabase/migrations/0001_initial_schema.sql:1369-1380`; public URLs generated in upload APIs.
- **Impact:** Anyone with a URL can fetch objects directly. Storage SELECT RLS does not apply to public object URLs, so pending/rejected/draft images can leak.
- **Fix:** Use a private bucket with signed URLs, or isolate unapproved images in a private bucket and only copy approved images to public storage.

### H-09 — Email verification is cosmetic

- **Evidence:** `src/app/auth/actions.ts:123-133`, `:181-200`; `src/app/auth/verify/page.tsx:7-21`.
- **Impact:** If Supabase Email Confirmation is off, unverified users can sign in. If on, the app still does not independently enforce verification, and `/auth/verify` always shows success.
- **Fix:** Enable Email Confirmation in Supabase. Check `email_confirmed_at` in login/auth context. Gate `/auth/verify` on a valid verified session.

### H-10 — Direct PostgREST writes bypass app validation and rate limits

- **Evidence:** Anon key client at `src/lib/supabase/client.ts:7-17`; loose RLS at `supabase/migrations/0010_legal_security.sql:106-126`; app validation at `src/lib/validations/index.ts:48-72`, `:154-166`.
- **Impact:** Attackers can insert contact messages/reports with invalid data and bypass app-level throttles.
- **Fix:** Mirror validation in SQL CHECK constraints. Enforce rate limits at database/edge. Derive reporter identity server-side. Restrict insertable columns via RPCs or column grants.

### H-11 — Supabase/guest cookies are not explicitly hardened

- **Evidence:** No `cookieOptions` in `src/lib/supabase/server.ts:12-35`, `src/lib/supabase/proxy.ts:13-28`, `src/lib/reviews/guest.ts:1-30`.
- **Impact:** Session cookies may be readable by JavaScript depending on framework defaults; guest tokens are not explicitly Secure/HttpOnly.
- **Fix:** Configure explicit `secure`, `sameSite`, and appropriate `httpOnly` settings. Keep guest identity HttpOnly and server-issued.

---

## MEDIUM

### M-01 — Rate-limit identity trusts client-controlled proxy headers

- **Evidence:** `src/lib/security/rate-limit.ts:36-42`; local unbounded fallback at `:30`, `:44-54`, `:72`.
- **Fix:** Use only platform-verified IP headers; strip inbound `x-forwarded-for`/`x-real-ip`; include authenticated user ID; cap/evict local buckets; fail closed if shared limiter is unavailable.

### M-02 — Password reset lacks recovery-purpose binding

- **Evidence:** `src/app/auth/actions.ts:247-290`; reset page has no token guard at `src/app/(auth)/reset-password/page.tsx:6-7`.
- **Fix:** Require a recovery-specific Supabase session/token claim. Block reset page unless recovery session exists. Key rate limits by user/recovery token as well as IP.

### M-03 — Account enumeration via raw auth errors

- **Evidence:** `src/app/auth/actions.ts:135-143`, `:233-241`.
- **Fix:** Map Supabase errors to uniform messages; always return the same response for duplicate registration and password reset where policy allows.

### M-04 — Admin audit logging is partial and silently disabled

- **Evidence:** `src/lib/security/audit.ts:13-14`; audited examples at `src/app/admin/actions.ts:192-199`, `:299-338`; unaudited mutations include toggles, image changes, taxonomy changes, enquiry actions.
- **Fix:** Audit every privileged mutation. Surface or fail on audit write errors. Add an admin audit-log viewer.

### M-05 — Raw database/storage/auth errors returned to clients

- **Evidence:** `src/lib/properties/save-property.ts:169`, `:184`, `:199`; `src/app/api/cron/expire-subscriptions/route.ts:20`; several admin/API actions.
- **Fix:** Log full errors server-side with correlation IDs. Return generic safe messages to clients.

### M-06 — PostgREST filter strings are assembled with raw user input

- **Evidence:** `src/lib/data/public.ts:184-192`, `:237-245`; `src/lib/data/admin.ts:226-227`.
- **Fix:** Escape reserved PostgREST characters or use parameterised RPC search functions.

### M-07 — Storage upload policy passes property UUID where owner UUID is expected

- **Evidence:** `supabase/migrations/0004_super_admin_entitlement.sql:190-198`, specifically `:196`; correct owner argument pattern at `supabase/migrations/0001_initial_schema.sql:1402-1408`.
- **Impact:** Premium owners/admins can be capped at one image because `plan_limit_for()` looks up subscriptions by owner ID.
- **Fix:** Derive owner ID from path segment or `properties.owner_id`, then pass it to `plan_limit_for()`.

### M-08 — Approval reset trigger misses `state` and `district`

- **Evidence:** New columns at `supabase/migrations/0011_property_district.sql:1-2`; approval reset trigger field list at `supabase/migrations/0001_initial_schema.sql:477-502`.
- **Impact:** Owners can change location/SEO fields on approved listings without re-moderation.
- **Fix:** Include `state`/`district` changes in `guard_property_update()` or add a dedicated reset trigger.

### M-09 — Admin property save strips premium fields for free owners

- **Evidence:** `src/lib/properties/save-property.ts:93-150`; admin mode at `:152-164`.
- **Impact:** Admin-created listings for free owners silently lose description, price, contact details, highlights, and amenities.
- **Fix:** Skip plan-field gating in `adminMode` or add an explicit super-admin override with confirmation.

### M-10 — Payment UX and entitlement gaps

- **Evidence:** No status/owner/rate-limit checks in payment APIs; success banner trusts query param at `src/app/dashboard/subscription/page.tsx:14`, `:32-36`; renewal wording at `:57-58`; pricing ignores `is_active` at `src/app/(public)/pricing/page.tsx:14-16`.
- **Fix:** Require active owner role, rate-limit endpoints, derive success state from DB, fix wording, filter inactive plans, add unavailable-payment state.

### M-11 — Search/filter correctness issues

- **Evidence:** Destination+district ANDed at `src/lib/data/public.ts:195-211`; search coverage at `:179-192`; amenities OR-only at `:228-238`; rating aggregation at `:240-253`; unvalidated bounds at `src/app/(public)/properties/page.tsx:40-45`.
- **Fix:** Make locality filters mutually exclusive or OR-based. Extend search to category/amenity/description. Validate/clamp numeric filters. Implement all-selected amenity matching and add DB-backed rating aggregation.

### M-12 — Data errors are swallowed into empty/404 states

- **Evidence:** `src/lib/data/public.ts:175-177`, `:262-286`, `:468-470`.
- **Impact:** DB outages look like “no stays” or 404.
- **Fix:** Log errors, distinguish empty results from failures, and render error/retry states.

### M-13 — SEO gaps

- **Evidence:** Root canonical at `src/app/layout.tsx:18-35`; no per-page canonicals on index routes; no sitemap/robots files; JSON-LD at `src/app/(public)/properties/[slug]/page.tsx:68-82` omits rating/contact/geo.
- **Fix:** Add per-route canonicals, sitemap/robots, and richer JSON-LD.

### M-14 — Guest own pending review not visible

- **Evidence:** Fetch includes guest token at `src/lib/data/public.ts:359-368`; UI filter only checks user ID at `src/components/properties/review-list.tsx:51-54`.
- **Fix:** Include server-computed `isOwnReview` in visible filtering and exclude own pending rows from public summary.

### M-15 — Legal copy names wrong guest cookie

- **Evidence:** `src/content/legal-documents.ts:91`, `:109`, `:610`, `:931`, `:957`, `:1531`, `:1614`; actual cookie at `src/lib/reviews/guest.ts:1`.
- **Fix:** Correct cookie name in legal copy.

### M-16 — Users can update deletion-request status

- **Evidence:** `supabase/migrations/0010_legal_security.sql:149-153`.
- **Fix:** Allow insert only; restrict status updates to service role/admin workflow.

### M-17 — Schema drift and migration hygiene

- **Evidence:** Hand-written DB types in `src/types/database.types.ts`; initial migration not idempotent; `security_rate_limits` has no cleanup.
- **Fix:** Generate Supabase types. Make migrations idempotent. Add scheduled cleanup for old rate-limit rows.

---

## LOW

- Unused `ShieldCheck` import: `src/components/admin/admin-shell.tsx:3`.
- Unused `compact` parameter: `src/components/ui/logo.tsx:5`.
- README documents non-existent `/auth/callback`: `README.md:28-32`.
- Duplicate reset redirect stub: `src/app/auth/reset-password/page.tsx:3-4`.
- Favourites are local-only with no saved page: `src/components/properties/use-favorite.ts:5-39`.
- Gallery has no arrows/keyboard/lightbox: `src/components/properties/property-gallery.tsx:20-47`.
- Card carousel controls are hover-only with small touch targets: `src/components/properties/property-card.tsx:106-137`.
- `getSimilarProperties()` accepts `category_slug` but does not filter by it: `src/lib/data/public.ts:473-485`.
- `payments.subscription_id` exists in types but is never written.
- Enquiry statuses are ambiguous/duplicated: `new`, `pending`, `contacted`, `completed`.
- CSP allows inline scripts/styles and broad third-party origins: `next.config.ts:13-25`.

---

# Positive Controls Identified

1. **Server-side authorization is broadly applied**  
   Owner/admin pages and actions generally call `requireOwner()`, `requireAdmin()`, or `requireSuperAdmin()` first.

2. **RLS and SQL triggers are extensive**  
   Ownership, premium limits, review immutability, role escalation, approval resets, and visibility are enforced in Postgres.

3. **Input validation is extensive at the application layer**  
   Zod schemas cover auth, enquiries, reviews, properties, reports, plans, and admin forms.

4. **Upload validation is content-based**  
   `src/lib/uploads/validate-image.ts:110-163` checks size, magic bytes, MIME agreement, and dimensions.

5. **Razorpay signatures use HMAC with `timingSafeEqual`**  
   `src/lib/payments/razorpay.ts:20-39`.

6. **Secrets are not intentionally exposed to the browser**  
   Service-role and secret modules use `server-only`; only Razorpay key ID is returned to the client.

7. **Security headers are global**  
   CSP, `nosniff`, frame denial, referrer policy, permissions policy, COOP, and HSTS in production: `next.config.ts:54-69`.

8. **Admin/dashboard routes are non-indexable**  
   `src/app/admin/layout.tsx:6-9`, `src/app/dashboard/layout.tsx:6-9`.

9. **Login uses generic failure messaging**  
   `src/app/auth/actions.ts:181-185`.

10. **Password reset rejects stale recovery age**  
   `src/app/auth/actions.ts:270-278`.

---

# Recommended Remediation Order

1. **Immediate blockers**
   - Fix enquiry message field.
   - Remove guest tokens from client payloads and harden guest identity.
   - Revoke/secure `consume_rate_limit` RPC.
   - Enforce active account status in all mutation paths.
   - Remove hardcoded super-admin promotion.

2. **Data protection and account integrity**
   - Rework account deletion as an all-or-nothing service-role RPC.
   - Fix owner contact view exposure.
   - Bind review-report identity and rotate poisoned tokens if deployed.
   - Make storage private or separate approved/unapproved assets.

3. **Payments and owner-based subscriptions**
   - Add amount/currency validation and idempotency.
   - Make activation transactional.
   - Handle failed/refunded payments.
   - Require active owner role.
   - Add payment rate limits.
   - Configure `CRON_SECRET` and a real scheduler.
   - Derive success banner from DB state.
   - Keep subscriptions owner-based; change Premium from 5 to 3 properties and add the ₹2,499/6-month cycle.
   - Preserve all properties/images on expiry, enforce one owner-selected active property, and restore 3 active properties on renewal.
   - Add audited Super Admin grant/extend/revoke controls and unlimited-property bypass.

4. **Database consistency**
   - Include `state`/`district` in approval reset.
   - Fix storage image-limit owner UUID.
   - Mirror Zod validation in SQL constraints.
   - Generate committed Supabase types.
   - Add migration idempotency and rate-limit cleanup.

5. **Feature correctness and UX**
   - Fix review rating/visibility semantics.
   - Fix search/filter interactions and numeric validation.
   - Add DB-backed rating aggregation.
   - Improve gallery/card mobile controls.
   - Add per-page canonicals, sitemap, robots, and richer JSON-LD.

6. **Testing**
   - Add regression tests for enquiry submit, auth role access, suspended-account API denial, rate-limit RPC grants, review token leakage, webhook amount validation, and deletion flow.
   - Add RLS policy tests executed as `anon`, `authenticated`, owner, admin, and service role.
   - Add Playwright/E2E coverage for login, register, reset, property create/edit, admin approval, enquiry, review/report, and checkout failure states.

---

**Final note:** no application files were changed during this audit. The payment architecture addendum was added to this report only; implementation has not been started.
