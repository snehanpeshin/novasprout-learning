# App Review Response - Build 7

## Marketplace metadata

App name:

`NovaSprout AI Tutor`

Promotional text:

`Try the free sample lesson. Personalized AI lessons require a separate in-app purchase or monthly subscription.`

Add this disclosure near the beginning of the description:

`The free download includes a complete sample lesson. Creating personalized AI lessons, visual lesson decks, and scored quizzes requires a separate in-app purchase for one lesson or a monthly auto-renewing subscription.`

Every screenshot that shows personalized AI lesson creation must visibly include:

`Personalized AI lessons require an in-app purchase. Free sample included.`

## Reply to App Review

Hello App Review,

Thank you for the detailed feedback. We addressed all three issues in build 7.

For Guideline 2.3.8, the marketplace name and the name displayed on the device
are now both **NovaSprout AI Tutor**.

For Guideline 2.3.2, the promotional text and description now state that the
free download includes a sample lesson and that personalized AI lessons require
a separate in-app purchase or monthly subscription. Screenshots that reference
personalized lesson creation are also labelled **Personalized AI lessons
require an in-app purchase. Free sample included.**

For Guideline 2.1(b), build 7 packages Apple's root certificates directly with
the server verification code so sandbox StoreKit transactions can be verified
in the deployed environment. A purchased single lesson can also retry safely if
the first generation request is interrupted after Apple completes the purchase.
Monthly subscription entitlements are refreshed before an authorization retry.

Review steps:

1. Open **AI Tutor**.
2. Tap **Try a free sample** to use the included sample without a purchase.
3. Tap **Purchase access**.
4. Purchase **NovaSprout One AI Lesson** or **NovaSprout Monthly AI Tutor**.
5. Select a grade, subject, and topic, then tap **Create My Lesson**.
6. Confirm the generated lesson opens and can continue to the private visual
   lesson and scored quiz.
7. Use **Restore Purchases** to confirm monthly access restores correctly.

Product identifiers:

- `com.karigarihome.novasprout.lesson.single`
- `com.karigarihome.novasprout.subscription.monthly`

No account sign-in is required. All digital lesson purchases use Apple StoreKit,
and the app contains no external payment flow for digital content.
