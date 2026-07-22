import SwiftUI

@main
struct NovaSproutApp: App {
    @StateObject private var settings = AppSettings()
    @StateObject private var history = LessonHistoryStore()
    @StateObject private var purchases = PurchaseManager()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(settings)
                .environmentObject(history)
                .environmentObject(purchases)
                .tint(NovaPalette.blue)
        }
    }
}
