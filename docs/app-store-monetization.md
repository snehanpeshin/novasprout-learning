# NovaSprout App Store Monetization

NovaSprout uses Apple In-App Purchase for AI-generated digital lessons. Live
one-to-one tutoring remains a separate person-to-person service.

## Products

Create these products in **App Store Connect > NovaSprout Learning >
Monetization**.

### One AI lesson

- Type: Consumable
- Reference name: `NovaSprout One AI Lesson`
- Product ID: `com.karigarihome.novasprout.lesson.single`
- Suggested U.S. price: `$2.99`
- Display name: `One AI Lesson`
- Description: `One personalized visual lesson with a timed quiz.`

### Monthly AI Tutor

- Type: Auto-Renewable Subscription
- Reference name: `NovaSprout Monthly AI Tutor`
- Product ID: `com.karigarihome.novasprout.subscription.monthly`
- Subscription group: `NovaSprout AI Tutor`
- Duration: One month
- Suggested U.S. price: `$14.99`
- Display name: `Monthly AI Tutor`
- Description: `Create up to 20 personalized visual lessons each subscription month.`

Prices displayed by the app come from StoreKit and are localized by Apple.

## App Store Connect preparation

1. In **Business**, accept the Paid Apps Agreement.
2. Complete banking and tax information for Karigari Home LLC.
3. Create both products exactly as listed above.
4. Add an App Review screenshot and localization to each product.
5. Add the subscription's privacy and standard-EULA links.
6. Submit the products with the app version for review.

The first subscription and in-app purchase should be included with a new app
version submission. Explain both products in App Review Notes.

## Supabase migration

Run the current `docs/database-schema.sql` in Supabase SQL Editor. In addition to
the payment tables, it creates:

- `apple_iap_lesson_uses`: prevents a consumable transaction from starting more
  than one lesson.
- `apple_iap_subscription_usage`: limits each monthly renewal transaction to 20
  generated lessons.
- `claim_apple_subscription_lesson`: atomically claims a subscription lesson.

## Amplify variables

Add these to the production branch and redeploy:

```text
APPLE_APP_ID=YOUR_NUMERIC_APPLE_ID
APPLE_IAP_SINGLE_LESSON_PRODUCT_ID=com.karigarihome.novasprout.lesson.single
APPLE_IAP_MONTHLY_PRODUCT_ID=com.karigarihome.novasprout.subscription.monthly
```

`APPLE_APP_ID` is the numeric Apple ID shown under **App Information** in App
Store Connect. It is not the bundle ID.

The existing Supabase variables are also required:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
```

## Security model

1. StoreKit verifies the purchase on the device.
2. The app sends Apple's signed transaction JWS to NovaSprout.
3. The backend verifies the JWS with Apple's official App Store Server library
   and Apple root certificates.
4. The backend checks the bundle ID, product ID, environment, expiration, and
   revocation status.
5. Supabase prevents consumable reuse and enforces the monthly lesson limit.

The app contains no Stripe secret, OpenAI secret, Supabase key, or Apple server
private key.

## Sandbox test

1. Create a Sandbox Apple Account in App Store Connect.
2. Upload the build to TestFlight after both products are available.
3. Sign in to the sandbox account when the purchase sheet requests it.
4. Buy one lesson and confirm exactly one new lesson can start.
5. Subscribe and confirm lesson generation and Restore Purchases work.
6. Use App Store Connect or the StoreKit transaction manager to test expiration,
   cancellation, and refund behavior.
