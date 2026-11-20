# STAYSCAPE

A premium property discovery and listing marketplace for Kerala, built with Next.js 16, Supabase, Tailwind CSS v4, React Hook Form, Zod, Framer Motion and Razorpay.

## Features

- Public discovery: homepage, searchable property catalogue, property detail pages, destination pages, pricing and owner acquisition page.
- Supabase auth: registration, login, password reset, email verification callback and role-based redirects.
- Owner dashboard: property CRUD, plan-limited listings and image uploads, cover image selection, enquiry inbox and subscription/payment history.
- Admin dashboard: approvals, featured flags, users, subscriptions, payments, enquiries, destinations, categories, amenities and plan settings.
- Razorpay structure: create order, client verification callback, signed webhook and subscription activation. No simulated or fake payment success.
- Row Level Security, ownership checks, privilege-escalation guards, storage policies and approval reset triggers.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill the Supabase values.

3. In Supabase SQL Editor, run the files in `supabase/migrations/` in filename order, then `supabase/seed.sql`.

   Or use the Supabase CLI: `supabase db push`.

4. In Supabase Authentication, enable Email provider and add these redirect URLs:

   - `http://localhost:3000/api/auth/callback`
   - `http://localhost:3000/auth/callback` (if using the hosted callback path)
   - your production equivalent

5. Start the app:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000`.

## Roles and the first super admin

Roles are `user`, `owner`, `admin` and `super_admin`. New signups can only be `user` or `owner`; the privileged roles are assigned from the admin console by a super admin, or directly in the Supabase SQL Editor.

Migration `0003_super_admin.sql` automatically promotes `nithulcr@gmail.com` to `super_admin` if that profile already exists. Otherwise, sign up with that email first, then run:

```sql
update public.profiles
set role = 'super_admin'
where lower(email) = lower('nithulcr@gmail.com');
```

Only a `super_admin` can assign `admin`/`super_admin` roles, remove admins, or change administrator account status. Administrators cannot change their own role or status.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` or `CRON_SECRET` in client code.

## Razorpay

Fill `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`. Configure a webhook to:

```text
POST https://your-domain.com/api/payments/webhook
```

Subscribe webhook events for `payment.captured` and `order.paid`. Payments stay in `pending` with clear setup errors until credentials are configured.

## Subscription expiry

Call the expiry endpoint from a scheduled job:

```bash
curl -X POST https://your-domain.com/api/cron/expire-subscriptions \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Verification

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Notes

- Initial seed data contains Kerala destinations and property categories only; no fake listings are seeded.
- Properties are created as `pending` and become publicly visible only after admin approval.
- Editing an approved property or its images resets it to `pending`.
- Owners cannot approve, feature, change roles or change account status.
