# Paid website AI Tutor

The website offers one AI lesson for $2.99 or an automatically renewing $14.99/month plan with up to 20 lessons per paid billing period. Apple purchases remain separate in the iOS app.

## Access and payments

Stripe Checkout creates the allowed AI price server-side. Activation verifies a completed, paid checkout, its exact price and product metadata, and a nonce in the purchasing browser. A checkout ID or email alone cannot unlock access. Necessary HttpOnly, Secure, SameSite=Lax cookies retain access. A signed private purchase code can restore access in another browser; current Stripe payment/subscription status is rechecked before access is granted. The billing portal supports cancellation at period end and payment-method management.

The existing webhook records paid checkout events idempotently. GET /api/ai-access can recover the purchasing browser after a lost checkout redirect by verifying its pending session and nonce. Refunds, partial refunds, disputes, unpaid invoices, expired periods and inactive subscriptions cannot unlock generation.

## Usage ledger

AI_USAGE_TABLE identifies the dedicated DynamoDB table (production: novasprout-ai-usage, us-east-1). The main Amplify branch has the NovaSproutAiUsageCompute role, restricted to GetItem, PutItem and UpdateItem on that table. Credentials come from Amplify's compute role, not static AWS keys. The trust relationship retains account and application source-ARN conditions.

DynamoDB transactions atomically reserve lesson usage. Monthly keys include the subscription and billing-period start. One-purchase counters do not expire, preventing restored purchases from replaying after TTL deletion. Other usage counters use TTL. A confirmed failed response restores its credit with an atomic refund marker plus decrement, so repeated polling cannot refund twice. Database outages fail closed. The existing Supabase payment records are retained; no Apple usage tables are assumed to exist.

## Tutoring

The lesson request validates input and moderation before consuming allowance, uses structured JSON, and retains mathematical/content validation and the existing visual-plan/semantic pipeline. OpenAI metadata binds retrieval to its creator. Guided replies use the completed server-retrieved lesson, short conversation history, hints and check questions, input/output moderation, store:false and an output-token cap. Background lesson generation requires response storage for polling and context retrieval.

Per website lesson: up to three generated images, two visual-planning calls, and ten guided questions. Guided questions and generated visual steps require an owner-bound signed ticket valid for 24 hours from the original response creation time. Polling cannot extend this window. Saved PDF downloads remain on the user's device.

## Configuration

- OPENAI_API_KEY: backend-only; use the existing authorized secret.
- OPENAI_MODEL: gpt-6-sol; low reasoning effort for bounded latency.
- AI_WEB_ACCESS_SECRET: at least 32 random characters; keep stable across deploys.
- AI_USAGE_TABLE and AI_USAGE_REGION.
- STRIPE_NOVASPROUT_AI_LESSON_PRICE_ID.
- STRIPE_NOVASPROUT_AI_MONTHLY_PRICE_ID.
- STRIPE_NOVASPROUT_AI_PORTAL_CONFIGURATION_ID.
- Existing STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

Never prefix private keys with NEXT_PUBLIC_. The Amplify build persists server-only settings for SSR. Keep branch-role access restricted to trusted production code.

## Verification

npm run test:lesson-engine includes payment-tampering, nonce, restoration, refund/dispute, quota outage, signature replay, ownership, credit-refund and existing lesson/visual compatibility tests. npm run build performs framework/type checks. The admin-only /api/admin/ai-health endpoint checks actual SSR table access; POST runs a namespaced quota and credit-restoration smoke test without changing customer allowances.

Production verification opens real Checkout sessions without charging a card and rejects unpaid activation. A complete paid card charge is not performed automatically. Runtime npm audit is clean; remaining advisories are in the development lint/glob dependency chain with no compatible upstream fix.
