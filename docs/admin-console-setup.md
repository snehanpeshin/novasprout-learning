# NovaSprout Admin Console Setup

The admin page is available at:

```text
https://www.novasproutlearning.com/admin
```

Authentication is already working. Complete the database setup below to load
revenue, subscriptions, and customer records.

## 1. Create Supabase project

1. Sign in to Supabase and create a project for NovaSprout Learning.
2. Open **SQL Editor**.
3. Paste and run `docs/database-schema.sql`.
4. Open **Project Settings > API** and copy:
   - Project URL
   - `service_role` key (not the public `anon` key)

The service-role key is a server secret. Never put it in a `NEXT_PUBLIC_`
variable, browser code, source control, or screenshots.

## 2. Configure Amplify

Add these variables for the production branch in **AWS Amplify > Hosting >
Environment variables**:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ADMIN_DASHBOARD_TOKEN=YOUR_NEW_LONG_RANDOM_TOKEN
```

Generate the admin token locally:

```bash
openssl rand -base64 32
```

Do not reuse or publish the old admin token.

## 3. Redeploy and verify

Redeploy the production branch in Amplify, then open `/admin` and enter the new
admin token. A new database correctly displays zero totals until Stripe sends a
completed checkout or subscription event.

If the page shows **Setup needed**, verify the two Supabase values, confirm that
the SQL completed successfully, and redeploy after every environment-variable
change.

## 4. Populate payment metrics

The Stripe webhook endpoint is:

```text
https://www.novasproutlearning.com/api/stripe/webhook
```

It accepts these signed Stripe events:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

The admin dashboard will remain empty if NovaSprout does not use Stripe. The
login and platform-status section will still work.

## AI tutor activity and presentations

After entering the admin token, the console shows the last 14 UTC days of successful lesson completions, guided replies, video plans, scene illustrations, and scene narrations. Tracking begins with this release; previous usage is not backfilled. Static sample playback and cached outputs are excluded. These counts are usage, not unique students, revenue, or demonstrated learning gains.

Reporting uses the existing AI_USAGE_TABLE and AI_USAGE_REGION. The application uses GetItem and TransactWriteItems, already used by the usage ledger. Aggregate counters and hashed event markers contain no lesson content or student identities. Duplicate response polling counts once, and reporting failures do not block lesson delivery. Refresh reads stored counters without generating AI content. Payment reporting remains separate and requires valid Supabase credentials.

The presentation panel opens a free sample and the live tutor in separate tabs and gives a short demonstration sequence. Learner access requires its own eligible purchase or private access code; the admin token grants only admin access.
