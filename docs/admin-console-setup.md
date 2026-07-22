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
