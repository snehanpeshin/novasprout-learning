# Stripe Setup for NovaSprout Learning

NovaSprout Learning uses one Stripe account owned by Karigari Home LLC. NovaSprout is stored as the `dba_name` on payments and subscriptions.

## 1. Create Stripe products

In Stripe Dashboard, create separate products:

1. `NovaSprout Learning tutoring session`
   - Recurring: no
   - Create a one-time price
   - Copy the product ID and price ID

2. `NovaSprout Learning monthly subscription`
   - Recurring: yes
   - Create a monthly recurring price
   - Copy the product ID and price ID

## 2. Optional Stripe Payment Links

Create separate Payment Links in Stripe:

- One-time tutoring session Payment Link
- Monthly tutoring subscription Payment Link

Copy those URLs into the public env vars below. Payment Links are public URLs and are safe to expose.

For each Payment Link, add metadata in Stripe if available:

```text
dba_name=NovaSprout Learning
product_name=NovaSprout Learning tutoring session
```

or:

```text
dba_name=NovaSprout Learning
product_name=NovaSprout Learning monthly subscription
```

That lets the webhook save the correct DBA/product if the customer pays through a Payment Link instead of the server-side Checkout button.

## 3. Database

Use Supabase Postgres for the current implementation.

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `docs/database-schema.sql`.
4. Copy:
   - Project URL
   - Service role key

Keep the service role key server-side only.

## 4. Environment variables

Add these in AWS Amplify environment variables:

```text
NEXT_PUBLIC_SITE_URL=https://www.novasproutlearning.com

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

STRIPE_NOVASPROUT_TUTORING_PRODUCT_ID=prod_...
STRIPE_NOVASPROUT_TUTORING_PRICE_ID=price_...

STRIPE_NOVASPROUT_MONTHLY_PRODUCT_ID=prod_...
STRIPE_NOVASPROUT_MONTHLY_PRICE_ID=price_...

NEXT_PUBLIC_STRIPE_NOVASPROUT_TUTORING_PAYMENT_LINK=https://buy.stripe.com/...
NEXT_PUBLIC_STRIPE_NOVASPROUT_MONTHLY_PAYMENT_LINK=https://buy.stripe.com/...

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

ADMIN_DASHBOARD_TOKEN=choose-a-long-random-password
```

Local development uses `.env.local`.

## 5. Webhook endpoint

In Stripe Dashboard, add a webhook endpoint:

```text
https://www.novasproutlearning.com/api/stripe/webhook
```

Subscribe to these events:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

Copy the webhook signing secret into:

```text
STRIPE_WEBHOOK_SECRET
```

## 6. Checkout security

This implementation follows the core Stripe security rules:

- Stripe secret key is used only in server route handlers.
- Checkout sessions are created server-side.
- The frontend sends only an allowed product key, not raw price IDs.
- Webhooks verify `Stripe-Signature` before saving data.
- Supabase service role key is used only server-side.

## 7. Admin dashboard

After deployment, open:

```text
https://www.novasproutlearning.com/admin
```

Enter the value of `ADMIN_DASHBOARD_TOKEN`.

Dashboard shows:

- Total revenue
- Revenue by DBA
- Revenue by month
- Active subscriptions
- Customer list

## 8. DBA reporting

Payments and subscriptions are saved with:

```text
dba_name = NovaSprout Learning
```

This allows separate revenue reports by DBA even though the Stripe account is owned by Karigari Home LLC.
