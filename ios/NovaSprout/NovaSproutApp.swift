import SwiftUI

@main
struct NovaSproutApp: App {
    @StateObject private var settings = AppSettings()
    @StateObject private var history = LessonHistoryStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(settings)
                .environmentObject(history)
                .tint(NovaPalette.blue)
        }
    }
}
