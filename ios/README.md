# NovaSprout iOS App

Native SwiftUI app for iPhone and iPad. It uses the existing NovaSprout API for AI lesson generation and PDF compilation; no OpenAI or compiler secret is included in the app.

## Run locally

1. Open `NovaSprout.xcodeproj` in Xcode.
2. Select the `NovaSprout` scheme and an iPhone simulator.
3. Press Run.
4. Open the free sample lesson, or add a beta AI access code in Settings.

The production API base URL is set in `APIClient.swift`. Generated PDFs, lesson metadata, and quiz scores are stored locally on the device. The beta access code is stored in Keychain.

## App Store preparation

1. Enroll Karigari Home LLC in the Apple Developer Program.
2. In Xcode, open the NovaSprout target, choose Signing & Capabilities, select the Karigari Home LLC team, and confirm the bundle identifier `com.karigarihome.novasprout` is available.
3. Create the app in App Store Connect with the name `NovaSprout Learning` and primary category `Education`.
4. Complete the privacy, age rating, support URL, and review-information fields using the files in `AppStore/`.
5. Before charging for AI lessons in the app, replace beta access-code entitlement with StoreKit in-app purchases or subscriptions. Do not sell digital AI access through an external payment link in the iOS app.
6. Archive with a real device destination, then choose Distribute App and upload to App Store Connect.
7. Test with internal TestFlight first. Give App Review a working beta account or access code in Review Notes.

Live tutoring is a real-time person-to-person service and remains a separate booking/contact workflow. The iOS app contains no Stripe links and no advertising SDK.
