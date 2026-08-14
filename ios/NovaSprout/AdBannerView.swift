import GoogleMobileAds
import SwiftUI

struct NovaBannerAd: View {
    @EnvironmentObject private var ads: AdMobManager
    @State private var isLoaded = false

    var body: some View {
        if ads.canRequestAds {
            GeometryReader { proxy in
                let width = max(320, min(proxy.size.width, 720))
                let size = largeAnchoredAdaptiveBanner(width: width)
                BannerContainer(adSize: size, isLoaded: $isLoaded)
                    .frame(width: size.size.width, height: size.size.height)
                    .frame(maxWidth: .infinity)
                    .opacity(isLoaded ? 1 : 0)
            }
            .frame(height: isLoaded ? 100 : 1)
            .accessibilityLabel("Advertisement")
        }
    }
}

private struct BannerContainer: UIViewRepresentable {
    let adSize: AdSize
    @Binding var isLoaded: Bool

    func makeUIView(context: Context) -> BannerView {
        let banner = BannerView(adSize: adSize)
        banner.adUnitID = NovaAdConfiguration.bannerUnitID
        banner.delegate = context.coordinator
        banner.load(Request())
        return banner
    }

    func updateUIView(_ uiView: BannerView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(isLoaded: $isLoaded)
    }

    final class Coordinator: NSObject, BannerViewDelegate {
        private let isLoaded: Binding<Bool>

        init(isLoaded: Binding<Bool>) {
            self.isLoaded = isLoaded
        }

        func bannerViewDidReceiveAd(_ bannerView: BannerView) {
            isLoaded.wrappedValue = true
        }

        func bannerView(_ bannerView: BannerView, didFailToReceiveAdWithError error: Error) {
            isLoaded.wrappedValue = false
        }
    }
}
