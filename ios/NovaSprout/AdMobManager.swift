import Combine
import Foundation
import GoogleMobileAds
import UserMessagingPlatform

@MainActor
final class AdMobManager: ObservableObject {
    static let shared = AdMobManager()

    @Published private(set) var canRequestAds = false
    @Published private(set) var isPrivacyOptionsRequired = false

    private var didStartSDK = false

    var isConfigured: Bool {
        let value = Bundle.main.object(forInfoDictionaryKey: "GADApplicationIdentifier") as? String
        return value?.hasPrefix("ca-app-pub-") == true && value?.contains("~") == true
    }

    func prepare() {
        guard isConfigured else { return }

        let parameters = RequestParameters()
        ConsentInformation.shared.requestConsentInfoUpdate(with: parameters) { [weak self] _ in
            Task { @MainActor in
                do {
                    try await ConsentForm.loadAndPresentIfRequired(from: nil)
                } catch {
                    // Consent errors should not interrupt learning. The SDK's
                    // canRequestAds value remains the source of truth.
                }
                self?.refreshConsentState()
            }
        }
    }

    func presentPrivacyOptions() async {
        guard isPrivacyOptionsRequired else { return }
        try? await ConsentForm.presentPrivacyOptionsForm(from: nil)
        refreshConsentState()
    }

    private func refreshConsentState() {
        isPrivacyOptionsRequired = ConsentInformation.shared.privacyOptionsRequirementStatus == .required
        canRequestAds = ConsentInformation.shared.canRequestAds
        startSDKIfAllowed()
    }

    private func startSDKIfAllowed() {
        guard canRequestAds, !didStartSDK else { return }
        didStartSDK = true

        let configuration = MobileAds.shared.requestConfiguration
        configuration.ageRestrictedTreatment = .child
        configuration.maxAdContentRating = .general
        MobileAds.shared.start()
    }
}

enum NovaAdConfiguration {
    #if DEBUG
    static let bannerUnitID = "ca-app-pub-3940256099942544/2435281174"
    #else
    static let bannerUnitID = "ca-app-pub-6605747981994820/1726782659"
    #endif

    static let interstitialUnitID = "ca-app-pub-6605747981994820/2777758413"
    static let rewardedUnitID = "ca-app-pub-6605747981994820/8165816466"
}
