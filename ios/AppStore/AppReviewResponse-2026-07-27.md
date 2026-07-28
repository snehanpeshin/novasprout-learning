# App Review Response - Submission a709dc09-78b4-46b8-981f-d364589a9fc5

Use this response after build 6 is uploaded and the checklist below is complete.

## Reply to App Review

Hello App Review,

Thank you for identifying these issues. We addressed both items in build 6.

For Guideline 2.1(b), the app now refreshes the current StoreKit entitlement and
automatically retries lesson creation when an entitlement has become stale. The
server also continues to honor a cryptographically verified, active Apple
monthly subscription during a temporary usage-database outage. Normal monthly
quota enforcement resumes when that database is available.

For Guideline 2.3.2, we removed the app screenshot from the promoted In-App
Purchase metadata. We will add promotional artwork only when we have a unique
image that represents the associated purchase and contains no small text.

Review steps:

1. Open the AI Tutor tab.
2. Purchase or restore NovaSprout Monthly AI Tutor.
3. Confirm that "AI Tutor access active" appears.
4. Select a grade and subject, enter a school topic, and tap "Create My Lesson."
5. Review the generated lesson and start the private visual lesson.
6. The free sample remains available without purchase from "Try a free sample."

The In-App Purchase products use StoreKit. The app contains no external payment
flow for digital lessons.

Thank you.

## Required checks before sending

- Upload and select NovaSprout `1.0 (6)`.
- Delete the current promotional image from each promoted In-App Purchase.
- Confirm the Paid Apps Agreement is active in App Store Connect Business.
- Confirm tax and banking information is complete.
- Confirm both product IDs are available in the build's StoreKit product list.
- Run `docs/database-schema.sql` in the production Supabase project.
- Add the production Supabase and Apple IAP environment variables in Amplify.
- Redeploy Amplify after the server changes.
- Test purchase, restore, and one generated lesson with a Sandbox Apple Account.
- Test on an iPad simulator or physical iPad before resubmitting.

Do not tell App Review that the Paid Apps Agreement, sandbox test, or production
deployment is complete until each item has actually been confirmed.
