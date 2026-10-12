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

## Interactive instruction (October 11, 2026)
The primary learning experience is now a captioned interactive studio: concrete warm-up, small explanations, numbered worked reasoning, interleaved practice, misconception repair, and six retrieval checks. Practice solutions remain hidden until an attempt; quizzes give specific feedback and allow retry. Typed practice is self-comparison, not automated grading; the existing AI coach can assess an attempt. PDF slides remain an optional offline export.
OpenAI gpt-4o-mini-tts with the marin voice narrates one visible teaching beat at a time. The voice is clearly labeled AI-generated. The protected narration route retrieves the original server lesson and verifies owner and signed ticket; it never accepts arbitrary narration text. Each paid lesson has 60 generated clips, cached as object URLs in the browser for replay and released on unmount. Failed provider calls restore the clip allowance. Sample voice uses browser speech synthesis without API cost.
“Watch step-by-step” progressively reveals captioned reasoning at reading pace and stops at the activity; it is a browser animation, not a generated video file. Reduced-motion users receive the same content without reveal animations. Learners control narration and movement; no microphone or recording is used.

Learners can send a practice attempt into the existing coach form with one click and request a contextual hint; the same 10-question allowance applies.

## Video-format pilot (October 12, 2026)
The public tutor page includes a 34-second, original fraction demonstration with drawn animation, OpenAI gpt-4o-mini-tts narration, English WebVTT captions, a readable transcript, and a retryable comprehension question. It is a reusable free preview, not per-lesson generative footage. Existing prices and allowances are unchanged; playback does not call an AI API.
OpenAI shut down Sora and its Videos API on September 24, 2026, with no one-to-one replacement according to https://developers.openai.com/api/docs/guides/video-generation. Native generative video requires a separate provider connection; Runway was discovered and suggested but is not yet connected. Do not present this pilot as footage generated by a video model.

## Personalized narrated animation (October 12, 2026)
Each completed personalized lesson now offers Create My Video Lesson. The server verifies access and the signed lesson ticket, retrieves the original OpenAI lesson, and creates a 3–4-scene structured storyboard. Fixed renderers animate fraction sectors, number lines, data bars, reasoning steps, ordered sequences, comparisons, and labeled ideas; generated code is never executed. The original lesson's first validated quiz item is the comprehension check.
Storyboards are cached under hashed lesson identifiers in the existing DynamoDB table, bound to the owner, with access expiry and TTL based on the original 24-hour lesson ticket. The existing compute role already grants the necessary scoped GetItem/PutItem/UpdateItem actions; no new AWS permissions are needed. Two planning reservations allow recovery from an interrupted request; the first completed cached plan is reused. Failed planning restores its reservation.
Each video scene permits two narration preparations. Successful buffers are reused during the visit, including partial retries. Failed provider requests restore the clip reservation. OpenAI voice and diagrams play together; pause/resume preserves the position and playback pauses when the tab is hidden. Captions and a full transcript remain readable. Where browser recording is supported, finishing playback produces a downloadable MP4 or WebM plus WebVTT captions. The animation and virtual audio stream are recorded, never a microphone or the student's screen.
The chosen format uses the existing OpenAI key, gpt-6-sol storyboard generation, and gpt-4o-mini-tts narration. Native generative footage and Runway are not required for this launch.
