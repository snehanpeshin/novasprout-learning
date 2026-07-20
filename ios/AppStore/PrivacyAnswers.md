# Draft App Privacy Answers

These are preparation notes, not legal advice. Reconfirm them against the production backend and current Apple definitions before submission.

## Tracking

- Data used to track users: No.
- App Tracking Transparency prompt required: No, provided no tracking SDK is added.

## Data linked to the user

- The first release has no account creation and no app analytics SDK.
- Live-tutor email and booking actions open the user's external email or browser app; NovaSprout receives information only when the user submits it there.

## User content sent for AI processing

- Lesson topic, grade range, subject, learning goal, and optional student question are sent to NovaSprout servers and OpenAI to generate requested content.
- Determine whether to disclose this as Other User Content under Product Personalization or App Functionality based on the final retention configuration and Apple's current optional-disclosure rules for ephemeral processing.
- Do not claim that user prompts are never retained until the production provider settings and logs have been verified.

## Data stored locally

- Lesson PDFs, lesson metadata, and quiz scores are stored on the device.
- The beta access code is stored in Keychain.
- Users can clear lesson history in Settings; uninstalling removes local app data.
