import SwiftUI

@main
struct NovaSproutApp: App {
    @StateObject private var settings = AppSettings()
    @StateObject private var history = LessonHistoryStore()
    @StateObject private var purchases = PurchaseManager()
    @StateObject private var ads = AdMobManager.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(settings)
                .environmentObject(history)
                .environmentObject(purchases)
                .environmentObject(ads)
                .tint(NovaPalette.blue)
                .task { ads.prepare() }
        }
    }
}
