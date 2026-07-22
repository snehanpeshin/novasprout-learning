# NovaSprout App Store Checklist

## Apple account

- Enroll Karigari Home LLC as an organization in the Apple Developer Program.
- Obtain or confirm the company's D-U-N-S number.
- Use an email address on the company website domain for organization verification.
- Accept the latest agreements in App Store Connect.

## App record

- App name: NovaSprout Learning
- Bundle ID: `com.karigarihome.novasprout`
- SKU: `NOVASPROUT-IOS-001`
- Primary category: Education
- Support URL: `https://www.novasproutlearning.com`
- Privacy URL: `https://www.novasproutlearning.com/privacy`
- Copyright: Karigari Home LLC

## Build and review

- Select the Karigari Home LLC signing team in Xcode.
- Test on at least one current iPhone and iPad simulator or device.
- Verify the free sample, AI access, PDF lesson, timer, quiz, local library, email, phone, and Calendly links.
- Archive a Release build and upload it through Xcode Organizer.
- Add a working review access code and concise test steps to App Review Information.
- Use `AppStoreListing.md` for the subtitle, description, keywords, URLs, and review notes.
- Start with TestFlight. Do not submit the beta access code as a paid digital unlock.

## Selling AI access

- Create the StoreKit products listed in `docs/app-store-monetization.md`.
- Run the latest Supabase schema and add the Apple IAP Amplify variables.
- Confirm signed-transaction verification in TestFlight sandbox testing.
- Submit both in-app purchases with the app version for review.

## Child safety and privacy

- Do not select the Kids Category until parental gates, child-data handling, third-party SDK review, and age-appropriate requirements have been fully implemented and reviewed.
- Keep prompts free of sensitive student information.
- Confirm App Store privacy answers match actual server and OpenAI retention behavior.
- Do not add Google Ads or third-party advertising tracking to the native app.
