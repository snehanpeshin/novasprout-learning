# Draft App Privacy Answers

These are preparation notes, not legal advice. Reconfirm them against the production backend and current Apple definitions before submission.

## Tracking

- Data used to track users: No. NovaSprout configures the ad SDK for child-directed, general-audience content and does not request App Tracking Transparency permission.
- Reconfirm the final App Store privacy labels against Google's current Mobile Ads SDK disclosure before submitting build 8.

## Data linked to the user

- The first release has no account creation and no app analytics SDK.
- Live-tutor email and booking actions open the user's external email or browser app; NovaSprout receives information only when the user submits it there.
- Purchase history: Apple-signed transaction ID, product ID, purchase state, and subscription expiration are sent to NovaSprout servers for App Functionality, fraud prevention, consumable-use control, and subscription limits. No payment-card number is received.

## User content sent for AI processing

- Lesson topic, grade range, subject, learning goal, and optional student question are sent to NovaSprout servers and OpenAI to generate requested content.
- Determine whether to disclose this as Other User Content under Product Personalization or App Functionality based on the final retention configuration and Apple's current optional-disclosure rules for ephemeral processing.
- Do not claim that user prompts are never retained until the production provider settings and logs have been verified.

## Data stored locally

- Lesson PDFs, lesson metadata, and quiz scores are stored on the device.
- The beta access code is stored in Keychain.
- Users can clear lesson history in Settings; uninstalling removes local app data.

## Tracking and advertising

- Purchase and lesson data are not used for cross-company tracking or advertising.
- Google AdMob may process device, ad-interaction, diagnostic, and approximate-location information for ad delivery, fraud prevention, consent, and measurement according to Google's SDK disclosure.
- A banner may appear on the Learn screen after consent where required. Ads do not appear inside an active lesson or quiz.
- The app requests child-directed treatment and a general maximum ad-content rating from the Mobile Ads SDK.
